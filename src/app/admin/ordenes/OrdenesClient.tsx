'use client';

import { useState } from 'react';
import type { Order, Profile, Strategist, OrderStatus } from '@/lib/types';
import OrderCard from '@/components/orders/OrderCard';
import OrderForm from '@/components/orders/OrderForm';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { Plus, ClipboardList, Search } from 'lucide-react';

interface OrdenesClientProps {
  initialOrders: Order[];
  strategists: Profile[];
}

type FilterStatus = 'all' | OrderStatus;

export default function OrdenesClient({
  initialOrders,
  strategists: initialStrategists,
}: OrdenesClientProps) {
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [strategists, setStrategists] = useState<Profile[]>(initialStrategists);
  const [showCreate, setShowCreate] = useState(false);
  const [filter, setFilter] = useState<FilterStatus>('all');
  const [search, setSearch] = useState('');

  const filtered = orders.filter((o) => {
    const matchStatus = filter === 'all' || o.status === filter;
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      `${o.client_first_name} ${o.client_last_name}`.toLowerCase().includes(q) ||
      o.project_name.toLowerCase().includes(q) ||
      o.client_whatsapp.includes(q);
    return matchStatus && matchSearch;
  });

  function handleCreated(order: Order) {
    setOrders((prev) => [order, ...prev]);
    setShowCreate(false);
  }

  function handleDelete(id: string) {
    setOrders((prev) => prev.filter((o) => o.id !== id));
  }

  function handleStatusChange(id: string, status: OrderStatus) {
    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status } : o)));
  }

  function handleUpdate(updated: Order) {
    setOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
  }

  function handleStrategistCreated(m: Strategist) {
    setStrategists((prev) => (prev.some((x) => x.id === m.id) ? prev : [...prev, m]));
  }

  const FILTERS: { value: FilterStatus; label: string }[] = [
    { value: 'all', label: `Todas (${orders.length})` },
    { value: 'sin_estratega', label: 'Sin asignar' },
    { value: 'con_estratega', label: 'En progreso' },
    { value: 'entregada', label: 'Entregadas' },
  ];

  return (
    <div className="animate-fade-in" style={{ paddingTop: 16 }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 16,
        }}
      >
        <h1 style={{ fontSize: 20, fontWeight: 800 }}>Todas las órdenes</h1>
        <Button variant="primary" size="sm" onClick={() => setShowCreate(true)}>
          <Plus size={15} />
          Nueva
        </Button>
      </div>

      {/* Search */}
      <div style={{ position: 'relative', marginBottom: 12 }}>
        <Search
          size={15}
          style={{
            position: 'absolute',
            left: 12,
            top: '50%',
            transform: 'translateY(-50%)',
            color: 'var(--color-text-muted)',
          }}
        />
        <input
          className="form-input"
          placeholder="Buscar por cliente, proyecto o teléfono..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ paddingLeft: 36 }}
          id="orders-search"
        />
      </div>

      {/* Filter tabs */}
      <div
        style={{
          display: 'flex',
          gap: 6,
          marginBottom: 16,
          overflowX: 'auto',
          paddingBottom: 4,
        }}
      >
        {FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            style={{
              padding: '6px 14px',
              borderRadius: 999,
              fontSize: 12,
              fontWeight: 600,
              border: '1px solid',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.15s',
              background:
                filter === f.value
                  ? 'var(--color-brand-500)'
                  : 'var(--color-surface-2)',
              color:
                filter === f.value ? '#0D0F1A' : 'var(--color-text-secondary)',
              borderColor:
                filter === f.value
                  ? 'var(--color-brand-500)'
                  : 'var(--color-border)',
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="empty-state">
          <ClipboardList size={48} />
          <p>
            {search
              ? 'No hay resultados para tu búsqueda'
              : 'No hay órdenes con este filtro'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filtered.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              strategists={strategists}
              role="admin"
              onDelete={handleDelete}
              onStatusChange={handleStatusChange}
              onUpdate={handleUpdate}
              canCreateStrategist
              onStrategistCreated={handleStrategistCreated}
            />
          ))}
        </div>
      )}

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
