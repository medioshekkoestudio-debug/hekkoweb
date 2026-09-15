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

  return (
    <header
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: 'var(--top-bar-height)',
        background: 'rgba(255,255,255,0.95)',
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
      {/* Logo + rol */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
        <HekkoLogo height={24} />
        <span style={{ width: 1, height: 20, background: 'var(--color-border)', flexShrink: 0 }} />
        <p
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: 'var(--color-text-secondary)',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {profile.role === 'admin' ? 'Administrador' : 'Estratega'}
        </p>
      </div>

      {/* Avatar + Logout */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
        <div
          style={{
            width: 34,
            height: 34,
            borderRadius: '50%',
            background: 'var(--gradient-dark)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 12,
            fontWeight: 700,
            color: '#fff',
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
