'use client';

import { useState } from 'react';
import type { Order, Profile, Strategist, OrderStatus } from '@/lib/types';
import OrderCard from '@/components/orders/OrderCard';
import OrderBoard from '@/components/orders/OrderBoard';
import OrderForm from '@/components/orders/OrderForm';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { Plus, ClipboardList, Search } from 'lucide-react';

interface OrdenesClientProps {
  initialOrders: Order[];
  strategists: Profile[];
}

export default function OrdenesClient({
  initialOrders,
  strategists: initialStrategists,
}: OrdenesClientProps) {
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [strategists, setStrategists] = useState<Profile[]>(initialStrategists);
  const [showCreate, setShowCreate] = useState(false);
  const [search, setSearch] = useState('');

  // El estado ya no se filtra con botones: cada estado es un carril del
  // tablero, así que aquí solo queda la búsqueda por texto.
  const filtered = orders.filter((o) => {
    const q = search.toLowerCase();
    return (
      !q ||
      `${o.client_first_name} ${o.client_last_name}`.toLowerCase().includes(q) ||
      o.project_name.toLowerCase().includes(q) ||
      o.client_whatsapp.includes(q)
    );
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

  return (
    <div className="animate-fade-in" style={{ paddingTop: 18 }}>
      {/* Encabezado */}
      <div className="page-head">
        <div>
          <h1 className="page-title">Todas las órdenes</h1>
          <p className="page-sub">
            {filtered.length === orders.length
              ? `${orders.length} en total`
              : `${filtered.length} de ${orders.length}`}
          </p>
        </div>
        <Button variant="primary" size="sm" onClick={() => setShowCreate(true)}>
          <Plus size={15} />
          Nueva
        </Button>
      </div>

      {/* Buscador */}
      <div style={{ position: 'relative', marginBottom: 20 }}>
        <Search
          size={15}
          style={{
            position: 'absolute',
            left: 14,
            top: '50%',
            transform: 'translateY(-50%)',
            color: 'var(--color-text-muted)',
            pointerEvents: 'none',
          }}
        />
        <input
          className="form-input"
          placeholder="Buscar por cliente, proyecto o teléfono..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ paddingLeft: 40 }}
          id="orders-search"
        />
      </div>

      {/* Tablero por estado */}
      <OrderBoard
        orders={filtered}
        emptyState={
          <div className="empty-state">
            <ClipboardList size={48} />
            <p>
              {search ? 'No hay resultados para tu búsqueda' : 'No hay órdenes aún'}
            </p>
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
