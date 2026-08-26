import { createClient, createServiceClient } from '@/lib/supabase/server';
import type { UserRole } from '@/lib/types';

export interface Caller {
  userId: string;
  role: UserRole | null;
}

/**
 * Resuelve el usuario autenticado (id y rol) a partir de la cookie de sesión.
 * Devuelve null si no hay sesión válida.
 */
export async function getCaller(): Promise<Caller | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  const profile = data as unknown as { role: UserRole } | null;
  return { userId: user.id, role: profile?.role ?? null };
}

/** True si el usuario pertenece al equipo de Hekko (admin o estratega). */
export function isStaff(caller: Caller): boolean {
  return caller.role === 'admin' || caller.role === 'strategist';
}

/**
 * True si quien llama puede gestionar la orden (editarla, cambiar su estado,
 * asignarla, y actualizar etapas y adjuntos).
 *
 * Al ser una sola empresa, cualquier miembro del equipo puede trabajar
 * cualquier orden: el mismo flujo para el admin y para el estratega.
 */
export async function canManageOrder(caller: Caller, orderId: string): Promise<boolean> {
  if (!isStaff(caller)) return false;

  const service = createServiceClient();
  const { data } = await service.from('orders').select('id').eq('id', orderId).single();
  return data !== null;
}

/**
 * True si quien llama puede ELIMINAR la orden. Más estricto que gestionarla:
 * el admin puede eliminar cualquiera; el estratega solo las suyas (asignadas
 * a él o creadas por él).
 */
export async function canDeleteOrder(caller: Caller, orderId: string): Promise<boolean> {
  if (!isStaff(caller)) return false;

  const service = createServiceClient();
  const { data } = await service
    .from('orders')
    .select('assigned_strategist_id, created_by')
    .eq('id', orderId)
    .single();

  const order = data as unknown as
    | { assigned_strategist_id: string | null; created_by: string | null }
    | null;
  if (!order) return false;

  if (caller.role === 'admin') return true;
  return order.assigned_strategist_id === caller.userId || order.created_by === caller.userId;
}
