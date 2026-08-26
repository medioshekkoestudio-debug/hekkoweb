import { type NextRequest, NextResponse } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

// Rutas accesibles sin iniciar sesión.
const PUBLIC_ROUTES = [
  '/login',
  '/tracking',
  '/terminos',
  '/privacidad',
  '/reset-password',
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Rutas públicas (seguimiento del cliente, login y páginas legales).
  if (PUBLIC_ROUTES.some((route) => pathname.startsWith(route))) {
    return await updateSession(request).then((r) => r.supabaseResponse);
  }

  // Callback de autenticación.
  if (pathname.startsWith('/api/auth')) {
    return NextResponse.next();
  }

  // API pública de seguimiento (el token de la orden es la llave).
  if (pathname.startsWith('/api/tracking')) {
    return NextResponse.next();
  }

  const { supabaseResponse, user, supabase } = await updateSession(request);

  // Sin sesión → al login.
  if (!user) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirectedFrom', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Rol del usuario desde la tabla profiles.
  const { data: profileData } = await supabase
    .from('profiles')
    .select('role, active')
    .eq('id', user.id)
    .single();

  const profile = profileData as unknown as { role: string; active: boolean } | null;

  // Usuarios inactivos → al login.
  if (!profile || !profile.active) {
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  const role = profile.role;

  // /admin es solo del administrador.
  if (pathname.startsWith('/admin') && role !== 'admin') {
    return NextResponse.redirect(new URL('/estratega', request.url));
  }

  // /estratega es el panel de los estrategas; el admin tiene el suyo.
  if (pathname.startsWith('/estratega') && role === 'admin') {
    return NextResponse.redirect(new URL('/admin', request.url));
  }

  // Raíz: redirigir según el rol.
  if (pathname === '/') {
    return NextResponse.redirect(
      new URL(role === 'admin' ? '/admin' : '/estratega', request.url)
    );
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Todas las rutas EXCEPTO:
     * - _next/static (archivos estáticos)
     * - _next/image (optimización de imágenes)
     * - favicon.ico
     * - carpeta public
     */
    '/((?!_next/static|_next/image|favicon.ico|icons|manifest|sw\\.js|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
