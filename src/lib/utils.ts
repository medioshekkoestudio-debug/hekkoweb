import type { OrderStatus, StageStatus } from './types';

// ============================================================================
// Date / time
// ============================================================================
export function formatDate(dateStr: string): string {
  return new Intl.DateTimeFormat('es-VE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(dateStr));
}

export function formatDateShort(dateStr: string): string {
  return new Intl.DateTimeFormat('es-VE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(dateStr));
}

// ============================================================================
// WhatsApp
// ============================================================================
export function buildWhatsAppLink(phone: string, message: string): string {
  const clean = phone.replace(/\D/g, '');
  const encoded = encodeURIComponent(message);
  return `https://wa.me/${clean}?text=${encoded}`;
}

// Opens WhatsApp using the right target for the device.
// - Mobile: `wa.me` opens the installed app directly.
// - Desktop: go straight to WhatsApp Web (`web.whatsapp.com/send`), which
//   avoids the `wa.me` landing page that often hangs "loading" on a computer.
// Called from a click handler (browser only), so `navigator` is available.
export function openWhatsApp(phone: string, message: string): void {
  const clean = phone.replace(/\D/g, '');
  const encoded = encodeURIComponent(message);
  const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
  const isMobile = /Android|iPhone|iPad|iPod|Mobile/i.test(ua);
  const url = isMobile
    ? `https://wa.me/${clean}?text=${encoded}`
    : `https://web.whatsapp.com/send?phone=${clean}&text=${encoded}`;
  window.open(url, '_blank', 'noopener,noreferrer');
}

export function buildTrackingMessage(
  clientName: string,
  token: string,
  siteUrl: string,
  companyName = 'Hekko'
): string {
  const url = `${siteUrl}/tracking/${token}`;
  return (
    `Hola ${clientName}! Ya arrancamos con tu proyecto en ${companyName}.\n\n` +
    `Puedes seguir el avance aquí:\n${url}\n\n` +
    `¡Cualquier duda estamos a tu disposición!`
  );
}

// Mensaje que se le envía al cliente sobre el avance de una etapa concreta.
// `isFinal` = es la última etapa del proyecto (ej. "Entrega final").
export function buildStageReminderMessage(
  clientFirstName: string,
  stageName: string,
  status: StageStatus,
  token: string,
  siteUrl: string,
  isFinal = false
): string {
  const url = `${siteUrl}/tracking/${token}`;
  const name = clientFirstName;

  if (isFinal && status === 'done') {
    return (
      `¡${name}! Tu proyecto está terminado (etapa final: ${stageName}).\n\n` +
      `Puedes verlo en el siguiente link:\n${url}`
    );
  }
  if (status === 'done') {
    return (
      `¡${name}! Ya completamos la etapa «${stageName}».\n\n` +
      `Recuerda que puedes seguir tu proyecto desde el siguiente link:\n${url}`
    );
  }
  if (status === 'in_progress') {
    return (
      `¡${name}! Estamos trabajando en la etapa «${stageName}».\n\n` +
      `Puedes seguir el avance de tu proyecto en el siguiente link:\n${url}`
    );
  }
  return (
    `¡${name}! La etapa «${stageName}» está por comenzar.\n\n` +
    `Puedes seguir el avance de tu proyecto en el siguiente link:\n${url}`
  );
}

export function buildCredentialsMessage(
  name: string,
  email: string,
  password: string,
  siteUrl: string,
  companyName = 'Hekko'
): string {
  return (
    `Hola ${name}! Estos son tus datos de acceso a ${companyName}:\n\n` +
    `Usuario: ${email}\n` +
    `Contraseña: ${password}\n\n` +
    `Ingresa aquí:\n${siteUrl}/login\n\n` +
    `Por seguridad, cambia tu contraseña después del primer ingreso.`
  );
}

export function buildCredentialsText(
  email: string,
  password: string,
  siteUrl: string
): string {
  return `Usuario: ${email}\nContraseña: ${password}\nAcceso: ${siteUrl}/login`;
}

// ============================================================================
// Order status labels
// ============================================================================
export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  sin_estratega: 'Sin estratega',
  con_estratega: 'En progreso',
  entregada: 'Entregado',
};

export const ORDER_STATUS_COLORS: Record<
  OrderStatus,
  { bg: string; text: string; dot: string }
> = {
  sin_estratega: {
    bg: 'bg-ink-800',
    text: 'text-ink-200',
    dot: 'bg-ink-400',
  },
  con_estratega: {
    bg: 'bg-amber-900/40',
    text: 'text-amber-300',
    dot: 'bg-amber-400',
  },
  entregada: {
    bg: 'bg-emerald-900/40',
    text: 'text-emerald-300',
    dot: 'bg-emerald-400',
  },
};

// ============================================================================
// Stage status labels
// ============================================================================
export const STAGE_STATUS_LABELS: Record<StageStatus, string> = {
  pending: 'Pendiente',
  in_progress: 'En progreso',
  done: 'Completado',
};

// ============================================================================
// Misc
// ============================================================================
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

// Convierte un texto en un slug apto para URL (sin acentos).
export function slugify(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // strip accents
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}
