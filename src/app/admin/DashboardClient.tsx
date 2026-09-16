'use client';

import { useState } from 'react';
import type { Order, Profile, Strategist, OrderStatus } from '@/lib/types';
import OrderCard from '@/components/orders/OrderCard';
import OrderBoard from '@/components/orders/OrderBoard';
import OrderForm from '@/components/orders/OrderForm';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { Plus, ClipboardList, CheckCircle2, Loader, Clock } from 'lucide-react';

interface AdminDashboardClientProps {
  initialOrders: Order[];
  strategists: Profile[];
}

export default function AdminDashboardClient({
  initialOrders,
  strategists: initialStrategists,
}: AdminDashboardClientProps) {
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [strategists, setStrategists] = useState<Profile[]>(initialStrategists);
  const [showCreate, setShowCreate] = useState(false);

  function handleStrategistCreated(m: Strategist) {
    setStrategists((prev) => (prev.some((x) => x.id === m.id) ? prev : [...prev, m]));
  }

  const stats = {
    total: orders.length,
    sin_estratega: orders.filter((o) => o.status === 'sin_estratega').length,
    con_estratega: orders.filter((o) => o.status === 'con_estratega').length,
    entregada: orders.filter((o) => o.status === 'entregada').length,
  };

  function handleCreated(order: Order) {
    setOrders((prev) => [order, ...prev]);
    setShowCreate(false);
  }

  function handleDelete(id: string) {
    setOrders((prev) => prev.filter((o) => o.id !== id));
  }

  function handleStatusChange(id: string, status: OrderStatus) {
    setOrders((prev) =>
      prev.map((o) => (o.id === id ? { ...o, status } : o))
    );
  }

  function handleUpdate(updated: Order) {
    setOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
  }

  const activas = stats.sin_estratega + stats.con_estratega;

  return (
    <div className="animate-fade-in" style={{ paddingTop: 18 }}>
      {/* Resumen destacado */}
      <div className="hero" style={{ marginBottom: 14 }}>
        <p className="hero-sub" style={{ marginTop: 0 }}>Panel de administración</p>
        <h1 className="hero-title" style={{ marginTop: 6 }}>
          {activas === 0
            ? 'Todo al día'
            : `${activas} ${activas === 1 ? 'orden activa' : 'órdenes activas'}`}
        </h1>
        <p className="hero-sub">
          {stats.total} {stats.total === 1 ? 'orden en total' : 'órdenes en total'} ·{' '}
          {stats.entregada} {stats.entregada === 1 ? 'entregada' : 'entregadas'}
        </p>
      </div>

      {/* Cifras */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: 10,
          marginBottom: 24,
        }}
      >
        <StatCard
          icon={<ClipboardList size={26} />}
          label="Total"
          value={stats.total}
          color="var(--color-brand-500)"
        />
        <StatCard
          icon={<Clock size={26} />}
          label="Sin asignar"
          value={stats.sin_estratega}
          color="var(--color-text-secondary)"
        />
        <StatCard
          icon={<Loader size={26} />}
          label="En progreso"
          value={stats.con_estratega}
          color="var(--color-warning-text)"
        />
        <StatCard
          icon={<CheckCircle2 size={26} />}
          label="Entregadas"
          value={stats.entregada}
          color="var(--color-success-text)"
        />
      </div>

      {/* Encabezado del tablero */}
      <div className="page-head" style={{ marginBottom: 16, alignItems: 'center' }}>
        <h2 className="page-title" style={{ fontSize: 18 }}>Tablero de órdenes</h2>
        <Button variant="primary" size="sm" onClick={() => setShowCreate(true)}>
          <Plus size={15} />
          Nueva orden
        </Button>
      </div>

      {/* Tablero por estado */}
      <OrderBoard
        orders={orders}
        emptyState={
          <div className="empty-state">
            <ClipboardList size={48} />
            <p>No hay órdenes aún</p>
            <Button variant="primary" size="sm" onClick={() => setShowCreate(true)}>
              <Plus size={14} />
              Crear primera orden
            </Button>
          </div>
        }
        renderCard={(order) => (
          <OrderCard
            order={order}
            strategists={strategists}
            role="admin"
            onDelete={handleDelete}
            onStatusChange={handleStatusChange}
            onUpdate={handleUpdate}
            canCreateStrategist
            onStrategistCreated={handleStrategistCreated}
          />
        )}
      />

      {/* Create Modal */}
      <Modal
        isOpen={showCreate}
        onClose={() => setShowCreate(false)}
        title="Nueva orden"
      >
        <OrderForm
          strategists={strategists}
          onSuccess={handleCreated}
          onCancel={() => setShowCreate(false)}
          canCreateStrategist
          onStrategistCreated={handleStrategistCreated}
        />
      </Modal>

    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="stat" style={{ '--stat-color': color } as React.CSSProperties}>
      <span className="stat-icon">{icon}</span>
      <p className="stat-value">{value}</p>
      <p className="stat-label">{label}</p>
    </div>
  );
}
