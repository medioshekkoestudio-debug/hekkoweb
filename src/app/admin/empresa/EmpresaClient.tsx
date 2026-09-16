'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Building2, CheckCircle2 } from 'lucide-react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import PhoneInput from '@/components/ui/PhoneInput';
import HekkoLogo from '@/components/brand/HekkoLogo';
import type { CompanySettings } from '@/lib/types';

/**
 * Perfil de la empresa: nombre y WhatsApp de Hekko. El logo es fijo (viene en
 * la app, ver components/brand/HekkoLogo) y no se sube desde aquí.
 */
export default function EmpresaClient({ company }: { company: CompanySettings }) {
  const router = useRouter();
  const [name, setName] = useState(company.name);
  const [whatsapp, setWhatsapp] = useState(company.whatsapp ?? '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaved(false);
    if (!name.trim()) {
      setError('El nombre de la empresa es obligatorio.');
      return;
    }
    setLoading(true);
    const res = await fetch('/api/company', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name.trim(), whatsapp: whatsapp.trim() }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || 'No se pudo guardar.');
      return;
    }
    setSaved(true);
    router.refresh();
  }

  return (
    <div className="animate-fade-in" style={{ paddingTop: 18 }}>
      <div className="page-head">
        <div>
          <h1 className="page-title">Perfil de la empresa</h1>
          <p className="page-sub">
            El nombre aparece en el seguimiento que ven tus clientes.
          </p>
        </div>
      </div>

      {/* Logo */}
      <div className="card" style={{ marginBottom: 14 }}>
        <p className="eyebrow">Logo</p>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '22px 16px',
            background: 'var(--color-surface-2)',
            border: '1px solid var(--color-border)',
            borderRadius: 14,
          }}
        >
          <HekkoLogo height={44} />
        </div>
        <p style={{ fontSize: 11.5, color: 'var(--color-text-muted)', marginTop: 12 }}>
          El logo oficial de Hekko viene integrado en la app.
        </p>
      </div>

      {/* Datos de la empresa */}
      <div className="card">
        <p className="eyebrow">Datos</p>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Input
            label="Nombre de la empresa"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setSaved(false);
            }}
            required
            icon={<Building2 size={15} />}
            id="empresa-name"
          />

          <PhoneInput
            label="WhatsApp de la empresa"
            value={whatsapp}
            onChange={(v) => {
              setWhatsapp(v);
              setSaved(false);
            }}
            id="empresa-whatsapp"
          />

          {error && (
            <div
              style={{
                padding: '11px 14px',
                background: 'rgba(239,68,68,0.08)',
                border: '1px solid rgba(239,68,68,0.22)',
                borderRadius: 10,
                color: 'var(--color-danger-text)',
                fontSize: 13,
              }}
            >
              {error}
            </div>
          )}

          {saved && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '11px 14px',
                background: 'rgba(16,185,129,0.1)',
                border: '1px solid rgba(16,185,129,0.28)',
                borderRadius: 10,
                color: 'var(--color-success-text)',
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              <CheckCircle2 size={16} />
              Cambios guardados
            </div>
          )}

          <Button type="submit" variant="primary" fullWidth loading={loading}>
            Guardar cambios
          </Button>
        </form>
      </div>
    </div>
  );
}
