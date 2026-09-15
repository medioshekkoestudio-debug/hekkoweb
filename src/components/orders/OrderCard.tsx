'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Order, Profile, Strategist, OrderStatus } from '@/lib/types';
import { SERVICE_LABELS } from '@/lib/types';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import CopyLinkButton from '@/components/orders/CopyLinkButton';
import StrategistSelect from '@/components/orders/StrategistSelect';
import StrategistForm from '@/components/strategists/StrategistForm';
import { formatDate, buildWhatsAppLink, buildTrackingMessage, openWhatsApp } from '@/lib/utils';
import { Briefcase, Tag, User, Phone, MessageCircle, Edit2, Trash2, ChevronRight, UserCheck, CheckCircle2 } from 'lucide-react';

interface OrderCardProps {
  order: Order;
  strategists: Profile[];
  role: 'admin' | 'strategist';
  currentUserId?: string;
  onDelete?: (id: string) => void;
  onStatusChange?: (id: string, status: OrderStatus) => void;
  onUpdate?: (order: Order) => void;
  /** Solo admin: habilita "Agregar estratega" en el selector de asignación. */
  canCreateStrategist?: boolean;
  /** Avisa al padre cuando se crea un estratega (para actualizar la lista compartida). */
  onStrategistCreated?: (m: Strategist) => void;
  companyName?: string;
}

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

