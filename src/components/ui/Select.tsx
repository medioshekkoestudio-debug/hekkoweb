'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Check, Plus } from 'lucide-react';

export interface SelectOption {
  value: string;
  label: string;
  /** Texto atenuado (ej. la opción "Sin asignar"). */
  muted?: boolean;
  /** Opción de acción (ej. "Agregar estratega"): destacada, con +, separada. */
  action?: boolean;
}

interface SelectProps {
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  /** Texto cuando `value` no coincide con ninguna opción. */
  placeholder?: string;
  /** Botón compacto de ancho automático (para tarjetas). */
  compact?: boolean;
  /** Lista flotante en vez de empujar el contenido. */
  float?: boolean;
  id?: string;
}

/**
 * Desplegable con **lista propia** de la app (clases `.select-menu` /
 * `.select-option`) — NO el `<select>` nativo, que abre el picker del sistema.
 * Base reutilizable para cualquier selector de opciones (estado, estratega, etc.).
 */
export default function Select({
  options,
  value,
  onChange,
  disabled,
  placeholder = 'Seleccionar',
  compact = false,
  float = false,
  id,
}: SelectProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLUListElement>(null);
  // Posición del menú flotante en coordenadas de ventana.
  const [anchor, setAnchor] = useState<{ top: number; left: number; width: number } | null>(null);

  useEffect(() => {
    if (!open) return;
    const handle = (e: MouseEvent) => {
      const target = e.target as Node;
      // El menú flotante vive en un portal, fuera de `ref`: hay que mirarlo aparte
      // o el mousedown lo cerraría antes de que el click llegue a la opción.
      if (ref.current?.contains(target)) return;
      if (menuRef.current?.contains(target)) return;
      setOpen(false);
    };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [open]);

  // El menú flotante se ancla a la ventana, así que al hacer scroll o cambiar el
  // tamaño se cerraría "flotando" en un sitio equivocado: mejor cerrarlo.
  useEffect(() => {
    if (!open || !float) return;
    const close = () => setOpen(false);
    window.addEventListener('scroll', close, true);
    window.addEventListener('resize', close);
    return () => {
      window.removeEventListener('scroll', close, true);
      window.removeEventListener('resize', close);
    };
  }, [open, float]);

  function toggle() {
    if (disabled) return;
    if (!open && float && btnRef.current) {
      const r = btnRef.current.getBoundingClientRect();
      setAnchor({ top: r.bottom + 6, left: r.left, width: r.width });
    }
    setOpen((o) => !o);
  }

  const selected = options.find((o) => o.value === value) ?? null;

  const buttonStyle: React.CSSProperties = compact
    ? {
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 8,
        padding: '8px 12px',
        background: 'var(--color-surface-2)',
        border: '1px solid var(--color-border)',
        borderRadius: 8,
        fontSize: 13,
        fontWeight: 600,
        cursor: disabled ? 'default' : 'pointer',
        width: 'auto',
      }
    : {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 8,
        textAlign: 'left',
        cursor: disabled ? 'not-allowed' : 'pointer',
      };

  const menu = (
    <ul
      ref={menuRef}
      className="select-menu"
      role="listbox"
      style={
        float && anchor
          ? {
              position: 'fixed',
              top: anchor.top,
              left: anchor.left,
              zIndex: 120,
              minWidth: Math.max(anchor.width, 200),
              // Nunca más ancho que la pantalla, ni desbordando por la derecha.
              maxWidth: `calc(100vw - ${anchor.left}px - 12px)`,
              margin: 0,
            }
          : undefined
      }
    >
      {options.map((opt) => {
        const isSelected = opt.value === value;
        return (
          <li key={opt.value || '__none__'} style={opt.action ? { borderTop: '1px solid var(--color-border)', marginTop: 2, paddingTop: 2 } : undefined}>
            <button
              type="button"
              role="option"
              aria-selected={isSelected}
              className="select-option"
              onClick={() => {
                onChange(opt.value);
                setOpen(false);
              }}
              style={{
                color: opt.action
                  ? 'var(--color-brand-400)'
                  : opt.muted
                  ? 'var(--color-text-muted)'
                  : 'var(--color-text-primary)',
                fontWeight: opt.action ? 700 : undefined,
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: 6, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {opt.action && <Plus size={15} style={{ flexShrink: 0 }} />}
                {opt.label}
              </span>
              {isSelected && !opt.action && (
                <Check size={16} style={{ flexShrink: 0, color: 'var(--color-brand-500)' }} />
              )}
            </button>
          </li>
        );
      })}
    </ul>
  );

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        ref={btnRef}
        type="button"
        id={id}
        className={compact ? undefined : 'form-input'}
        onClick={toggle}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        style={buttonStyle}
      >
        <span
          style={{
            color: selected ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDown
          size={16}
          style={{
            flexShrink: 0,
            color: 'var(--color-text-muted)',
            transition: 'transform 0.15s',
            transform: open ? 'rotate(180deg)' : 'none',
          }}
        />
      </button>

      {/* Flotante: al portal, para que no lo recorte la tarjeta ni el carril.
          Normal: en su sitio, empujando el contenido. */}
      {open &&
        (float
          ? typeof document !== 'undefined' && createPortal(menu, document.body)
          : menu)}
    </div>
  );
}
