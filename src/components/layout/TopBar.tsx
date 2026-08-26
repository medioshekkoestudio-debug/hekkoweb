'use client';

import { LogOut, Sparkles } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import type { Profile } from '@/lib/types';
import { getInitials } from '@/lib/utils';

interface TopBarProps {
  profile: Profile;
  title?: string;
  /** Logo de Hekko cargado desde /admin/empresa; si no hay, se usa el ícono. */
  logoUrl?: string | null;
}

export default function TopBar({ profile, title, logoUrl }: TopBarProps) {
  const router = useRouter();
  const supabase = createClient();

  async function handleLogout() {
    await supabase.auth.signOut();
    router.replace('/login');
  }

  return (
    <header
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: 'var(--top-bar-height)',
        background: 'rgba(13,15,26,0.95)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid var(--color-border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 16px',
        zIndex: 50,
        paddingTop: 'env(safe-area-inset-top)',
      }}
    >
      {/* Logo + Title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div
          style={{
            width: 34,
            height: 34,
            background: logoUrl
              ? 'var(--color-surface-2)'
              : 'linear-gradient(135deg, var(--color-brand-500), var(--color-brand-700))',
            borderRadius: 9,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
          }}
        >
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={logoUrl}
              alt=""
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            <Sparkles size={18} color="#0D0F1A" strokeWidth={2.5} />
          )}
        </div>
        <div>
          <p style={{ fontSize: 14, fontWeight: 700, lineHeight: 1 }}>
            {title || 'Hekko'}
          </p>
          <p style={{ fontSize: 11, color: 'var(--color-text-secondary)', lineHeight: 1, marginTop: 2 }}>
            {profile.role === 'admin' ? 'Administrador' : 'Estratega'}
          </p>
        </div>
      </div>

      {/* Avatar + Logout */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div
          style={{
            width: 34,
            height: 34,
            borderRadius: '50%',
            background: 'var(--color-surface-3)',
            border: '2px solid var(--color-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 12,
            fontWeight: 700,
            color: 'var(--color-brand-400)',
          }}
        >
          {getInitials(profile.full_name)}
        </div>
        <button
          onClick={handleLogout}
          style={{
            background: 'var(--color-surface-2)',
            border: '1px solid var(--color-border)',
            borderRadius: 8,
            padding: '6px 10px',
            color: 'var(--color-text-secondary)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            fontSize: 12,
            fontWeight: 500,
            transition: 'all 0.15s',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.color = 'var(--color-text-primary)';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.color = 'var(--color-text-secondary)';
          }}
        >
          <LogOut size={14} />
          Salir
        </button>
      </div>
    </header>
  );
}
