'use client';

import { useRef, useState } from 'react';
import type { OrderStage, StageStatus } from '@/lib/types';
import Button from '@/components/ui/Button';
import { CheckCircle2, Circle, Loader2, Plus, Trash2, Clock, Edit2, Save, GripVertical, MessageCircle } from 'lucide-react';
import { formatDate, buildStageReminderMessage, openWhatsApp, slugify } from '@/lib/utils';
import { uploadStageAttachment } from '@/lib/attachments';
import AttachmentPicker from './AttachmentPicker';
import AttachmentGallery from './AttachmentGallery';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

interface StageTimelineProps {
  orderId: string;
  initialStages: OrderStage[];
  canEdit: boolean;
  /** Whether the viewer may send WhatsApp updates to the client (staff of this order). */
  canNotify: boolean;
  clientFirstName: string;
  clientWhatsapp: string;
  publicToken: string;
}

const STATUS_ICONS: Record<StageStatus, React.ReactNode> = {
  done: <CheckCircle2 size={20} color="#10b981" />,
  in_progress: <Loader2 size={20} color="#F6A00C" style={{ animation: 'spin 1.5s linear infinite' }} />,
  pending: <Circle size={20} color="var(--color-text-muted)" />,
};

// Clase visual de la tarjeta según el estado de la etapa.
const STAGE_CLASS: Record<StageStatus, string> = {
  done: 'stage-card is-done',
  in_progress: 'stage-card is-active',
  pending: 'stage-card',
};

