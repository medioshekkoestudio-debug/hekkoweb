import { createServiceClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { getCaller, isStaff } from '@/lib/api-auth';
import type { CreateOrderPayload } from '@/lib/types';

const ORDER_SELECT = `
  *,
  assigned_strategist:profiles!assigned_strategist_id(id, full_name, phone),
  stages:order_stages(*)
`;

// GET /api/orders — todas las órdenes de Hekko.
export async function GET() {
  const caller = await getCaller();
  if (!caller) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!isStaff(caller)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const service = createServiceClient();
  const { data, error } = await service
    .from('orders')
    .select(ORDER_SELECT)
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data);
}

// POST /api/orders
export async function POST(req: Request) {
  const caller = await getCaller();
  if (!caller) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!isStaff(caller)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body: CreateOrderPayload = await req.json();
  const service = createServiceClient();

  const { data: created, error } = await service
    .from('orders')
    .insert({
      client_first_name: body.client_first_name,
      client_last_name: body.client_last_name,
      client_whatsapp: body.client_whatsapp,
      service_type: body.service_type,
      project_name: body.project_name,
      assigned_strategist_id: body.assigned_strategist_id ?? null,
      notes: body.notes ?? null,
      created_by: caller.userId,
      status: body.assigned_strategist_id ? 'con_estratega' : 'sin_estratega',
    })
    .select('id')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const orderId = (created as unknown as { id: string }).id;

  // Etapa "Materiales del cliente" (posición 0): guarda los archivos que se
  // adjuntan al crear la orden (brief, referencias, logos, notas de voz). Es
  // información base del proyecto y se muestra aparte de las etapas de
  // seguimiento, que van de la posición 1 en adelante (las siembra un trigger).
  await service.from('order_stages').insert({
    order_id: orderId,
    name: 'Materiales del cliente',
    position: 0,
    status: 'pending',
    completed_at: null,
  });

  // Releer la orden ya con la etapa de materiales incluida.
  const { data, error: selErr } = await service
    .from('orders')
    .select(ORDER_SELECT)
    .eq('id', orderId)
    .single();

  if (selErr) return NextResponse.json({ error: selErr.message }, { status: 500 });

  return NextResponse.json(data, { status: 201 });
}
