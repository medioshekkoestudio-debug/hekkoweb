import { createServiceClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { getCaller } from '@/lib/api-auth';
import type { CompanyUpdate } from '@/lib/types';

// PATCH /api/company — edita la marca de Hekko (nombre y WhatsApp). Solo admin.
// Es una fila única (id = 1), así que no lleva parámetro de ruta.
export async function PATCH(req: Request) {
  const caller = await getCaller();
  if (!caller) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (caller.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = (await req.json().catch(() => null)) as CompanyUpdate | null;
  const updates: CompanyUpdate = {};
  if (typeof body?.name === 'string' && body.name.trim()) updates.name = body.name.trim();
  if (body?.whatsapp !== undefined) updates.whatsapp = (body.whatsapp || '').trim() || null;

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'Nada que actualizar.' }, { status: 400 });
  }

  const service = createServiceClient();
  const { data, error } = await service
    .from('company_settings')
    .update(updates)
    .eq('id', 1)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
