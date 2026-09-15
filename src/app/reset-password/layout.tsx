// La página crea el cliente de Supabase al renderizar, así que no puede
// prerenderizarse en el build (igual que /login). page.tsx es 'use client' y
// ahí no aplica la config de segmento, por eso vive en este layout.
export const dynamic = 'force-dynamic';

export default function ResetPasswordLayout({ children }: { children: React.ReactNode }) {
  return children;
}
