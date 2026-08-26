'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Strategist } from '@/lib/types';
import StrategistCard from '@/components/strategists/StrategistCard';
import StrategistForm from '@/components/strategists/StrategistForm';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { Plus, Users } from 'lucide-react';

interface EstrategasClientProps {
  initialStrategists: Strategist[];
  companyName: string;
}

export default function EstrategasClient({ initialStrategists, companyName }: EstrategasClientProps) {
  const router = useRouter();
  const [strategists, setStrategists] = useState<Strategist[]>(initialStrategists);
  // undefined = modal closed · null = create mode · Strategist = edit mode
  const [formStrategist, setFormStrategist] = useState<Strategist | null | undefined>(undefined);
  const [focusPassword, setFocusPassword] = useState(false);

  function openCreate() {
    setFocusPassword(false);
    setFormStrategist(null);
  }

  function openEdit(strategist: Strategist) {
    setFocusPassword(false);
    setFormStrategist(strategist);
  }

  function openResend(strategist: Strategist) {
    setFocusPassword(true);
    setFormStrategist(strategist);
  }

  function closeForm() {
    setFocusPassword(false);
    setFormStrategist(undefined);
  }

  function handleSaved(strategist: Strategist) {
    setStrategists((prev) => {
      const exists = prev.some((m) => m.id === strategist.id);
      const next = exists
        ? prev.map((m) => (m.id === strategist.id ? strategist : m))
        : [...prev, strategist];
      return next.sort((a, b) => a.full_name.localeCompare(b.full_name));
    });
    // Refrescar los datos del servidor para que el estratega nuevo/editado
    // aparezca al instante en la lista de "estrategas disponibles" al asignar
    // órdenes (invalida la caché de rutas del cliente).
    router.refresh();
  }

  function handleToggleActive(id: string, active: boolean) {
    setStrategists((prev) => prev.map((m) => (m.id === id ? { ...m, active } : m)));
    router.refresh();
  }

  function handleDelete(id: string) {
    setStrategists((prev) =>
      prev.map((m) => (m.id === id ? { ...m, active: false } : m))
    );
    router.refresh();
  }

  const active = strategists.filter((m) => m.active);
  const inactive = strategists.filter((m) => !m.active);

  return (
    <div className="animate-fade-in" style={{ paddingTop: 16 }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 20,
        }}
      >
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 800 }}>Estrategas</h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: 13, marginTop: 2 }}>
            {active.length} activos · {inactive.length} inactivos
          </p>
        </div>
        <Button variant="primary" size="sm" onClick={openCreate}>
          <Plus size={15} />
          Agregar
        </Button>
      </div>

      {/* Active strategists */}
      {active.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <p
            style={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: 'var(--color-text-muted)',
              marginBottom: 10,
            }}
          >
            Activos
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {active.map((m) => (
              <StrategistCard
                key={m.id}
                strategist={m}
                onEdit={openEdit}
                onResend={openResend}
                onToggleActive={handleToggleActive}
                onDelete={handleDelete}
              />
            ))}
          </div>
        </div>
      )}

      {/* Inactive strategists */}
      {inactive.length > 0 && (
        <div>
          <p
            style={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: 'var(--color-text-muted)',
              marginBottom: 10,
            }}
          >
            Inactivos
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {inactive.map((m) => (
              <StrategistCard
                key={m.id}
                strategist={m}
                onEdit={openEdit}
                onResend={openResend}
                onToggleActive={handleToggleActive}
                onDelete={handleDelete}
              />
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {strategists.length === 0 && (
        <div className="empty-state">
          <Users size={48} />
          <p>No hay estrategas registrados</p>
          <Button variant="primary" size="sm" onClick={openCreate}>
            <Plus size={14} />
            Agregar primer estratega
          </Button>
        </div>
      )}

      {/* Create / Edit Modal */}
      <Modal
        isOpen={formStrategist !== undefined}
        onClose={closeForm}
        title={
          formStrategist
            ? focusPassword
              ? 'Reenviar acceso'
              : 'Editar estratega'
            : 'Nuevo estratega'
        }
      >
        <StrategistForm
          strategist={formStrategist ?? undefined}
          focusPassword={focusPassword}
          companyName={companyName}
          onSaved={handleSaved}
          onClose={closeForm}
        />
      </Modal>
    </div>
  );
}
