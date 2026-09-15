import { createServiceClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import type { Order, OrderStage, CompanySettings } from '@/lib/types';
import { SERVICE_LABELS } from '@/lib/types';
import TrackingClient from './TrackingClient';
import type { Metadata } from 'next';

// El seguimiento del cliente debe mostrar SIEMPRE el estado actual (etapas y
// adjuntos recién guardados).
// - force-dynamic: no cachear la PÁGINA (Full Route Cache).
// - force-no-store: no cachear las CONSULTAS a Supabase (Data Cache). Como el
//   tracking es público (sin cookies), sin esto Next.js servía datos viejos
//   (p. ej. faltaban los adjuntos de las etapas recién subidos).
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

interface Props {
  params: { token: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const service = createServiceClient();
  const [orderRes, companyRes] = await Promise.all([
    service
      .from('orders')
      .select('client_first_name, client_last_name, project_name, service_type')
      .eq('public_token', params.token)
      .maybeSingle(),
    service.from('company_settings').select('name').eq('id', 1).maybeSingle(),
  ]);

  const data = orderRes.data as unknown as
    | {
        client_first_name: string;
        client_last_name: string;
        project_name: string;
        service_type: keyof typeof SERVICE_LABELS;
      }
    | null;
  if (!data) return { title: 'Seguimiento de proyecto' };

  const companyName = (companyRes.data as unknown as { name: string } | null)?.name ?? 'Hekko';
  return {
    title: `Seguimiento de ${data.client_first_name} ${data.client_last_name} — ${companyName}`,
    description: `Avance de ${data.project_name} (${SERVICE_LABELS[data.service_type]})`,
  };
}

export default async function TrackingPage({ params }: Props) {
  const service = createServiceClient();

  const [orderRes, companyRes] = await Promise.all([
    service
      .from('orders')
      .select(`
        id,
        public_token,
        client_first_name,
        client_last_name,
        service_type,
        project_name,
        notes,
        status,
        created_at,
        updated_at,
        assigned_strategist:profiles!assigned_strategist_id(full_name),
        stages:order_stages(id, name, description, position, status, completed_at, attachments:stage_attachments(id, url, name, mime, created_at))
      `)
      .eq('public_token', params.token)
      .maybeSingle(),
    service.from('company_settings').select('name').eq('id', 1).maybeSingle(),
  ]);

  const rawData = orderRes.data;
  if (!rawData) notFound();

  const rawOrder = rawData as unknown as Order & { stages: OrderStage[] };
  const company = companyRes.data as unknown as Pick<CompanySettings, 'name'> | null;

  // Ordenar las etapas por posición.
  const sortedStages = (rawOrder.stages ?? []).sort(
    (a: OrderStage, b: OrderStage) => a.position - b.position
  );

  return (
    <TrackingClient
      order={{ ...rawOrder, stages: sortedStages }}
      companyName={company?.name ?? 'Hekko'}
    />
  );
}
