import { createServiceClient } from '@/lib/supabase/server';
import type { Strategist, Profile } from '@/lib/types';

/**
 * Lista los perfiles de estrategas con su correo de auth. Los correos viven en
 * auth.users (no en profiles), así que se leen con el service client y se
 * cruzan por id. Solo servidor.
 */
export async function listStrategistsWithEmail(): Promise<Strategist[]> {
  const service = createServiceClient();

  const { data: profiles } = await service
    .from('profiles')
    .select('*')
    .eq('role', 'strategist')
    .order('full_name', { ascending: true });

  const list = (profiles ?? []) as unknown as Profile[];

  const { data: usersData } = await service.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  });

  const emailById = new Map<string, string | null>();
  for (const u of usersData?.users ?? []) {
    emailById.set(u.id, u.email ?? null);
  }

  return list.map((p) => ({ ...p, email: emailById.get(p.id) ?? null }));
}
