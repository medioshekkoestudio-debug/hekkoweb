'use client';

import type { Order, OrderStage, StageStatus, OrderStatus } from '@/lib/types';
import { serviceLabel } from '@/lib/types';
import { formatDate, ORDER_STATUS_LABELS } from '@/lib/utils';
import { CheckCircle2, Circle, Briefcase, Tag, UserRound, Clock } from 'lucide-react';
import AttachmentGallery from '@/components/orders/AttachmentGallery';
import HekkoLogo from '@/components/brand/HekkoLogo';

interface TrackingClientProps {
  order: Order;
  companyName: string;
}

const STAGE_ICONS: Record<StageStatus, React.ReactNode> = {
  done: <CheckCircle2 size={22} color="#10b981" />,
  in_progress: (
    <div
      style={{
        width: 22,
        height: 22,
        borderRadius: '50%',
        border: '3px solid #F6A00C',
        borderTopColor: 'transparent',
        animation: 'spin 1.2s linear infinite',
      }}
    />
  ),
  pending: <Circle size={22} color="rgba(3,33,43,0.2)" />,
};

// Clase visual de cada etapa en el seguimiento.
const STAGE_CLASS: Record<StageStatus, string> = {
  done: 'stage-card is-done',
  in_progress: 'stage-card is-active',
  pending: 'stage-card',
};

const STATUS_HEADLINE: Record<OrderStatus, string> = {
  sin_estratega: 'En espera de estratega',
  con_estratega: 'En proceso 🚀',
  entregada: '¡Tu proyecto está listo! 🎉',
};

// Color del punto indicador del estado sobre el panel oscuro.
const STATUS_DOT: Record<OrderStatus, string> = {
  sin_estratega: 'rgba(255,255,255,0.6)',
  con_estratega: '#F6A00C',
  entregada: '#34d399',
};

