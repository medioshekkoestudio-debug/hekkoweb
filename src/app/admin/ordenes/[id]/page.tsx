import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import type { Order, Profile } from '@/lib/types';
import { getCompany } from '@/lib/company';
import OrderDetailClient from './OrderDetailClient';

// Datos siempre frescos (incluye los estrategas disponibles para asignar).
export const dynamic = 'force-dynamic';

interface Props {
  params: { id: string };
  searchParams: { edit?: string };
}

export default async function AdminOrderDetailPage({ params, searchParams }: Props) {
  const supabase = await createClient();

  const [orderResult, strategistsResult, company] = await Promise.all([
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

  const orderData = orderResult.data;
  if (!orderData) notFound();

  const order = orderData as unknown as Order;
  const strategists = (strategistsResult.data ?? []) as unknown as Profile[];

  return (
    <OrderDetailClient
      order={order}
      strategists={strategists}
      startInEdit={searchParams.edit === '1'}
      companyName={company?.name ?? 'Hekko'}
    />
  );
}
