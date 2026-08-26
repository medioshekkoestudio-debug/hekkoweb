import { createServiceClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

type Params = { params: { token: string } };

// GET /api/tracking/:token — público, sin autenticación.
// Lee con el service role y filtra por public_token, así que las tablas de
// órdenes pueden seguir cerradas en RLS.
export async function GET(_: Request, { params }: Params) {
  const service = createServiceClient();

  const [{ data: order, error }, { data: company }] = await Promise.all([
    service
      .from('orders')
      .select(`
        id,
        public_token,
        client_first_name,
        client_last_name,
        service_type,
        project_name,
        status,
        created_at,
        updated_at,
        assigned_strategist:profiles!assigned_strategist_id(full_name),
        stages:order_stages(id, name, description, position, status, completed_at)
      `)
      .eq('public_token', params.token)
      .single(),
    service.from('company_settings').select('name, logo_url').eq('id', 1).single(),
  ]);

  if (error || !order) {
    return NextResponse.json({ error: 'Orden no encontrada' }, { status: 404 });
  }

  // Ordenar las etapas por posición.
  if (order.stages) {
    (order.stages as Array<{ position: number }>).sort((a, b) => a.position - b.position);
  }

  return NextResponse.json({ ...order, company: company ?? null });
}