export default function TrackingClient({ order, companyName }: TrackingClientProps) {
  const allStages = (order.stages ?? []) as OrderStage[];
  // La posición 0 son los materiales que el cliente entregó al abrir la orden:
  // es información base del proyecto, no una etapa del seguimiento.
  const intake = allStages.find((s) => s.position === 0);
  const intakeAttachments = intake?.attachments ?? [];
  const stages = allStages.filter((s) => s.position > 0);
  const done = stages.filter((s) => s.status === 'done').length;
  const progress = stages.length > 0 ? Math.round((done / stages.length) * 100) : 0;
  const clientName = `${order.client_first_name} ${order.client_last_name}`;

  const strategist = order.assigned_strategist as { full_name: string } | null | undefined;

  return (
    <div
      style={{
        minHeight: '100dvh',
        padding: '22px 16px 32px',
        maxWidth: 480,
        margin: '0 auto',
      }}
    >
      {/* Marca */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          marginBottom: 18,
        }}
      >
        <HekkoLogo height={30} />
        <p style={{ fontSize: 11.5, color: 'var(--color-text-muted)', textAlign: 'right' }}>
          Seguimiento
          <br />
          de tu proyecto
        </p>
      </div>

      {/* Estado + progreso */}
      <div className="hero animate-fade-in" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 11, marginBottom: 16 }}>
          <span
            style={{
              width: 10,
              height: 10,
              borderRadius: '50%',
              background: STATUS_DOT[order.status],
              animation:
                order.status !== 'sin_estratega' ? 'pulse-glow 2s ease-in-out infinite' : 'none',
              flexShrink: 0,
            }}
          />
          <div style={{ minWidth: 0 }}>
            <p className="hero-title" style={{ fontSize: 18 }}>
              {STATUS_HEADLINE[order.status]}
            </p>
            <p className="hero-sub">{ORDER_STATUS_LABELS[order.status]}</p>
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'baseline',
            marginBottom: 8,
          }}
        >
          <span style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.75)' }}>
            {done} de {stages.length} etapas completadas
          </span>
          <span style={{ fontSize: 17, fontWeight: 800, letterSpacing: '-0.02em' }}>
            {progress}%
          </span>
        </div>

        <div
          className="progress-track"
          style={{ height: 7, background: 'rgba(255,255,255,0.18)' }}
        >
          <div
            className={`progress-fill${progress === 100 ? ' is-complete' : ''}`}
            style={{
              width: `${progress}%`,
              background:
                progress === 100
                  ? 'linear-gradient(90deg, #10b981, #34d399)'
                  : 'linear-gradient(90deg, #2BA1B7, #9acfda)',
            }}
          />
        </div>
      </div>

      {/* Información del proyecto */}
      <div
        className="card animate-fade-in"
        style={{ marginBottom: 16, animationDelay: '0.05s' }}
      >
        <p className="eyebrow">Información</p>
        <div className="meta-list">
          <Row label="Cliente" value={clientName} />
          <Row icon={<Briefcase size={13} />} label="Proyecto" value={order.project_name} />
          <Row icon={<Tag size={13} />} label="Servicio" value={serviceLabel(order.service_type)} />
          {strategist && (
            <Row icon={<UserRound size={13} />} label="Estratega" value={strategist.full_name} />
          )}
          <Row
            icon={<Clock size={13} />}
            label="Iniciado"
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

        {intakeAttachments.length > 0 && (
          <>
            <div className="divider" />
            <p className="eyebrow">Fotos y archivos</p>
            <AttachmentGallery attachments={intakeAttachments} tile={80} />
          </>
        )}
      </div>

      {/* Etapas */}
      <div className="animate-fade-in" style={{ animationDelay: '0.15s' }}>
        <p className="eyebrow">Etapas del servicio</p>

        <div style={{ position: 'relative' }}>
          {/* Línea vertical que une las etapas */}
          <div className="timeline-line" style={{ left: 10, top: 11, bottom: 11 }} />

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {stages.map((stage, idx) => (
              <div
                key={stage.id}
                className="animate-fade-in"
                style={{
                  display: 'flex',
                  gap: 14,
                  alignItems: 'flex-start',
                  position: 'relative',
                  zIndex: 1,
                  animationDelay: `${0.15 + idx * 0.06}s`,
                }}
              >
                {/* Icono */}
                <div
                  style={{
                    marginTop: 10,
                    flexShrink: 0,
                    background: 'var(--color-bg)',
                    borderRadius: '50%',
                    display: 'flex',
                  }}
                >
                  {STAGE_ICONS[stage.status]}
                </div>

                {/* Tarjeta de la etapa */}
                <div
                  className={STAGE_CLASS[stage.status]}
                  style={{
                    flex: 1,
                    minWidth: 0,
                    opacity: stage.status === 'pending' ? 0.62 : 1,
                  }}
                >
                  <p className="stage-name">{stage.name}</p>

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

                  {stage.status === 'in_progress' && (
                    <p
                      style={{
                        fontSize: 12,
                        fontWeight: 600,
                        color: 'var(--color-warning-text)',
                        marginTop: 6,
                      }}
                    >
                      ⏳ En proceso ahora mismo
                    </p>
                  )}

                  {stage.completed_at && (
                    <p
                      style={{
                        fontSize: 11,
                        color: 'var(--color-text-muted)',
                        marginTop: 6,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                      }}
                    >
                      <Clock size={10} />
                      {formatDate(stage.completed_at)}
                    </p>
                  )}

                  {stage.attachments && stage.attachments.length > 0 && (
                    <AttachmentGallery attachments={stage.attachments} tile={80} />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Mensaje de entrega */}
      {order.status === 'entregada' && (
        <div
          className="card animate-slide-up"
          style={{
            marginTop: 24,
            padding: 24,
            background: 'linear-gradient(180deg, rgba(16,185,129,0.12), rgba(16,185,129,0.04))',
            border: '1px solid rgba(16,185,129,0.3)',
            textAlign: 'center',
          }}
        >
          <p style={{ fontSize: 26, marginBottom: 8 }}>🎉</p>
          <p style={{ fontWeight: 800, fontSize: 16.5, color: 'var(--color-success-text)' }}>
            ¡Tu proyecto está listo!
          </p>
          <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginTop: 8 }}>
            Ya entregamos «{order.project_name}».
            <br />
            ¡Gracias por confiar en {companyName}!
          </p>
        </div>
      )}

      {/* Pie */}
      <p
        style={{
          textAlign: 'center',
          color: 'var(--color-text-muted)',
          fontSize: 11,
          marginTop: 32,
        }}
      >
        {companyName} © {new Date().getFullYear()} • Esta página se actualiza en tiempo real
      </p>
    </div>
  );
}

function Row({
  icon,
  label,
  value,
}: {
  icon?: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="meta-row">
      {icon && <span className="meta-icon">{icon}</span>}
      <span className="meta-key" style={{ minWidth: 62 }}>
        {label}
      </span>
      <span className="meta-value">{value}</span>
    </div>
  );
}
