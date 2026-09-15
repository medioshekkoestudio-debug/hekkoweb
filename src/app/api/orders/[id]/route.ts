import { createServiceClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import type { UpdateOrderPayload } from '@/lib/types';
import { getCaller, isStaff, canManageOrder, canDeleteOrder } from '@/lib/api-auth';

type Params = { params: { id: string } };

const ORDER_SELECT = `
  *,
  assigned_strategist:profiles!assigned_strategist_id(id, full_name, phone),
  stages:order_stages(*)
`;

const BUCKET = 'stage-files';

// GET /api/orders/:id
export async function GET(_: Request, { params }: Params) {
  const caller = await getCaller();
  if (!caller) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!isStaff(caller)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const service = createServiceClient();
  const { data, error } = await service
    .from('orders')
    .select(ORDER_SELECT)
    .eq('id', params.id)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 404 });
  return NextResponse.json(data);
}

// PATCH /api/orders/:id
export async function PATCH(req: Request, { params }: Params) {
  const caller = await getCaller();
  if (!caller) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!(await canManageOrder(caller, params.id))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body: UpdateOrderPayload = await req.json();

  // El estado se deriva de la asignación, salvo que venga explícito.
  const updates: UpdateOrderPayload = { ...body };
  if ('assigned_strategist_id' in body && !('status' in body)) {
    updates.status = body.assigned_strategist_id ? 'con_estratega' : 'sin_estratega';
  }

  const service = createServiceClient();
  const { data, error } = await service
    .from('orders')
    .update(updates)
    .eq('id', params.id)
    .select(ORDER_SELECT)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

// DELETE /api/orders/:id
// Admin: cualquier orden. Estratega: solo las suyas (asignadas a él o creadas
// por él). Lo resuelve canDeleteOrder, más estricto que canManageOrder.
export async function DELETE(_: Request, { params }: Params) {
  const caller = await getCaller();
  if (!caller) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!(await canDeleteOrder(caller, params.id))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const service = createServiceClient();

  // Borrar primero los archivos de Storage. El borrado en cascada de la base
  // solo alcanza a las filas (order_stages / stage_attachments): si no los
  // quitamos aquí, los archivos quedan huérfanos en el bucket para siempre.
  const { data: atts } = await service
    .from('stage_attachments')
    .select('path')
    .eq('order_id', params.id);

  const paths = ((atts ?? []) as unknown as { path: string }[]).map((a) => a.path);
  if (paths.length > 0) {
    await service.storage.from(BUCKET).remove(paths);
  }

  const { error } = await service.from('orders').delete().eq('id', params.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return new NextResponse(null, { status: 204 });
}