export default function OrderCard({
  order,
  strategists,
  role,
  currentUserId,
  onDelete,
  onStatusChange,
  onUpdate,
  canCreateStrategist = false,
  onStrategistCreated,
  companyName,
}: OrderCardProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showAddStrategist, setShowAddStrategist] = useState(false);

  async function handleAssignSelf() {
    if (!currentUserId) return;
    setLoading(true);
    const res = await fetch(`/api/orders/${order.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ assigned_strategist_id: currentUserId }),
    });
    setLoading(false);
    if (res.ok) {
      const updated = await res.json();
      onUpdate?.(updated);
    }
  }

  const clientName = `${order.client_first_name} ${order.client_last_name}`;
  // Un estratega solo puede eliminar sus propias órdenes (asignadas a él o
  // creadas por él). El administrador puede eliminar cualquiera.
  const isOwn =
    !!currentUserId &&
    (order.assigned_strategist_id === currentUserId || order.created_by === currentUserId);
  const trackingUrl = `${SITE_URL}/tracking/${order.public_token}`;
  const waLink = buildWhatsAppLink(
    order.client_whatsapp,
    buildTrackingMessage(order.client_first_name, order.public_token, SITE_URL, companyName)
  );

  async function handleDelete() {
    if (!confirm(`¿Eliminar la orden de ${clientName}?`)) return;
    setLoading(true);
    const res = await fetch(`/api/orders/${order.id}`, { method: 'DELETE' });
    setLoading(false);
    if (res.ok) onDelete?.(order.id);
  }

  async function handleStatusChange(newStatus: OrderStatus) {
    setLoading(true);
    const res = await fetch(`/api/orders/${order.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    });
    setLoading(false);
    if (res.ok) onStatusChange?.(order.id, newStatus);
  }

  async function handleAssignStrategist(strategistId: string) {
    if (!strategistId) return;
    setLoading(true);
    const res = await fetch(`/api/orders/${order.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ assigned_strategist_id: strategistId }),
    });
    setLoading(false);
    if (res.ok) onUpdate?.(await res.json());
  }

  // Estratega creado desde la tarjeta: avisar al padre (lista compartida) y
  // asignar esta orden al nuevo estratega.
  function handleStrategistCreated(m: Strategist) {
    onStrategistCreated?.(m);
    handleAssignStrategist(m.id);
  }

  // Transiciones de estado por botón. La asignación de estratega (cuando la orden
  // no tiene uno) se hace con un desplegable aparte, no con un botón de estado.
  const nextStatuses: Record<OrderStatus, { value: OrderStatus; label: string }[]> = {
    sin_estratega: [],
    con_estratega: [{ value: 'entregada', label: 'Marcar como entregada' }],
    entregada: [],
  };

  return (
    <article
      className="card animate-fade-in"
      style={{ display: 'flex', flexDirection: 'column', gap: 12 }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <p style={{ fontWeight: 700, fontSize: 16 }}>{clientName}</p>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: 12, marginTop: 2 }}>
            {formatDate(order.created_at)}
          </p>
        </div>
        <Badge status={order.status} />
      </div>

      <div style={{ height: 1, background: 'var(--color-border)' }} />

      {/* Details */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <InfoRow icon={<Briefcase size={14} />} text={order.project_name} />
        <InfoRow icon={<Tag size={14} />} text={SERVICE_LABELS[order.service_type]} />
        <InfoRow icon={<Phone size={14} />} text={order.client_whatsapp} />
        {order.assigned_strategist && (
          <InfoRow
            icon={<User size={14} />}
            text={order.assigned_strategist.full_name}
            color="var(--color-brand-400)"
          />
        )}
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {/* WhatsApp share */}
        <a
          href={waLink}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => {
            e.preventDefault();
            openWhatsApp(
              order.client_whatsapp,
              buildTrackingMessage(order.client_first_name, order.public_token, SITE_URL, companyName)
            );
          }}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '8px 14px',
            background: 'rgba(37,211,102,0.12)',
            color: 'var(--color-whatsapp-text)',
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 600,
            border: '1px solid rgba(37,211,102,0.2)',
            textDecoration: 'none',
          }}
        >
          <MessageCircle size={14} />
          Compartir
        </a>

        {/* Copy tracking link */}
        <CopyLinkButton url={trackingUrl} />

        {/* Detail / Stages */}
        <Button
          variant="secondary"
          size="sm"
          onClick={() => {
            const base = role === 'admin' ? '/admin' : '/estratega';
            router.push(`${base}/ordenes/${order.id}`);
          }}
        >
          <ChevronRight size={14} />
          Ver orden
        </Button>

        {/* Strategist: self-assign */}
        {role === 'strategist' && order.assigned_strategist_id !== currentUserId && (
          <Button
            variant="secondary"
            size="sm"
            loading={loading}
            onClick={handleAssignSelf}
          >
            <UserCheck size={14} />
            Asignarme
          </Button>
        )}

        {/* Strategist: mark as ready when working on it */}
        {role === 'strategist' &&
          order.assigned_strategist_id === currentUserId &&
          order.status === 'con_estratega' && (
            <Button
              variant="primary"
              size="sm"
              loading={loading}
              onClick={() => handleStatusChange('entregada')}
            >
              <CheckCircle2 size={14} />
              Marcar como lista
            </Button>
          )}

        {/* Strategist: delete own orders (assigned to or created by them) */}
        {role === 'strategist' && isOwn && (
          <Button variant="danger" size="sm" loading={loading} onClick={handleDelete}>
            <Trash2 size={13} />
          </Button>
        )}

        {/* Admin: asignar estratega con la lista desplegable propia (si no tiene uno) */}
        {role === 'admin' &&
          !order.assigned_strategist_id &&
          (strategists.length > 0 || canCreateStrategist) && (
            <StrategistSelect
              strategists={strategists}
              value={null}
              onChange={(id) => id && handleAssignStrategist(id)}
              disabled={loading}
              includeNone={false}
              placeholder="Asignar estratega"
              compact
              float
              onAddNew={canCreateStrategist ? () => setShowAddStrategist(true) : undefined}
            />
          )}

        {/* Status transition (admin) */}
        {role === 'admin' && nextStatuses[order.status].map((s) => (
          <Button
            key={s.value}
            variant="secondary"
            size="sm"
            loading={loading}
            onClick={() => handleStatusChange(s.value)}
          >
            {s.label}
          </Button>
        ))}

        {/* Admin actions */}
        {role === 'admin' && (
          <>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push(`/admin/ordenes/${order.id}?edit=1`)}
            >
              <Edit2 size={13} />
            </Button>
            <Button variant="danger" size="sm" loading={loading} onClick={handleDelete}>
              <Trash2 size={13} />
            </Button>
          </>
        )}
      </div>

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
    </article>
  );
}

function InfoRow({
  icon,
  text,
  color,
}: {
  icon: React.ReactNode;
  text: string;
  color?: string;
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        color: color || 'var(--color-text-secondary)',
        fontSize: 13,
      }}
    >
      {icon}
      <span>{text}</span>
    </div>
  );
}
