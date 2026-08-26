// scripts/create-admin.mjs
// Crea (o repara) el usuario ADMINISTRADOR de Hekko.
//
// Uso:
//   npm run seed:admin
//
// Requiere NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en .env.local.
//
// Usa la Auth Admin API por fetch (sin supabase-js), así funciona en cualquier
// versión de Node. El trigger handle_new_user crea el perfil automáticamente;
// después forzamos role = 'admin' por si el usuario ya existía como estratega.
//
// Para usar otras credenciales, define ADMIN_EMAIL / ADMIN_PASSWORD /
// ADMIN_NAME en .env.local antes de correrlo.

import { readFileSync } from 'fs';
import { resolve } from 'path';

// Cargar .env.local manualmente
try {
  const envPath = resolve(process.cwd(), '.env.local');
  const envContent = readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach((line) => {
    const [key, ...rest] = line.split('=');
    if (key && rest.length > 0 && !key.trim().startsWith('#')) {
      process.env[key.trim()] = rest.join('=').trim();
    }
  });
} catch {
  // .env.local puede no existir en CI — usar las variables del sistema
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('❌  Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env.local');
  process.exit(1);
}

const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || 'medios.hekkoestudio@gmail.com').trim().toLowerCase();
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'hekko.654987';
const ADMIN_NAME = process.env.ADMIN_NAME || 'Hekko Estudio';

const headers = {
  apikey: SERVICE_KEY,
  Authorization: `Bearer ${SERVICE_KEY}`,
  'Content-Type': 'application/json',
};

// Busca el id de un usuario existente por correo (recorre la lista admin).
async function findUserIdByEmail(email) {
  for (let page = 1; page <= 20; page++) {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/admin/users?page=${page}&per_page=200`, {
      headers,
    });
    const data = await res.json().catch(() => ({}));
    const users = data.users || [];
    const found = users.find((u) => (u.email || '').toLowerCase() === email);
    if (found) return found.id;
    if (users.length < 200) break; // última página
  }
  return null;
}

async function main() {
  console.log(`\n🔧  Creando administrador de Hekko: ${ADMIN_EMAIL}`);

  const res = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      email_confirm: true,
      user_metadata: { full_name: ADMIN_NAME, role: 'admin' },
    }),
  });

  const data = await res.json().catch(() => ({}));
  let userId;

  if (res.ok) {
    userId = data.id;
    console.log('✅  Usuario creado:', userId);
  } else {
    const msg = data.msg || data.error_description || data.error || JSON.stringify(data);
    if (/registered|already/i.test(msg)) {
      console.log('⚠️   El usuario ya existía; reutilizando su cuenta.');
      userId = await findUserIdByEmail(ADMIN_EMAIL);
      if (!userId) {
        console.error('❌  No se pudo encontrar el id del usuario existente.');
        process.exit(1);
      }
      // Asegurar la contraseña conocida.
      await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${userId}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ password: ADMIN_PASSWORD }),
      });
    } else {
      console.error('❌  Error creando el usuario:', msg);
      process.exit(1);
    }
  }

  // El trigger handle_new_user ya insertó el perfil. Forzamos rol admin y
  // nombre, por si la fila venía de un alta anterior como estratega.
  const profRes = await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${userId}`, {
    method: 'PATCH',
    headers: { ...headers, Prefer: 'return=representation' },
    body: JSON.stringify({ full_name: ADMIN_NAME, role: 'admin', active: true }),
  });
  const profData = await profRes.json().catch(() => ([]));

  // Si el perfil no existía (trigger no aplicado), crearlo.
  if (Array.isArray(profData) && profData.length === 0) {
    const insRes = await fetch(`${SUPABASE_URL}/rest/v1/profiles`, {
      method: 'POST',
      headers: { ...headers, Prefer: 'resolution=merge-duplicates,return=representation' },
      body: JSON.stringify({ id: userId, full_name: ADMIN_NAME, role: 'admin', active: true }),
    });
    if (!insRes.ok) {
      const err = await insRes.json().catch(() => ({}));
      console.error('❌  Error creando el perfil:', JSON.stringify(err));
      process.exit(1);
    }
  }

  console.log('✅  Administrador listo.');
  console.log(`   Email:      ${ADMIN_EMAIL}`);
  console.log(`   Contraseña: ${ADMIN_PASSWORD}`);
  console.log('   Entra en:   /login\n');
  console.log('💡  Cambia la contraseña desde el panel de Supabase tras el primer ingreso.\n');
}

main();
