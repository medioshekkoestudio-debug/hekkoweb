'use client';

import { useState } from 'react';
import type { Order, Profile, OrderStatus } from '@/lib/types';
import OrderCard from '@/components/orders/OrderCard';
import OrderBoard from '@/components/orders/OrderBoard';
import OrderForm from '@/components/orders/OrderForm';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { Plus, ClipboardList, Search } from 'lucide-react';

interface EstrategaOrdenesClientProps {
  initialOrders: Order[];
  strategists: Profile[];
  profile: Profile;
}

/** El estado ya lo separa el tablero; aquí solo se elige de quién son. */
type ScopeKey = 'mine' | 'all';

export default function EstrategaOrdenesClient({
  initialOrders,
  strategists,
  profile,
}: EstrategaOrdenesClientProps) {
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [showCreate, setShowCreate] = useState(false);
  const [scope, setScope] = useState<ScopeKey>('mine');
  const [search, setSearch] = useState('');

  const mineCount = orders.filter((o) => o.assigned_strategist_id === profile.id).length;

  const filtered = orders.filter((o) => {
    const matchScope = scope === 'mine' ? o.assigned_strategist_id === profile.id : true;
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      `${o.client_first_name} ${o.client_last_name}`.toLowerCase().includes(q) ||
      o.project_name.toLowerCase().includes(q) ||
      o.client_whatsapp.includes(q);
    return matchScope && matchSearch;
  });

  function handleCreated(order: Order) {
    setOrders((prev) => [order, ...prev]);
    setShowCreate(false);
  }

  function handleStatusChange(id: string, status: OrderStatus) {
    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status } : o)));
  }

  function handleDelete(id: string) {
    setOrders((prev) => prev.filter((o) => o.id !== id));
  }

  function handleUpdate(updated: Order) {
    setOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
  }

  const SCOPES: { value: ScopeKey; label: string }[] = [
    { value: 'mine', label: `Mis órdenes (${mineCount})` },
    { value: 'all', label: `Todas (${orders.length})` },
  ];

  return (
    <div className="animate-fade-in" style={{ paddingTop: 18 }}>
      {/* Saludo */}
      <div className="hero" style={{ marginBottom: 16 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: 12,
          }}
        >
          <div style={{ minWidth: 0 }}>
            <h1 className="hero-title">
              Hola, {profile.full_name.split(' ')[0]} 👋
            </h1>
            <p className="hero-sub">
              {mineCount === 0
                ? 'No tienes órdenes asignadas'
                : `Tienes ${mineCount} orden${mineCount > 1 ? 'es' : ''} asignada${mineCount > 1 ? 's' : ''}`}
            </p>
          </div>
          <Button variant="secondary" size="sm" onClick={() => setShowCreate(true)}>
            <Plus size={15} />
            Nueva
          </Button>
        </div>
      </div>

      {/* Buscador */}
      <div style={{ position: 'relative', marginBottom: 14 }}>
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

      {/* De quién son */}
      <div className="chip-row no-scrollbar">
        {SCOPES.map((s) => (
          <button
            key={s.value}
            className="chip"
            aria-pressed={scope === s.value}
            onClick={() => setScope(s.value)}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Tablero por estado */}
      <OrderBoard
        orders={filtered}
        emptyState={
          <div className="empty-state">
            <ClipboardList size={48} />
            <p>
              {search
                ? 'No hay resultados para tu búsqueda'
                : scope === 'mine'
                ? 'No tienes órdenes asignadas'
                : 'No hay órdenes aún'}
            </p>
          </div>
        }
        renderCard={(order) => (
          <OrderCard
            order={order}
            strategists={strategists}
            role="strategist"
            currentUserId={profile.id}
            onStatusChange={handleStatusChange}
            onUpdate={handleUpdate}
            onDelete={handleDelete}
          />
        )}
      />

      {/* Create Modal */}
      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Nueva orden">
        <OrderForm
          strategists={strategists}
          onSuccess={handleCreated}
          onCancel={() => setShowCreate(false)}
        />
      </Modal>
    </div>
  );
}
