'use client';

import { LogOut } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import type { Profile } from '@/lib/types';
import { getInitials } from '@/lib/utils';
import HekkoLogo from '@/components/brand/HekkoLogo';

interface TopBarProps {
  profile: Profile;
}

export default function TopBar({ profile }: TopBarProps) {
  const router = useRouter();
  const supabase = createClient();

  async function handleLogout() {
    await supabase.auth.signOut();
    router.replace('/login');
  }

  const firstName = profile.full_name?.split(' ')[0] ?? '';

  return (
    <header
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: 'calc(var(--top-bar-height) + env(safe-area-inset-top))',
        background: 'rgba(255,255,255,0.82)',
        backdropFilter: 'blur(20px) saturate(180%)',
        WebkitBackdropFilter: 'blur(20px) saturate(180%)',
        borderBottom: '1px solid var(--color-border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
        padding: '0 16px',
        zIndex: 50,
        paddingTop: 'env(safe-area-inset-top)',
      }}
    >
      {/* Logo + rol */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
        <HekkoLogo height={26} />
        <span
          style={{
            fontSize: 10.5,
            fontWeight: 700,
            letterSpacing: '0.07em',
            textTransform: 'uppercase',
            color: 'var(--color-brand-500)',
            background: 'var(--color-brand-50)',
            border: '1px solid var(--color-brand-100)',
            borderRadius: 999,
            padding: '3px 9px',
            whiteSpace: 'nowrap',
            flexShrink: 0,
          }}
        >
          {profile.role === 'admin' ? 'Administrador' : 'Estratega'}
        </span>
      </div>

      {/* Nombre + avatar + salir */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
        <span
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: 'var(--color-text-secondary)',
            maxWidth: 110,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {firstName}
        </span>

        <div
          className="avatar"
          style={{ width: 34, height: 34, fontSize: 12 }}
          aria-hidden="true"
        >
          {getInitials(profile.full_name)}
        </div>

        <button
          onClick={handleLogout}
          className="action-pill"
          title="Cerrar sesión"
          aria-label="Cerrar sesión"
          style={{ padding: 9 }}
        >
          <LogOut size={15} />
        </button>
      </div>
    </header>
  );
}
