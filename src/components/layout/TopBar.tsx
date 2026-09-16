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
        <span className="topbar-role">
          {profile.role === 'admin' ? 'Admin' : 'Estratega'}
        </span>
      </div>

      {/* Avatar + salir. Sin el nombre escrito: el avatar ya identifica
          quién tiene la sesión abierta y deja sitio al logo. */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
        <div
          className="avatar"
          style={{ width: 34, height: 34, fontSize: 12 }}
          role="img"
          aria-label={profile.full_name}
          title={profile.full_name}
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
