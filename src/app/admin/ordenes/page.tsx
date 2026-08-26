import { createClient } from '@/lib/supabase/server';
import type { Order, Profile } from '@/lib/types';
import OrdenesClient from './OrdenesClient';

// Siempre renderizar en el servidor con datos frescos (incluye la lista de
// estrategas disponibles para asignar), sin servir una versión cacheada.
export const dynamic = 'force-dynamic';

export default async function OrdenesAdminPage() {
  const supabase = await createClient();

  const [ordersRes, strategistsRes] = await Promise.all([
    supabase
      .from('orders')
      .select(`
        *,
        assigned_strategist:profiles!assigned_strategist_id(id, full_name, phone),
        stages:order_stages(*)
      `)
      .order('created_at', { ascending: false }),
    supabase
      .from('profiles')
      .select('*')
      .eq('role', 'strategist')
      .eq('active', true)
      .order('full_name'),
  ]);

  return (
    <OrdenesClient
      initialOrders={(ordersRes.data ?? []) as unknown as Order[]}
      strategists={(strategistsRes.data ?? []) as unknown as Profile[]}
    />
  );
}
