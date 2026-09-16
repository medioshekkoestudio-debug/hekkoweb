'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Order, Profile, Strategist, OrderStatus } from '@/lib/types';
import { serviceLabel } from '@/lib/types';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import OrderForm from '@/components/orders/OrderForm';
import StrategistForm from '@/components/strategists/StrategistForm';
import StrategistSelect from '@/components/orders/StrategistSelect';
import Select from '@/components/ui/Select';
import StageTimeline from '@/components/orders/StageTimeline';
import InitialAttachments from '@/components/orders/InitialAttachments';
import CopyLinkButton from '@/components/orders/CopyLinkButton';
import {
  formatDate,
  buildWhatsAppLink,
  openWhatsApp,
  buildTrackingMessage,
} from '@/lib/utils';
import {
  ArrowLeft,
  MessageCircle,
  Edit2,
  Trash2,
  Briefcase,
  Tag,
  User,
  Phone,
  Calendar,
  ExternalLink,
  Info,
  ListChecks,
  Paperclip,
} from 'lucide-react';

interface OrderDetailClientProps {
  order: Order;
  strategists: Profile[];
  startInEdit: boolean;
  /** Nombre de la empresa, para los mensajes al cliente. */
  companyName: string;
}

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

const STATUS_OPTIONS: { value: OrderStatus; label: string }[] = [
  { value: 'sin_estratega', label: 'Sin estratega asignado' },
  { value: 'con_estratega', label: 'En progreso' },
  { value: 'entregada', label: 'Entregado' },
];

type TabKey = 'resumen' | 'etapas' | 'archivos';

