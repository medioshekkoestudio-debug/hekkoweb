import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import type { Order, Profile } from '@/lib/types';
import { getCompany } from '@/lib/company';
import EstrategaOrderDetailClient from './OrderDetailClient';

interface Props {
  params: { id: string };
}

export default async function EstrategaOrderDetailPage({ params }: Props) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  const [orderRes, strategistsRes, company] = await Promise.all([
    supabase
      .from('orders')
      .select(`
        *,
        assigned_strategist:profiles!assigned_strategist_id(id, full_name, phone),
        stages:order_stages(*, attachments:stage_attachments(*))
      `)
      .eq('id', params.id)
      .maybeSingle(),
    supabase
      .from('profiles')
      .select('*')
      .eq('role', 'strategist')
      .eq('active', true)
      .order('full_name'),
    getCompany(),
  ]);

  const orderData = orderRes.data;
  if (!orderData) notFound();

  const order = orderData as unknown as Order;

  return (
    <EstrategaOrderDetailClient
      order={order}
      strategists={(strategistsRes.data ?? []) as unknown as Profile[]}
      currentUserId={user.id}
      companyName={company?.name ?? 'Hekko'}
    />
  );
}
