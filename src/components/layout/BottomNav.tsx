'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { ClipboardList, Users, LayoutDashboard, Store } from 'lucide-react';

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
}

const ADMIN_NAV: NavItem[] = [
  {
    href: '/admin',
    label: 'Inicio',
    icon: <LayoutDashboard size={21} />,
  },
  {
    href: '/admin/ordenes',
    label: 'Órdenes',
    icon: <ClipboardList size={21} />,
  },
  {
    href: '/admin/estrategas',
    label: 'Estrategas',
    icon: <Users size={21} />,
  },
  {
    href: '/admin/empresa',
    label: 'Empresa',
    icon: <Store size={21} />,
  },
];

const STRATEGIST_NAV: NavItem[] = [
  {
    href: '/estratega',
    label: 'Mis Órdenes',
    icon: <ClipboardList size={21} />,
  },
];

interface BottomNavProps {
  role: 'admin' | 'strategist';
}

export default function BottomNav({ role }: BottomNavProps) {
  const pathname = usePathname();
  const items = role === 'admin' ? ADMIN_NAV : STRATEGIST_NAV;

  return (
    <nav
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        height: 'calc(var(--bottom-nav-height) + env(safe-area-inset-bottom))',
        background: 'rgba(255,255,255,0.86)',
        backdropFilter: 'blur(20px) saturate(180%)',
        WebkitBackdropFilter: 'blur(20px) saturate(180%)',
        borderTop: '1px solid var(--color-border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
        paddingBottom: 'env(safe-area-inset-bottom)',
        zIndex: 50,
      }}
    >
      {items.map((item) => {
        const isActive =
          item.href === '/admin' || item.href === '/estratega'
            ? pathname === item.href
            : pathname.startsWith(item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={isActive ? 'page' : undefined}
            style={{
              position: 'relative',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 5,
              padding: '9px 14px',
              borderRadius: 14,
              minWidth: 72,
              color: isActive ? 'var(--color-brand-500)' : 'var(--color-text-muted)',
              background: isActive ? 'var(--color-brand-50)' : 'transparent',
              transition: 'color 0.15s, background 0.15s',
              textDecoration: 'none',
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            {/* Indicador superior de la pestaña activa */}
            {isActive && (
              <span
                style={{
                  position: 'absolute',
                  top: -1,
                  width: 26,
                  height: 3,
                  borderRadius: 999,
                  background: 'var(--gradient-dark)',
                }}
              />
            )}
            {item.icon}
            <span
              style={{
                fontSize: 10.5,
                fontWeight: isActive ? 700 : 500,
                letterSpacing: '0.02em',
              }}
            >
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
