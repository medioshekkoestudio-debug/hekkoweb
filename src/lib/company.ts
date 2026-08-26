import { createClient } from '@/lib/supabase/server';
import type { CompanySettings } from '@/lib/types';

/**
 * Lee la marca de Hekko (fila única de company_settings). La usan los layouts
 * del panel y el seguimiento del cliente para mostrar nombre y logo.
 *
 * Devuelve null si la fila aún no existe (base recién creada sin migrar).
 */
export async function getCompany(): Promise<CompanySettings | null> {
  const supabase = await createClient();
  const { data } = await supabase.from('company_settings').select('*').eq('id', 1).single();
  return (data as unknown as CompanySettings | null) ?? null;
}
