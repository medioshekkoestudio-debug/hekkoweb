# 🧭 Contexto del proyecto — Hekko

Cómo funciona la app por dentro. Última actualización: **2026-08-25**.

---

## ¿Qué es?

**Hekko** es una **PWA** (app web instalable) de seguimiento de proyectos para el
estudio Hekko, dedicado a **diseño gráfico, marketing y desarrollo web**.

El equipo abre una **orden** por cada proyecto de cliente, la asigna a un **estratega**
y va marcando el avance en **etapas**, adjuntando archivos en cada una. El cliente ve
ese avance desde un **enlace público** que se le comparte por WhatsApp, sin cuenta y
sin instalar nada.

> **Historia:** el proyecto nació como *Formula Taller*, un SaaS multi-taller para
> talleres mecánicos. En agosto de 2026 se reconvirtió a Hekko: una sola empresa, con
> vocabulario de agencia. Se eliminaron el registro público de empresas, el panel de
> superadmin de plataforma, las suscripciones y el límite del plan gratuito. Todo eso
> sigue en el historial de git si algún día hace falta.

---

## Enlaces y cuentas

| Recurso | Valor |
|---|---|
| Repositorio GitHub | `github.com/medioshekkoestudio-debug/hekkoweb` |
| Correo del negocio | `medios.hekkoestudio@gmail.com` |
| Proyecto Supabase | `usoaajqdphfvvzwdhdzf` |
| Proyecto Vercel | `hekkoweb/hekkoweb` |
| URL de producción | `https://hekkoweb.vercel.app` (sin dominio propio) |

**Auto-deploy:** cada `git push` a `main` redespliega en Vercel.

---

## Tecnología

- **Next.js 14** (App Router) + **React 18** + **TypeScript**
- **Supabase** (Postgres + Auth + Storage) con **RLS** activo
- **Tailwind** (parcial) + estilos en línea
- Hosting en **Vercel**

---

## Los tres accesos

| Rol | Ruta | Puede |
|---|---|---|
| **admin** | `/admin` | Todo: alta y baja de estrategas, crear/editar/eliminar cualquier orden, editar la marca de la empresa. |
| **strategist** | `/estratega` | Ver y trabajar todas las órdenes; eliminar solo las suyas (asignadas a él o creadas por él). |
| **cliente** | `/tracking/<token>` | Ver el avance de su proyecto. Sin sesión. |

No hay registro público: las cuentas del equipo las crea el administrador desde
`/admin/estrategas`.

---

## Modelo de datos

| Tabla | Para qué |
|---|---|
| `company_settings` | Marca de Hekko: nombre, logo, WhatsApp. **Fila única `id = 1`.** |
| `profiles` | Usuarios del equipo (nombre, teléfono, rol, activo). `id` = `auth.users.id`. El correo vive en `auth.users`. |
| `orders` | Órdenes de cliente: cliente, WhatsApp, `service_type`, `project_name`, estratega asignado, estado, `public_token` único para el seguimiento. |
| `order_stages` | Etapas de cada orden (nombre, descripción, estado, posición). |
| `stage_attachments` | Archivos de cada etapa (imágenes, video, audio, documentos). |

**Storage:** bucket **`stage-files`** (público) para archivos y logos.

### Enums

| Enum | Valores |
|---|---|
| `user_role` | `admin`, `strategist` |
| `order_status` | `sin_estratega`, `con_estratega`, `entregada` |
| `stage_status` | `pending`, `in_progress`, `done` |
| `service_type` | `diseno_grafico`, `marketing`, `desarrollo_web` |

### La etapa de posición 0

Al crear una orden, la app inserta una etapa especial en la **posición 0**,
llamada **"Materiales del cliente"**: ahí van los archivos que se adjuntan en el
formulario de creación (brief, referencias, logos, notas de voz).

No es una etapa del seguimiento: se muestra aparte, como información base del
proyecto. Las etapas reales van de la **posición 1** en adelante y las siembra el
trigger `seed_default_stages`:

1. Brief y diagnóstico
2. Propuesta y estrategia
3. Producción
4. Revisión con el cliente
5. Entrega final

Son editables, reordenables y se pueden agregar o quitar desde la app.

---

## Migraciones

Están en `supabase/migrations/` y se corren a mano en el **SQL Editor** de Supabase,
en orden:

1. `0001_hekko_init.sql` — enums, tablas, triggers, helpers de rol
2. `0002_hekko_rls.sql` — políticas RLS + bucket `stage-files`

Ambas son idempotentes.

