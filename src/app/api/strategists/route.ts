import { createServiceClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import type { CreateStrategistPayload, ProfileInsert } from '@/lib/types';
import { listStrategistsWithEmail } from '@/lib/strategists';
import { getCaller, isStaff } from '@/lib/api-auth';

// GET /api/strategists — estrategas del equipo.
export async function GET() {
  const caller = await getCaller();
  if (!caller) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!isStaff(caller)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const strategists = await listStrategistsWithEmail();
  return NextResponse.json(strategists);
}

// POST /api/strategists  (solo admin) — da de alta un estratega.
export async function POST(req: Request) {
  const caller = await getCaller();
  if (!caller) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (caller.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body: CreateStrategistPayload = await req.json();
  const service = createServiceClient();

  const { data: authData, error: authError } = await service.auth.admin.createUser({
    email: body.email,
    password: body.password,
    email_confirm: true,
    user_metadata: {
      full_name: body.full_name,
      role: 'strategist',
    },
  });

  if (authError) {
    return NextResponse.json({ error: authError.message }, { status: 400 });
  }

  // El trigger handle_new_user ya crea el perfil; el upsert asegura el teléfono
  // y deja la fila en su forma final.
  const profileData: ProfileInsert = {
    id: authData.user.id,
    full_name: body.full_name,
    role: 'strategist',
    phone: body.phone ?? null,
    active: true,
  };

  const { data: newProfile, error: profileError } = await service
    .from('profiles')
    .upsert(profileData, { onConflict: 'id' })
    .select()
    .single();

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 500 });
  }

  return NextResponse.json({ ...newProfile, email: body.email }, { status: 201 });
}
