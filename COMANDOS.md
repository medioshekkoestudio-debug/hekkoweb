# ⌨️ Comandos y consultas útiles — Hekko

---

## Desarrollo

```bash
npm install          # instalar dependencias
npm run dev          # servidor local en http://localhost:3000
npm run build        # build de producción (falla si hay error de tipos o lint)
npm run lint         # solo el linter
npx tsc --noEmit     # solo comprobar tipos, sin compilar
```

> Antes de hacer push, corre `npm run build`. Es exactamente lo que corre Vercel:
> si pasa en local, el deploy no se cae.

---

## Usuarios

```bash
npm run seed:admin   # crea (o repara) el administrador de Hekko
```

Es idempotente: si el usuario ya existe le reafirma la contraseña y el rol `admin`.
Para usar otras credenciales, define `ADMIN_EMAIL` / `ADMIN_PASSWORD` / `ADMIN_NAME`
en `.env.local` antes de correrlo.

Los **estrategas** se crean desde la app, en `/admin/estrategas`.

---

## Git

```bash
git status                        # qué cambió
git add -A && git commit -m "..." # guardar
git push                          # subir → Vercel redespliega solo
git log --oneline -10             # últimos commits
```

---

## Consultas SQL (Supabase → SQL Editor)

### Ver el equipo

```sql
select p.full_name, p.role, p.active, u.email, p.created_at
from public.profiles p
join auth.users u on u.id = p.id
order by p.role, p.full_name;
```

### Convertir a alguien en administrador

```sql
update public.profiles p
set role = 'admin'
from auth.users u
where p.id = u.id
  and u.email = 'correo@ejemplo.com';
```

### Ver las órdenes con su estratega

```sql
select
  o.created_at::date               as fecha,
  o.client_first_name || ' ' || o.client_last_name as cliente,
  o.project_name                   as proyecto,
  o.service_type                   as servicio,
  o.status                         as estado,
  p.full_name                      as estratega
from public.orders o
left join public.profiles p on p.id = o.assigned_strategist_id
order by o.created_at desc;
```

### Avance de una orden

```sql
select s.position, s.name, s.status, s.completed_at
from public.order_stages s
join public.orders o on o.id = s.order_id
where o.public_token = 'PEGA-AQUI-EL-TOKEN'
order by s.position;
```

### Cambiar el nombre o el WhatsApp de la empresa

```sql
update public.company_settings
set name = 'Hekko', whatsapp = '+58...'
where id = 1;
```

### Agregar un servicio nuevo

Ya no hace falta SQL: en el formulario de la orden, abre el selector
**Servicio** y elige **Agregar servicio**. Queda disponible de inmediato para
todas las órdenes nuevas.

> Requiere haber ejecutado una vez
> [`supabase/migrations/0003_hekko_services.sql`](supabase/migrations/0003_hekko_services.sql),
> que convierte el enum `service_type` en la tabla `services`.

Para retirar un servicio del selector sin borrarlo (las órdenes que ya lo usan
no se tocan):

```sql
update public.services set active = false where slug = 'Producción audiovisual';
```

Para ver el catálogo:

```sql
select slug, label, active, position from public.services order by position;
```

### Cambiar las etapas por defecto de las órdenes nuevas

Edita la función `seed_default_stages` (está en `0001_hekko_init.sql`) y vuelve a
ejecutar ese bloque `create or replace function ...` en el SQL Editor.
Solo afecta a las órdenes que se creen a partir de ese momento.

---

## Reiniciar la app en el navegador

Si tras un deploy ves contenido viejo, el service worker está sirviendo caché:

1. DevTools → **Application → Service Workers → Unregister**
2. **Application → Storage → Clear site data**
3. Recarga

Ver [`CACHE.md`](CACHE.md) para el detalle de cómo funciona la caché.
