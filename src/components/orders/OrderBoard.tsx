'use client';

import type { Order, OrderStatus } from '@/lib/types';

/**
 * Tablero de órdenes: en lugar de una lista vertical única, las órdenes se
 * reparten en carriles por estado que se deslizan en horizontal. Así se ve de
 * un vistazo cuántas hay en cada etapa sin tener que cambiar de filtro.
 *
 * El tablero no decide cómo se pinta cada orden: recibe `renderCard` y así
 * admin y estratega reutilizan su propia tarjeta con sus propias acciones.
 */
interface OrderBoardProps {
  orders: Order[];
  renderCard: (order: Order) => React.ReactNode;
  /** Qué mostrar cuando no hay ninguna orden que repartir. */
  emptyState: React.ReactNode;
}

const LANES: {
  status: OrderStatus;
  name: string;
  color: string;
  empty: string;
}[] = [
  {
    status: 'sin_estratega',
    name: 'Sin estratega',
    color: 'var(--color-border-strong)',
    empty: 'Nada pendiente de asignar',
  },
  {
    status: 'con_estratega',
    name: 'En progreso',
    color: 'var(--color-accent)',
    empty: 'Ninguna orden en progreso',
  },
  {
    status: 'entregada',
    name: 'Entregadas',
    color: 'var(--color-success)',
    empty: 'Aún no hay entregas',
  },
];

export default function OrderBoard({ orders, renderCard, emptyState }: OrderBoardProps) {
  if (orders.length === 0) return <>{emptyState}</>;

  return (
    <div>
      {LANES.map((lane) => {
        const items = orders.filter((o) => o.status === lane.status);

        return (
          <section className="lane" key={lane.status}>
            <div className="lane-head">
              <span
                className="lane-dot"
                style={{ '--lane-color': lane.color } as React.CSSProperties}
              />
              <span className="lane-name">{lane.name}</span>
              <span className="lane-count">{items.length}</span>
              <span className="lane-rule" />
            </div>

            <div className="lane-track no-scrollbar">
              {items.length === 0 ? (
                <div className="lane-empty">{lane.empty}</div>
              ) : (
                items.map((order) => (
                  <div className="lane-item" key={order.id}>
                    {renderCard(order)}
                  </div>
                ))
              )}
            </div>
          </section>
        );
      })}
    </div>
  );
}