export default function StageTimeline({
  orderId,
  initialStages,
  canEdit,
  canNotify,
  clientFirstName,
  clientWhatsapp,
  publicToken,
}: StageTimelineProps) {
  const [stages, setStages] = useState<OrderStage[]>(
    [...initialStages].sort((a, b) => a.position - b.position)
  );
  const [newStageName, setNewStageName] = useState('');
  const [addingStage, setAddingStage] = useState(false);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [pickerStageId, setPickerStageId] = useState<string | null>(null);

  async function uploadAttachments(stageId: string, files: File[]) {
    setUploadingId(stageId);
    for (const file of files) {
      try {
        // Compress images, upload straight to Storage (signed URL), record row.
        const att = await uploadStageAttachment(orderId, stageId, file);
        // Append as soon as each file finishes so they appear progressively.
        setStages((prev) =>
          prev.map((s) =>
            s.id === stageId ? { ...s, attachments: [...(s.attachments ?? []), att] } : s
          )
        );
      } catch (err) {
        alert(err instanceof Error ? err.message : `No se pudo subir "${file.name}"`);
      }
    }
    setUploadingId(null);
  }

  async function deleteAttachment(stageId: string, attachmentId: string) {
    if (!attachmentId) return;
    if (!confirm('¿Eliminar este adjunto?')) return;

    // Optimista: quitarlo de inmediato y revertir si el servidor falla.
    const snapshot = stages;
    setStages((prev) =>
      prev.map((s) =>
        s.id === stageId
          ? { ...s, attachments: (s.attachments ?? []).filter((a) => a.id !== attachmentId) }
          : s
      )
    );

    let res: Response;
    try {
      res = await fetch(
        `/api/orders/${orderId}/stages/${stageId}/attachments/${attachmentId}`,
        { method: 'DELETE' }
      );
    } catch {
      setStages(snapshot);
      alert('No se pudo eliminar el adjunto: revisa tu conexión e intenta de nuevo.');
      return;
    }

    if (!res.ok) {
      setStages(snapshot);
      const data = await res.json().catch(() => ({}));
      alert(data.error || 'No se pudo eliminar el adjunto. Intenta de nuevo.');
    }
  }

  function startEdit(stage: OrderStage) {
    setEditingId(stage.id);
    setEditName(stage.name);
    setEditDesc(stage.description ?? '');
  }

  function cancelEdit() {
    setEditingId(null);
    setEditName('');
    setEditDesc('');
  }

  async function saveEdit(stageId: string) {
    if (!editName.trim()) return;
    setLoadingId(stageId);
    const res = await fetch(`/api/orders/${orderId}/stages/${stageId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: editName.trim(), description: editDesc.trim() || null }),
    });
    setLoadingId(null);
    if (res.ok) {
      const updated: OrderStage = await res.json();
      // Merge (keep attachments, which the PATCH response doesn't include).
      setStages((prev) => prev.map((s) => (s.id === stageId ? { ...s, ...updated } : s)));
      cancelEdit();
    }
  }

  async function updateStage(stageId: string, newStatus: StageStatus) {
    // Optimistic: change the icon instantly, reconcile/revert with the server.
    const snapshot = stages;
    setStages((prev) =>
      prev.map((s) =>
        s.id === stageId
          ? {
              ...s,
              status: newStatus,
              completed_at: newStatus === 'done' ? new Date().toISOString() : null,
            }
          : s
      )
    );

    const res = await fetch(`/api/orders/${orderId}/stages/${stageId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    });

    if (res.ok) {
      const updated: OrderStage = await res.json();
      // Merge to keep attachments (not returned by the PATCH).
      setStages((prev) => prev.map((s) => (s.id === stageId ? { ...s, ...updated } : s)));
    } else {
      setStages(snapshot);
      alert('No se pudo actualizar la etapa');
    }
  }

  async function addCustomStage() {
    if (!newStageName.trim()) return;
    setLoadingId('new');
    const res = await fetch(`/api/orders/${orderId}/stages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newStageName.trim() }),
    });
    setLoadingId(null);
    if (res.ok) {
      const created: OrderStage = await res.json();
      setStages((prev) => [...prev, created]);
      setNewStageName('');
      setAddingStage(false);
    }
  }

  async function deleteStage(stageId: string) {
    if (!confirm('¿Eliminar esta etapa?')) return;
    setLoadingId(stageId);
    const res = await fetch(`/api/orders/${orderId}/stages/${stageId}`, {
      method: 'DELETE',
    });
    setLoadingId(null);
    if (res.ok) {
      setStages((prev) => prev.filter((s) => s.id !== stageId));
    }
  }

  function cycleStatus(current: StageStatus): StageStatus {
    const cycle: StageStatus[] = ['pending', 'in_progress', 'done'];
    const idx = cycle.indexOf(current);
    return cycle[(idx + 1) % cycle.length];
  }

  // --- Reordenar arrastrando (pointer events: funciona en touch y mouse) -----
  // Se puede arrastrar cualquier etapa hacia arriba o abajo y soltarla en la
  // posición que se quiera (antes o después de cualquier otra). Mientras dura
  // el arrastre escuchamos en `window`, así el movimiento se sigue aunque el
  // puntero se salga del asa cuando las filas se reordenan.
  const rowRefs = useRef<Array<HTMLDivElement | null>>([]);
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  function startDrag(index: number, e: React.PointerEvent) {
    if (!canEdit) return;
    e.preventDefault();
    const state = { index, order: stages.slice(), snapshot: stages };
    setDragIndex(index);

    const onMove = (ev: PointerEvent) => {
      ev.preventDefault();
      const y = ev.clientY;
      // Buscar la posición cuyo punto medio queda justo debajo del puntero.
      let target = state.order.length - 1;
      for (let i = 0; i < state.order.length; i++) {
        const el = rowRefs.current[i];
        if (!el) continue;
        const r = el.getBoundingClientRect();
        if (y < r.top + r.height / 2) {
          target = i;
          break;
        }
      }
      if (target !== state.index) {
        const next = state.order.slice();
        const [moved] = next.splice(state.index, 1);
        next.splice(target, 0, moved);
        state.order = next;
        state.index = target;
        setStages(next);
        setDragIndex(target);
      }
    };

    const onUp = async () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
      setDragIndex(null);

      const ids = state.order.map((s) => s.id);
      const unchanged = state.snapshot.every((s, i) => s.id === ids[i]);
      if (unchanged) return;

      // Persistir; mantener las posiciones sincronizadas localmente.
      setStages((prev) => prev.map((s, i) => ({ ...s, position: i + 1 })));
      const res = await fetch(`/api/orders/${orderId}/stages/reorder`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids }),
      });
      if (!res.ok) {
        setStages(state.snapshot);
        alert('No se pudo guardar el nuevo orden de las etapas');
      }
    };

    window.addEventListener('pointermove', onMove, { passive: false });
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
  }

  const done = stages.filter((s) => s.status === 'done').length;
  const progress = stages.length > 0 ? Math.round((done / stages.length) * 100) : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      {/* Resumen de progreso */}
      <div className="card" style={{ padding: '15px 16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
          <span style={{ fontSize: 13, fontWeight: 600 }}>Progreso general</span>
          <span style={{ fontSize: 13, color: 'var(--color-brand-500)', fontWeight: 700 }}>
            {done}/{stages.length} etapas
          </span>
        </div>
        <div className="progress-track" style={{ height: 6 }}>
          <div
            className={`progress-fill${progress === 100 ? ' is-complete' : ''}`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Línea de tiempo */}
      <div style={{ position: 'relative' }}>
        {/* Línea vertical */}
        <div className="timeline-line" style={{ left: 9, top: 10, bottom: 10 }} />

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {stages.map((stage, index) => {
            const isLoading = loadingId === stage.id;
            return (
              <div
                key={stage.id}
                ref={(el) => {
                  rowRefs.current[index] = el;
                }}
                className="animate-fade-in"
                style={{
                  display: 'flex',
                  gap: 14,
                  alignItems: 'flex-start',
                  position: 'relative',
                  zIndex: dragIndex === index ? 2 : 1,
                  animationDelay: `${index * 50}ms`,
                  opacity: dragIndex === index ? 0.6 : 1,
                }}
              >
                {/* Icono de estado */}
                <div
                  style={{
                    marginTop: 12,
                    flexShrink: 0,
                    background: 'var(--color-bg)',
                    borderRadius: '50%',
                    display: 'flex',
                  }}
                >
                  {isLoading ? (
                    <Loader2 size={20} color="var(--color-brand-500)" style={{ animation: 'spin 0.8s linear infinite' }} />
                  ) : (
                    STATUS_ICONS[stage.status]
                  )}
                </div>

                {/* Tarjeta */}
                <div className={STAGE_CLASS[stage.status]} style={{ flex: 1, minWidth: 0 }}>
                  {editingId === stage.id ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <input
                        className="form-input"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        placeholder="Nombre de la etapa"
                        autoFocus
                      />
                      <textarea
                        className="form-input"
                        value={editDesc}
                        onChange={(e) => setEditDesc(e.target.value)}
                        placeholder="Descripción (opcional)"
                        rows={2}
                      />
                      <div style={{ display: 'flex', gap: 8 }}>
                        <Button
                          variant="primary"
                          size="sm"
                          loading={isLoading}
                          onClick={() => saveEdit(stage.id)}
                        >
                          <Save size={13} />
                          Guardar
                        </Button>
                        <Button variant="ghost" size="sm" onClick={cancelEdit}>
                          Cancelar
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                        <span className="stage-name">{stage.name}</span>

                        {canEdit && (
                          <div style={{ display: 'flex', gap: 6, flexShrink: 0, alignItems: 'center' }}>
                            <button
                              onPointerDown={(e) => startDrag(index, e)}
                              title="Mantén y arrastra para mover la etapa arriba o abajo"
                              aria-label="Arrastrar para reordenar etapa"
                              className="action-pill"
                              style={{
                                padding: 6,
                                cursor: dragIndex === index ? 'grabbing' : 'grab',
                                touchAction: 'none',
                                color: dragIndex === index ? 'var(--color-brand-500)' : undefined,
                              }}
                            >
                              <GripVertical size={16} />
                            </button>
                            <button
                              onClick={() => updateStage(stage.id, cycleStatus(stage.status))}
                              disabled={isLoading}
                              className="action-pill"
                              style={{ padding: '5px 11px', fontSize: 11.5 }}
                            >
                              {stage.status === 'pending'
                                ? 'Iniciar'
                                : stage.status === 'in_progress'
                                ? 'Completar'
                                : 'Reabrir'}
                            </button>
                            <button
                              onClick={() => startEdit(stage)}
                              disabled={isLoading}
                              title="Editar título y descripción"
                              aria-label="Editar etapa"
                              className="action-pill"
                              style={{ padding: 6 }}
                            >
                              <Edit2 size={13} />
                            </button>
                          </div>
                        )}
                      </div>

                      {stage.description && (
                        <p
                          style={{
                            fontSize: 12.5,
                            color: 'var(--color-text-secondary)',
                            marginTop: 7,
                            whiteSpace: 'pre-wrap',
                          }}
                        >
                          {stage.description}
                        </p>
                      )}

                      {stage.completed_at && (
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4,
                            marginTop: 6,
                            color: 'var(--color-text-muted)',
                            fontSize: 11,
                          }}
                        >
                          <Clock size={10} />
                          <span>{formatDate(stage.completed_at)}</span>
                        </div>
                      )}

                      {stage.attachments && stage.attachments.length > 0 && (
                        <AttachmentGallery
                          attachments={stage.attachments}
                          canEdit={canEdit}
                          onDelete={(id) => deleteAttachment(stage.id, id)}
                        />
                      )}

                      {(canEdit || canNotify) && (
                        <div className="action-row" style={{ marginTop: 12 }}>
                          {canEdit && (
                            <button
                              onClick={() => setPickerStageId(stage.id)}
                              disabled={uploadingId === stage.id}
                              className="action-pill"
                            >
                              {uploadingId === stage.id ? (
                                <Loader2 size={13} style={{ animation: 'spin 0.8s linear infinite' }} />
                              ) : (
                                <Plus size={13} />
                              )}
                              {uploadingId === stage.id
                                ? 'Subiendo...'
                                : 'Agregar foto, video, nota de voz o documento'}
                            </button>
                          )}

                          {canNotify && (
                            <button
                              onClick={() =>
                                openWhatsApp(
                                  clientWhatsapp,
                                  buildStageReminderMessage(
                                    clientFirstName,
                                    stage.name,
                                    stage.status,
                                    publicToken,
                                    SITE_URL,
                                    slugify(stage.name) === 'entrega-final'
                                  )
                                )
                              }
                              title="Enviar aviso de esta etapa al cliente por WhatsApp"
                              className="action-pill action-pill-wa"
                            >
                              <MessageCircle size={13} />
                              Avisar al cliente
                            </button>
                          )}

                          {canEdit && (
                            <button
                              onClick={() => deleteStage(stage.id)}
                              disabled={isLoading}
                              title="Eliminar etapa"
                              aria-label="Eliminar etapa"
                              className="action-pill action-pill-danger"
                              style={{ padding: 7, marginLeft: 'auto' }}
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Agregar etapa personalizada */}
      {canEdit && (
        <div>
          {addingStage ? (
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                className="form-input"
                placeholder="Nombre de la nueva etapa..."
                value={newStageName}
                onChange={(e) => setNewStageName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addCustomStage()}
                autoFocus
                style={{ flex: 1 }}
              />
              <Button
                variant="primary"
                size="sm"
                loading={loadingId === 'new'}
                onClick={addCustomStage}
              >
                Agregar
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setAddingStage(false);
                  setNewStageName('');
                }}
              >
                Cancelar
              </Button>
            </div>
          ) : (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setAddingStage(true)}
            >
              <Plus size={14} />
              Agregar etapa personalizada
            </Button>
          )}
        </div>
      )}

      {/* Attachment picker modal (shared by all stages) */}
      {pickerStageId && (
        <AttachmentPicker
          onFiles={(files) => uploadAttachments(pickerStageId, files)}
          onClose={() => setPickerStageId(null)}
        />
      )}
    </div>
  );
}
