'use client';

import type { Strategist } from '@/lib/types';
import CopyLinkButton from '@/components/orders/CopyLinkButton';
import { Phone, Mail, Edit2, Trash2, ToggleLeft, ToggleRight, KeyRound } from 'lucide-react';
import { getInitials } from '@/lib/utils';

interface StrategistCardProps {
  strategist: Strategist;
  onEdit?: (strategist: Strategist) => void;
  onResend?: (strategist: Strategist) => void;
  onToggleActive?: (id: string, active: boolean) => void;
  onDelete?: (id: string) => void;
}

export default function StrategistCard({
  strategist,
  onEdit,
  onResend,
  onToggleActive,
  onDelete,
}: StrategistCardProps) {
  async function handleToggle() {
    const res = await fetch(`/api/strategists/${strategist.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active: !strategist.active }),
    });
    if (res.ok) onToggleActive?.(strategist.id, !strategist.active);
  }

  async function handleDelete() {
    if (!confirm(`¿Desactivar a ${strategist.full_name}?`)) return;
    const res = await fetch(`/api/strategists/${strategist.id}`, { method: 'DELETE' });
    if (res.ok) onDelete?.(strategist.id);
  }

  return (
    <div
      className="card card-accent"
      style={
        {
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
          opacity: strategist.active ? 1 : 0.62,
          '--accent-color': strategist.active
            ? 'var(--color-turquoise)'
            : 'var(--color-border-strong)',
        } as React.CSSProperties
      }
    >
      {/* Identidad */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 13, minWidth: 0 }}>
        <div className="avatar" style={{ width: 46, height: 46, fontSize: 15 }} aria-hidden="true">
          {getInitials(strategist.full_name)}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <p style={{ fontWeight: 700, fontSize: 15.5, letterSpacing: '-0.01em' }}>
              {strategist.full_name}
            </p>
            <span className={`badge ${strategist.active ? 'badge-success' : 'badge-neutral'}`}>
              {strategist.active ? 'Activo' : 'Inactivo'}
            </span>
          </div>

          {strategist.email && (
            <p
              style={{
                color: 'var(--color-text-secondary)',
                fontSize: 12.5,
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                marginTop: 4,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              <Mail size={12} style={{ flexShrink: 0 }} />
              {strategist.email}
            </p>
          )}

          {strategist.phone && (
            <p
              style={{
                color: 'var(--color-text-secondary)',
                fontSize: 12.5,
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                marginTop: 3,
              }}
            >
              <Phone size={12} />
              {strategist.phone}
            </p>
          )}
        </div>
      </div>

      <div className="divider" style={{ margin: 0 }} />

      {/* Acciones */}
      <div className="action-row">
        {strategist.email && <CopyLinkButton url={strategist.email} label="Copiar email" />}

        {onResend && (
          <button
            type="button"
            onClick={() => onResend(strategist)}
            className="action-pill action-pill-wa"
          >
            <KeyRound size={13} />
            Reenviar acceso
          </button>
        )}

        <button
          type="button"
          className="action-pill"
          onClick={() => onEdit?.(strategist)}
          aria-label="Editar estratega"
          title="Editar estratega"
        >
          <Edit2 size={14} />
        </button>

        <button
          type="button"
          className="action-pill"
          onClick={handleToggle}
          aria-label={strategist.active ? 'Desactivar estratega' : 'Activar estratega'}
          title={strategist.active ? 'Desactivar' : 'Activar'}
        >
          {strategist.active ? (
            <ToggleRight size={18} color="var(--color-brand-500)" />
          ) : (
            <ToggleLeft size={18} />
          )}
        </button>

        <button
          type="button"
          className="action-pill action-pill-danger"
          onClick={handleDelete}
          aria-label="Desactivar estratega"
          title="Desactivar estratega"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
}