export default function OrderDetailClient({
  order: initialOrder,
  strategists: initialStrategists,
  startInEdit,
  companyName,
}: OrderDetailClientProps) {
  const router = useRouter();
  const [order, setOrder] = useState<Order>(initialOrder);
  const [strategists, setStrategists] = useState<Profile[]>(initialStrategists);
  const [showEdit, setShowEdit] = useState(startInEdit);
  const [showAddStrategist, setShowAddStrategist] = useState(false);
  const [changingStatus, setChangingStatus] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [tab, setTab] = useState<TabKey>('resumen');

  const clientName = `${order.client_first_name} ${order.client_last_name}`;
  const trackingUrl = `${SITE_URL}/tracking/${order.public_token}`;
  const waLink = buildWhatsAppLink(
    order.client_whatsapp,
    buildTrackingMessage(order.client_first_name, order.public_token, SITE_URL, companyName)
  );

  async function handleDelete() {
    if (!confirm(`¿Eliminar la orden de ${clientName}?`)) return;
    const res = await fetch(`/api/orders/${order.id}`, { method: 'DELETE' });
    if (res.ok) router.push('/admin/ordenes');
  }

  async function handleStatusChange(newStatus: OrderStatus) {
    setChangingStatus(true);
    const res = await fetch(`/api/orders/${order.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    });
    setChangingStatus(false);
    if (res.ok) {
      const updated = await res.json();
      setOrder(updated);
    }
  }

  async function handleAssignStrategist(strategistId: string | null) {
    setAssigning(true);
    const res = await fetch(`/api/orders/${order.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ assigned_strategist_id: strategistId }),
    });
    setAssigning(false);
    if (res.ok) setOrder(await res.json());
  }

  // Estratega creado desde el selector: agregarlo a la lista y asignarlo a la orden.
  function handleStrategistCreated(m: Strategist) {
    setStrategists((prev) => (prev.some((x) => x.id === m.id) ? prev : [...prev, m]));
    handleAssignStrategist(m.id);
  }

  function handleEdited(updated: Order) {
    setOrder(updated);
    setShowEdit(false);
  }

  const stages = order.stages ?? [];
  // Las etapas del servicio van de la posición 1 en adelante; la posición 0 es
  // la "recepción" (archivos adjuntados al crear la orden), que se muestra
  // aparte como información principal (ver <InitialAttachments />).
  const serviceStages = stages.filter((s) => s.position > 0);
  const intakeCount = stages.find((s) => s.position === 0)?.attachments?.length ?? 0;

  const TABS: { key: TabKey; label: string; icon: React.ReactNode; count?: number }[] = [
    { key: 'resumen', label: 'Resumen', icon: <Info size={14} /> },
    { key: 'etapas', label: 'Etapas', icon: <ListChecks size={14} />, count: serviceStages.length },
    { key: 'archivos', label: 'Archivos', icon: <Paperclip size={14} />, count: intakeCount },
  ];

  return (
    <div className="animate-fade-in" style={{ paddingTop: 18 }}>
      {/* Volver */}
      <button onClick={() => router.back()} className="action-pill" style={{ marginBottom: 14 }}>
        <ArrowLeft size={15} />
        Volver
      </button>

      {/* Cabecera de la orden */}
      <div className="hero" style={{ marginBottom: 14 }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            gap: 12,
          }}
        >
          <div style={{ minWidth: 0 }}>
            <h1 className="hero-title">{clientName}</h1>
            <p className="hero-sub">Orden #{order.id.slice(0, 8).toUpperCase()}</p>
          </div>
          <Badge status={order.status} />
        </div>
      </div>

      {/* Pestañas */}
      <div className="tabs" role="tablist" aria-label="Secciones de la orden">
        {TABS.map((t) => (
          <button
            key={t.key}
            role="tab"
            id={`tab-${t.key}`}
            aria-selected={tab === t.key}
            aria-controls={`panel-${t.key}`}
            className="tab"
            onClick={() => setTab(t.key)}
          >
            {t.icon}
            {t.label}
            {t.count !== undefined && <span className="tab-count">{t.count}</span>}
          </button>
        ))}
      </div>

      {/* Resumen: información + gestión.
          Los paneles se ocultan con display en lugar de desmontarse, para no
          perder el estado interno de las etapas y los adjuntos al cambiar de
          pestaña (subidas en curso, reordenamientos optimistas). */}
      <div
        role="tabpanel"
        id="panel-resumen"
        aria-labelledby="tab-resumen"
        style={{ display: tab === 'resumen' ? 'block' : 'none' }}
      >
        {/* Datos */}
        <div className="card" style={{ marginBottom: 14 }}>
          <p className="eyebrow">Información</p>
          <div className="meta-list">
            <InfoRow icon={<Briefcase size={14} />} label="Proyecto" value={order.project_name} />
            <InfoRow icon={<Tag size={14} />} label="Servicio" value={serviceLabel(order.service_type)} />
            <InfoRow icon={<Phone size={14} />} label="WhatsApp" value={order.client_whatsapp} />
            <InfoRow
              icon={<User size={14} />}
              label="Estratega"
              value={order.assigned_strategist?.full_name ?? 'Sin asignar'}
            />
            <InfoRow
              icon={<Calendar size={14} />}
              label="Creado"
              value={formatDate(order.created_at)}
            />
          </div>

          {order.notes && (
            <>
              <div className="divider" />
              <p className="eyebrow">Notas</p>
              <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', whiteSpace: 'pre-wrap' }}>
                {order.notes}
              </p>
            </>
          )}
        </div>

        {/* Gestión */}
        <div className="card">
          <p className="eyebrow">Gestión</p>

          {/* Cambiar estado */}
          <div className="form-field" style={{ marginBottom: 14 }}>
            <label className="form-label">Cambiar estado</label>
            <Select
              options={STATUS_OPTIONS}
              value={order.status}
              onChange={(v) => handleStatusChange(v as OrderStatus)}
              disabled={changingStatus}
              id="order-status-select"
            />
          </div>

          {/* Asignar estratega — directamente desde el resumen, sin abrir "Editar" */}
          <div className="form-field" style={{ marginBottom: 16 }}>
            <label className="form-label">Asignar estratega</label>
            <StrategistSelect
              strategists={strategists}
              value={order.assigned_strategist_id ?? null}
              onChange={(id) => handleAssignStrategist(id)}
              disabled={assigning}
              onAddNew={() => setShowAddStrategist(true)}
            />
            {strategists.length === 0 && (
              <span style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 4, display: 'block' }}>
                No hay estrategas. Crea uno en la sección Estrategas.
              </span>
            )}
          </div>

          <div className="divider" />

          {/* Acciones */}
          <div className="action-row">
            <a
              href={waLink}
              target="_blank"
              rel="noopener noreferrer"
              className="action-pill action-pill-wa"
              onClick={(e) => {
                e.preventDefault();
                openWhatsApp(
                  order.client_whatsapp,
                  buildTrackingMessage(order.client_first_name, order.public_token, SITE_URL, companyName)
                );
              }}
            >
              <MessageCircle size={14} />
              Enviar tracking
            </a>

            <a
              href={trackingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="action-pill"
            >
              <ExternalLink size={14} />
              Ver tracking
            </a>

            <CopyLinkButton url={trackingUrl} />

            <button className="action-pill" onClick={() => setShowEdit(true)}>
              <Edit2 size={13} />
              Editar
            </button>

            <button className="action-pill action-pill-danger" onClick={handleDelete}>
              <Trash2 size={13} />
              Eliminar
            </button>
          </div>
        </div>
      </div>

      {/* Etapas */}
      <div
        role="tabpanel"
        id="panel-etapas"
        aria-labelledby="tab-etapas"
        style={{ display: tab === 'etapas' ? 'block' : 'none' }}
      >
        <p className="eyebrow">Etapas de servicio</p>
        <StageTimeline
          orderId={order.id}
          initialStages={serviceStages}
          canEdit={true}
          canNotify={true}
          clientFirstName={order.client_first_name}
          clientWhatsapp={order.client_whatsapp}
          publicToken={order.public_token}
        />
      </div>

      {/* Archivos adjuntados al crear la orden */}
      <div
        role="tabpanel"
        id="panel-archivos"
        aria-labelledby="tab-archivos"
        style={{ display: tab === 'archivos' ? 'block' : 'none' }}
      >
        <InitialAttachments orderId={order.id} stages={stages} canEdit={true} />
      </div>

      {/* Edit Modal */}
      <Modal
        isOpen={showEdit}
        onClose={() => setShowEdit(false)}
        title="Editar orden"
      >
        <OrderForm
          strategists={strategists}
          order={order}
          onSuccess={handleEdited}
          onCancel={() => setShowEdit(false)}
          canCreateStrategist
          companyName={companyName}
          onStrategistCreated={handleStrategistCreated}
        />
      </Modal>

      {showAddStrategist && (
        <Modal
          isOpen={showAddStrategist}
          onClose={() => setShowAddStrategist(false)}
          title="Nuevo estratega"
        >
          <StrategistForm
            companyName={companyName}
            onSaved={handleStrategistCreated}
            onClose={() => setShowAddStrategist(false)}
          />
        </Modal>
      )}
    </div>
  );
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="meta-row">
      <span className="meta-icon">{icon}</span>
      <span className="meta-key">{label}</span>
      <span className="meta-value">{value}</span>
    </div>
  );
}
