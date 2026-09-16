import { createServiceClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { getCaller, isStaff } from '@/lib/api-auth';
import { SERVICE_LABELS } from '@/lib/types';
import type { Service } from '@/lib/types';

/** Catálogo por defecto, por si la migración 0003 aún no se ha ejecutado. */
const FALLBACK: Service[] = Object.entries(SERVICE_LABELS).map(([slug, label], i) => ({
  slug,
  label,
  active: true,
  position: i + 1,
  created_at: '',
}));

/** Normaliza el nombre escrito por el usuario: sin espacios de sobra, con tope. */
function cleanLabel(value: unknown): string {
  if (typeof value !== 'string') return '';
  return value.replace(/\s+/g, ' ').trim().slice(0, 60);
}

// GET /api/services — servicios activos, para el selector del formulario.
export async function GET() {
  const caller = await getCaller();
  if (!caller) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!isStaff(caller)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const service = createServiceClient();
  const { data, error } = await service
    .from('services')
    .select('*')
    .eq('active', true)
    .order('position')
    .order('label');

  // Sin tabla todavía (migración pendiente): devolver los tres de siempre para
  // que el formulario siga funcionando en vez de quedarse vacío.
  if (error) return NextResponse.json(FALLBACK);

  return NextResponse.json(data);
}

// POST /api/services — agrega un servicio al catálogo desde el formulario.
export async function POST(req: Request) {
  const caller = await getCaller();
  if (!caller) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!isStaff(caller)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = (await req.json().catch(() => null)) as { label?: string } | null;
  const label = cleanLabel(body?.label);

  if (!label) {
    return NextResponse.json({ error: 'Escribe el nombre del servicio.' }, { status: 400 });
  }

  const service = createServiceClient();

  // El slug de los servicios nuevos es su propio nombre visible: así se muestra
  // bien en todas las pantallas sin depender del mapa de etiquetas.
  const slug = label;

  // ¿Ya existe? Devolverlo en vez de fallar, para que el formulario lo seleccione.
  const { data: existing } = await service
    .from('services')
    .select('*')
    .eq('slug', slug)
    .maybeSingle();

  if (existing) return NextResponse.json(existing);

  // Colocarlo al final de la lista.
  const { data: last } = await service
    .from('services')
    .select('position')
    .order('position', { ascending: false })
    .limit(1)
    .maybeSingle();

  const position = ((last as unknown as { position: number } | null)?.position ?? 0) + 1;

  const { data, error } = await service
    .from('services')
    .insert({ slug, label, position, active: true })
    .select()
    .single();

  if (error) {
    // La tabla no existe: la migración 0003 sigue pendiente.
    if (error.code === '42P01') {
      return NextResponse.json(
        {
          error:
            'El catálogo de servicios aún no está creado en la base de datos. Ejecuta la migración 0003_hekko_services.sql.',
        },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