> Cuando un cambio de código necesite una migración nueva, **córrela en Supabase
> antes de hacer push**: si no, la app nueva buscará una tabla o columna que aún no
> existe y las vistas fallan.

---

## Seguridad

- **RLS activo en todas las tablas.** Los helpers `is_staff()` e `is_admin()` son
  `security definer` para evitar recursión al consultar `profiles` desde una política.
- **El seguimiento del cliente NO pasa por RLS.** La ruta `/api/tracking/[token]` y la
  página `/tracking/[token]` leen con el **service role** y filtran por `public_token`.
  Por eso las tablas de órdenes están cerradas al público (`anon`): el token aleatorio
  es la única llave, y no hay ninguna política que exponga las órdenes al navegador
  sin sesión.
- **`company_settings` sí es de lectura pública**: es solo nombre y logo, y hace falta
  para pintar la marca en la página de seguimiento.
- La `SUPABASE_SERVICE_ROLE_KEY` solo se usa en el servidor (rutas de API y
  componentes de servidor). Nunca llega al navegador.

### Quién puede qué, en las rutas de API

`src/lib/api-auth.ts` centraliza esto:

- `getCaller()` — resuelve id y rol desde la cookie de sesión.
- `isStaff(caller)` — ¿es del equipo?
- `canManageOrder()` — cualquier miembro del equipo puede trabajar cualquier orden.
- `canDeleteOrder()` — más estricto: el admin borra cualquiera; el estratega solo las
  suyas (asignadas a él o creadas por él).

---

## Variables de entorno

| Variable | Nota |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | URL del proyecto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Llave pública |
| `SUPABASE_SERVICE_ROLE_KEY` | Llave privada — marcada como *Sensitive* en Vercel |
| `NEXT_PUBLIC_SITE_URL` | URL pública; se usa para armar los enlaces de seguimiento |

> Las `NEXT_PUBLIC_*` se hornean en el build → tras cambiarlas hay que **redesplegar**.
> `.env.local` está en `.gitignore` y nunca se sube al repo.

---

## Mapa del código

```
src/
├── app/
│   ├── admin/              Panel del administrador
│   │   ├── ordenes/        Lista y detalle de órdenes
│   │   ├── estrategas/     Alta y edición del equipo
│   │   └── empresa/        Marca de Hekko (nombre, logo, WhatsApp)
│   ├── estratega/          Panel del estratega
│   ├── tracking/[token]/   Seguimiento público del cliente
│   ├── login/              Inicio de sesión
│   ├── terminos/           Legales
│   ├── privacidad/
│   └── api/
│       ├── orders/         CRUD de órdenes, etapas y adjuntos
│       ├── strategists/    Alta, edición y baja del equipo
│       ├── company/        Marca de la empresa (+ /logo)
│       └── tracking/       Lectura pública por token
├── components/
│   ├── orders/             Formulario, tarjeta, línea de tiempo, adjuntos
│   ├── strategists/        Formulario y tarjeta de estratega
│   ├── layout/             TopBar, BottomNav
│   └── ui/                 Botón, input, select, modal, badge...
├── lib/
│   ├── api-auth.ts         Quién puede qué en las rutas de API
│   ├── company.ts          Lee la marca de Hekko
│   ├── strategists.ts      Lista estrategas con su correo
│   ├── supabase/           Clientes (navegador, servidor, middleware)
│   ├── types.ts            Tipos + etiquetas de servicios
│   └── utils.ts            Formatos, mensajes de WhatsApp, etiquetas de estado
└── middleware.ts           Rutas públicas y guardas por rol
```

---

## Detalles que cuesta redescubrir

- **La caché puede engañarte.** El service worker sirve contenido cacheado; tras un
  deploy, si ves algo viejo, hay que desregistrarlo. Ver [`CACHE.md`](CACHE.md).
- **El seguimiento del cliente no se cachea a propósito.** `tracking/[token]/page.tsx`
  declara `dynamic = 'force-dynamic'` **y** `fetchCache = 'force-no-store'`. Sin el
  segundo, Next.js cacheaba las consultas a Supabase (la página es pública, sin
  cookies) y no aparecían los archivos recién subidos.
- **Las etiquetas de servicio viven en un solo sitio:** `SERVICE_LABELS` en
  `src/lib/types.ts`. Si agregas un valor al enum `service_type` en la base, agrégalo
  también ahí o se romperá el `Record` tipado.
- **Al crear un estratega, la app arma un mensaje de WhatsApp** con sus credenciales
  (`buildCredentialsMessage` en `utils.ts`), para mandárselas de una vez.
