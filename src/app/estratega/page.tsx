import { createClient } from '@/lib/supabase/server';
import type { Order, Profile } from '@/lib/types';
import EstrategaOrdenesClient from './OrdenesClient';

export const dynamic = 'force-dynamic';

export default async function EstrategaPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  const [meRes, ordersRes, strategistsRes] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
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
    <EstrategaOrdenesClient
      initialOrders={(ordersRes.data ?? []) as unknown as Order[]}
      strategists={(strategistsRes.data ?? []) as unknown as Profile[]}
      profile={meRes.data as unknown as Profile}
    />
  );
}
