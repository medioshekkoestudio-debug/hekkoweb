'use client';

import { useState } from 'react';
import type { Service } from '@/lib/types';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { Tag } from 'lucide-react';

interface ServiceFormProps {
  /** Se llama con el servicio ya guardado en el catálogo. */
  onSaved: (service: Service) => void;
  onClose: () => void;
}

/** Alta de un servicio del catálogo, desde el formulario de la orden. */
export default function ServiceForm({ onSaved, onClose }: ServiceFormProps) {
  const [label, setLabel] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const clean = label.replace(/\s+/g, ' ').trim();
    if (!clean) {
      setError('Escribe el nombre del servicio.');
      return;
    }

    setLoading(true);
    let res: Response;
    try {
      res = await fetch('/api/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ label: clean }),
      });
    } catch {
      setLoading(false);
      setError('No se pudo guardar: revisa tu conexión e intenta de nuevo.');
      return;
    }
    setLoading(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || 'No se pudo guardar el servicio.');
      return;
    }

    onSaved(await res.json());
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Input
        label="Nombre del servicio"
        placeholder="Producción audiovisual"
        value={label}
        onChange={(e) => setLabel(e.target.value)}
        required
        autoFocus
        icon={<Tag size={15} />}
      />

      <p style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: -8 }}>
        Quedará disponible en todas las órdenes nuevas.
      </p>

      {error && <p style={{ color: 'var(--color-danger)', fontSize: 13 }}>{error}</p>}

      <div style={{ display: 'flex', gap: 10 }}>
        <Button type="button" variant="secondary" fullWidth onClick={onClose} disabled={loading}>
          Cancelar
        </Button>
        <Button type="submit" variant="primary" fullWidth loading={loading}>
          Guardar servicio
        </Button>
      </div>
    </form>
  );
}
