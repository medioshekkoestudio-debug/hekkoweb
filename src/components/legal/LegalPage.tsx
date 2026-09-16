import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import HekkoLogo from '@/components/brand/HekkoLogo';

export default function LegalPage({
  title,
  updated,
  children,
}: {
  title: string;
  updated: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ maxWidth: 760, margin: '0 auto', padding: '24px 20px 60px' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          marginBottom: 20,
        }}
      >
        <Link href="/login" className="action-pill">
          <ArrowLeft size={15} /> Volver
        </Link>
        <HekkoLogo height={22} />
      </div>

      {/* Cabecera de marca */}
      <div className="hero" style={{ marginBottom: 20 }}>
        <h1 className="hero-title">{title}</h1>
        <p className="hero-sub">Última actualización: {updated}</p>
      </div>

      <style>{`
        .legal-prose h2 { font-size: 16px; font-weight: 700; color: var(--color-text-primary); margin: 24px 0 8px; }
        .legal-prose h2:first-child { margin-top: 0; }
        .legal-prose p { margin: 0 0 12px; }
        .legal-prose strong { color: var(--color-text-primary); }
      `}</style>

      <div
        className="card legal-prose"
        style={{
          fontSize: 14.5,
          lineHeight: 1.75,
          color: 'var(--color-text-secondary)',
          padding: 24,
        }}
      >
        {children}
      </div>
    </div>
  );
}
