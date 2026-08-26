# Hekko

PWA de **seguimiento de proyectos** para Hekko, estudio de estrategas de marketing
(diseño gráfico, marketing y desarrollo web).

El equipo abre una orden por cada proyecto de cliente, la asigna a un estratega y va
marcando el avance por etapas. El cliente sigue ese avance desde un **enlace público**
que se comparte por WhatsApp — sin cuenta, sin instalar nada.

---

## Los tres accesos

| Quién | Entra por | Qué hace |
|---|---|---|
| **Administrador** | `/admin` | Da de alta estrategas, crea y asigna órdenes, ve todo. |
| **Estratega** | `/estratega` | Trabaja las órdenes que tiene asignadas y actualiza sus etapas. |
| **Cliente** | `/tracking/<token>` | Ve el avance de su proyecto. Sin login. |

---

## Stack

- **Next.js 14** (App Router) + **React 18** + **TypeScript**
- **Supabase** — Postgres + Auth + Storage, con RLS activo
- **Tailwind** (parcial) + estilos en línea
- Desplegado en **Vercel**

---

## Arrancar en local

```bash
npm install
cp .env.example .env.local   # y rellena los valores de Supabase
npm run dev
```

Abre <http://localhost:3000>.

### Variables de entorno

Son 4 (ver `.env.example`):

| Variable | Para qué |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | URL del proyecto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Llave pública |
| `SUPABASE_SERVICE_ROLE_KEY` | Llave privada (solo servidor) |
| `NEXT_PUBLIC_SITE_URL` | URL pública, para armar los enlaces de seguimiento |

> Las `NEXT_PUBLIC_*` se hornean en el build: si las cambias en Vercel hay que **redesplegar**.

---

## Base de datos

Las migraciones están en `supabase/migrations/` y se corren **en orden** desde el
**SQL Editor** de Supabase:

1. `0001_hekko_init.sql` — enums, tablas, triggers y helpers
2. `0002_hekko_rls.sql` — políticas RLS + bucket `stage-files`

Después, crea el usuario administrador:

```bash
npm run seed:admin
```

### Modelo

| Tabla | Para qué |
|---|---|
| `company_settings` | Marca de Hekko (nombre, logo, WhatsApp). Fila única `id = 1`. |
| `profiles` | Usuarios del equipo (`admin` / `strategist`). `id` = `auth.users.id`. |
| `orders` | Órdenes de cliente: servicio, proyecto, WhatsApp, estratega asignado, `public_token`. |
| `order_stages` | Etapas de cada orden. La **posición 0** guarda los materiales que entregó el cliente. |
| `stage_attachments` | Archivos de cada etapa (imágenes, video, audio, documentos). |

**Servicios:** `diseno_grafico`, `marketing`, `desarrollo_web`
**Estados de orden:** `sin_estratega`, `con_estratega`, `entregada`
**Estados de etapa:** `pending`, `in_progress`, `done`

---

## Documentación

- [`DEPLOY.md`](DEPLOY.md) — desplegar en Supabase + Vercel, paso a paso
- [`COMANDOS.md`](COMANDOS.md) — comandos útiles y consultas SQL
- [`CONTEXTO.md`](CONTEXTO.md) — cómo funciona por dentro
- [`CACHE.md`](CACHE.md) — service worker y caché de la PWA
- `CREDENCIALES.md` — credenciales (local, no se sube al repo)
