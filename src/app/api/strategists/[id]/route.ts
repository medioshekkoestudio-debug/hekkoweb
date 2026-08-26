import { createServiceClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import type { UpdateStrategistPayload } from '@/lib/types';
import { getCaller } from '@/lib/api-auth';

type Params = { params: { id: string } };

/** True si el perfil existe y es un estratega (no se toca a otro admin). */
async function isStrategist(id: string): Promise<boolean> {
  const service = createServiceClient();
  const { data } = await service.from('profiles').select('role').eq('id', id).single();
  return (data as unknown as { role: string } | null)?.role === 'strategist';
}

// PATCH /api/strategists/:id  (solo admin)
// Actualiza los campos del perfil (full_name, phone, active) y/o las
// credenciales de auth (email, password).
export async function PATCH(req: Request, { params }: Params) {
  const caller = await getCaller();
  if (!caller) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (caller.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  if (!(await isStrategist(params.id))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body: UpdateStrategistPayload = await req.json();
  const service = createServiceClient();

  // 1. Credenciales (email / password): viven en auth.users.
  const authUpdate: { email?: string; password?: string } = {};
  if (typeof body.email === 'string' && body.email.length) authUpdate.email = body.email;
  if (typeof body.password === 'string' && body.password.length) authUpdate.password = body.password;

  if (Object.keys(authUpdate).length) {
    const { error: authError } = await service.auth.admin.updateUserById(params.id, authUpdate);
    if (authError) return NextResponse.json({ error: authError.message }, { status: 400 });
  }

  // 2. Campos del perfil (solo los que vengan en el cuerpo).
  const profileUpdate: Record<string, unknown> = {};
  if (typeof body.full_name === 'string') profileUpdate.full_name = body.full_name;
  if (body.phone !== undefined) profileUpdate.phone = body.phone || null;
  if (typeof body.active === 'boolean') profileUpdate.active = body.active;

  let profile: unknown = null;
  if (Object.keys(profileUpdate).length) {
    const { data, error } = await service
      .from('profiles')
      .update(profileUpdate)
      .eq('id', params.id)
      .select()
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    profile = data;
  } else {
    const { data } = await service.from('profiles').select('*').eq('id', params.id).single();
    profile = data;
  }

  // 3. Email canónico para la respuesta.
  let email: string | null = authUpdate.email ?? null;
  if (!email) {
    const { data: userData } = await service.auth.admin.getUserById(params.id);
    email = userData?.user?.email ?? null;
  }

  return NextResponse.json({ ...(profile as Record<string, unknown>), email });
}

// DELETE /api/strategists/:id  (solo admin)
export async function DELETE(_: Request, { params }: Params) {
  const caller = await getCaller();
  if (!caller) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (caller.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  if (!(await isStrategist(params.id))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const service = createServiceClient();

  // Se desactiva en vez de borrar, para no perder el historial de órdenes.
  const { data, error } = await service
    .from('profiles')
    .update({ active: false })
    .eq('id', params.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
