'use client';

import type { Service } from '@/lib/types';
import { serviceLabel } from '@/lib/types';
import Select, { type SelectOption } from '@/components/ui/Select';

const ADD_NEW = '__add_new_service__';

interface ServiceSelectProps {
  services: Service[];
  value: string;
  onChange: (slug: string) => void;
  disabled?: boolean;
  /** Si se pasa, agrega al final una opción para crear un servicio nuevo. */
  onAddNew?: () => void;
  id?: string;
}

/**
 * Selector del servicio contratado, con la opción de agregar uno nuevo al
 * catálogo sin salir del formulario (mismo patrón que `StrategistSelect`).
 */
export default function ServiceSelect({
  services,
  value,
  onChange,
  disabled,
  onAddNew,
  id,
}: ServiceSelectProps) {
  const options: SelectOption[] = services.map((s) => ({
    value: s.slug,
    label: s.label,
  }));

  // Si la orden tiene un servicio que ya no está en el catálogo (desactivado, o
  // el catálogo todavía no cargó), se agrega igual para no perder el valor.
  if (value && !options.some((o) => o.value === value)) {
    options.unshift({ value, label: serviceLabel(value) });
  }

  if (onAddNew) {
    options.push({ value: ADD_NEW, label: 'Agregar servicio', action: true });
  }

  return (
    <Select
      id={id}
      options={options}
      value={value}
      onChange={(v) => {
        if (v === ADD_NEW) {
          onAddNew?.();
          return;
        }
        onChange(v);
      }}
      disabled={disabled}
      placeholder="Elegir servicio"
    />
  );
}
