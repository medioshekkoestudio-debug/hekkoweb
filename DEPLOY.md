# 🚀 Desplegar Hekko

Guía completa para dejar la app en producción: **Supabase** (base de datos) +
**Vercel** (hosting), enlazados al repo de GitHub.

> **Datos del proyecto**
> - Repo GitHub: `https://github.com/medioshekkoestudio-debug/hekkoweb`
> - Correo del negocio: `medios.hekkoestudio@gmail.com`
> - Supabase (project ref): `usoaajqdphfvvzwdhdzf`
> - Proyecto Vercel: `hekkoweb/hekkoweb`
> - URL de producción: `https://hekkoweb.vercel.app`

---

## 1. Supabase

### 1.1 Crear el proyecto

1. Entra a [supabase.com/dashboard](https://supabase.com/dashboard) con
   `medios.hekkoestudio@gmail.com`.
2. **New project** → nombre `hekko`, elige región cercana y **guarda la contraseña
   de la base de datos** en un lugar seguro.
3. Espera a que termine de aprovisionar (~2 min).

### 1.2 Correr las migraciones

En **SQL Editor → New query**, pega y ejecuta **en este orden**:

1. `supabase/migrations/0001_hekko_init.sql`
2. `supabase/migrations/0002_hekko_rls.sql`

Ambas son idempotentes: puedes volver a correrlas sin romper nada.

Verifica en **Table Editor** que existan: `company_settings`, `profiles`, `orders`,
`order_stages`, `stage_attachments`. Y en **Storage**, el bucket **`stage-files`**
marcado como público.

### 1.3 Copiar las llaves

**Project Settings → API**. Necesitas tres valores:

| Dónde dice | Va en |
|---|---|
| Project URL | `NEXT_PUBLIC_SUPABASE_URL` |
| `anon` / publishable key | `NEXT_PUBLIC_SUPABASE_ANON_KEY` |
| `service_role` / secret key | `SUPABASE_SERVICE_ROLE_KEY` |

> ⚠️ La `service_role` es **privada**: da acceso total saltándose RLS. Nunca la pongas
> en una variable `NEXT_PUBLIC_*` ni la subas al repo.

### 1.4 Configurar Auth

**Authentication → Sign In / Providers → Email**:

- Deja habilitado **email/contraseña**.
- **Desactiva "Allow new users to sign up"** (registros públicos). ⚠️ Es importante:
  el trigger `handle_new_user` toma el rol del `user_metadata` que manda quien se
  registra, así que con los registros abiertos cualquiera podría crearse una cuenta
  de **admin** usando solo la llave `anon`, que es pública.
  Esto **no** afecta a la app: el admin crea los estrategas con la Admin API
  (service role), que sigue funcionando con los registros cerrados.
- "Confirm email" puede quedarse como esté: tanto `npm run seed:admin` como
  `/api/strategists` crean las cuentas con `email_confirm: true`.

---

## 2. Crear el usuario administrador

En tu máquina, con `.env.local` ya lleno con los datos del paso 1.3:

```bash
npm run seed:admin
```

Crea `medios.hekkoestudio@gmail.com` con rol `admin`. Las credenciales completas
están en `CREDENCIALES.md` (local, no se sube al repo).

---

## 3. Vercel

### 3.1 Importar el repo

1. Entra a [vercel.com/new](https://vercel.com/new) con `medios.hekkoestudio@gmail.com`.
2. **Import Git Repository** → `medioshekkoestudio-debug/hekkoweb`.
   Si no aparece, dale permiso al repo desde la GitHub App de Vercel.
3. Framework: **Next.js** (lo detecta solo). No cambies los comandos de build.

### 3.2 Variables de entorno

Antes de desplegar, en **Settings → Environment Variables**, agrega las cuatro:

| Variable | Valor | Nota |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://usoaajqdphfvvzwdhdzf.supabase.co` | Del paso 1.3 |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon key | Del paso 1.3 |
| `SUPABASE_SERVICE_ROLE_KEY` | service role key | **Marcar como Sensitive** |
| `NEXT_PUBLIC_SITE_URL` | `https://hekkoweb.vercel.app` | La URL real de producción |

> **Sobre `NEXT_PUBLIC_SITE_URL`:** es la que se usa para armar los enlaces de
> seguimiento que se mandan por WhatsApp. Si queda mal, esos enlaces apuntarían a
> `localhost`. Como es `NEXT_PUBLIC_*`, se hornea en el build: si la cambias,
> hay que **redesplegar** (Deployments → ⋯ → Redeploy).

### 3.3 Desplegar

**Deploy**. A partir de aquí, cada `git push` a `main` redespliega automáticamente.

---

## 4. Volver a Supabase: URLs de autenticación

Con la URL de Vercel ya en mano, ve a
**Authentication → URL Configuration**:

- **Site URL:** `https://hekkoweb.vercel.app`
- **Redirect URLs:** agrega
  - `https://hekkoweb.vercel.app/**`
  - `https://hekkoweb.vercel.app/reset-password`
  - `http://localhost:3000/**` (para desarrollo)

Sin esto, el enlace de "restablecer contraseña" que llega por correo no funciona.

---

## 5. Comprobar que todo quedó bien

- [ ] Abres `https://hekkoweb.vercel.app/login` y carga.
- [ ] Entras como **admin** con `medios.hekkoestudio@gmail.com`.
- [ ] En `/admin/empresa` puedes cambiar el nombre y subir el logo.
- [ ] Creas un **estratega** en `/admin/estrategas` y puedes entrar con su cuenta.
- [ ] Creas una **orden** con servicio y nombre de proyecto.
- [ ] Adjuntas una foto a una etapa y se ve.
- [ ] Copias el enlace de seguimiento, lo abres **en una ventana privada** (sin sesión)
      y ves el avance del proyecto.
- [ ] Instalas la PWA desde el navegador móvil ("Agregar a pantalla de inicio").

---

## Actualizar producción

```bash
git add -A
git commit -m "descripción del cambio"
git push
```

Vercel redespliega solo. Si el cambio incluye una **migración de base de datos**,
córrela en el SQL Editor de Supabase **antes** de hacer push — si no, la app nueva
buscará una tabla o columna que todavía no existe.
