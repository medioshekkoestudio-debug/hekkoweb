-- ============================================================================
-- Hekko — catálogo de servicios editable desde la app
-- ============================================================================
-- Antes los servicios eran un enum (`public.service_type`), así que agregar uno
-- exigía correr `alter type ... add value` a mano en el SQL Editor. Un enum no
-- se puede ampliar desde la aplicación: es DDL y el cliente de Supabase no
-- tiene ese privilegio.
--
-- Aquí el catálogo pasa a ser una tabla normal y `orders.service_type` pasa de
-- enum a texto, con clave foránea al catálogo. Así el equipo agrega servicios
-- desde el formulario de la orden, sin tocar la base.
--
-- Es seguro de re-ejecutar (idempotente) y NO borra ni modifica ninguna orden:
-- solo cambia el tipo de la columna, conservando los valores que ya tenía.
--
-- Depende de 0001_hekko_init.sql (helpers is_staff / is_admin).
-- ----------------------------------------------------------------------------

-- ----------------------------------------------------------------------------
-- services — los servicios que ofrece Hekko
-- ----------------------------------------------------------------------------
-- `slug` es el valor que se guarda en orders.service_type.
--   · Los tres originales conservan el slug del enum ('diseno_grafico', ...) y
--     se traducen a su etiqueta con SERVICE_LABELS en src/lib/types.ts.
--   · Los que se agregan desde la app guardan su nombre visible tal cual, para
--     que se muestren bien en cualquier pantalla sin depender de ese mapa.
create table if not exists public.services (
  slug        text primary key,
  label       text        not null,
  active      boolean     not null default true,
  position    integer     not null default 0,
  created_at  timestamptz not null default now()
);

comment on table public.services is
  'Catálogo de servicios de Hekko. El equipo lo amplía desde el formulario de la orden.';
comment on column public.services.slug is
  'Valor guardado en orders.service_type. Los tres originales son el slug del enum antiguo.';

-- Sembrar los tres servicios que ya existían como enum.
insert into public.services (slug, label, position) values
  ('diseno_grafico', 'Diseño gráfico', 1),
  ('marketing',      'Marketing',      2),
  ('desarrollo_web', 'Desarrollo web', 3)
on conflict (slug) do nothing;

-- ----------------------------------------------------------------------------
-- orders.service_type : enum -> text
-- ----------------------------------------------------------------------------
-- El índice se apoya en el tipo de la columna, así que se recrea después.
drop index if exists public.orders_service_type_idx;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name   = 'orders'
      and column_name  = 'service_type'
      and udt_name     = 'service_type'   -- todavía es el enum
  ) then
    alter table public.orders
      alter column service_type type text using service_type::text;
  end if;
end $$;

create index if not exists orders_service_type_idx on public.orders (service_type);

-- Cada orden debe apuntar a un servicio del catálogo. `on update cascade`
-- permite renombrar un servicio más adelante sin dejar órdenes huérfanas.
alter table public.orders drop constraint if exists orders_service_type_fkey;
alter table public.orders
  add constraint orders_service_type_fkey
  foreign key (service_type) references public.services (slug)
  on update cascade;

comment on column public.orders.service_type is
  'Servicio contratado. Referencia a services.slug.';

-- El tipo public.service_type queda sin usar. Se deja a propósito: eliminarlo
-- no aporta nada y sería irreversible si hiciera falta volver atrás.

-- ----------------------------------------------------------------------------
-- RLS — mismo criterio que el resto: el equipo lee y crea, el admin manda
-- ----------------------------------------------------------------------------
-- Crear un servicio es de bajo riesgo y cualquiera del equipo crea órdenes, así
-- que el alta la puede hacer todo el equipo (igual que órdenes y etapas).
-- Renombrar o desactivar sí queda reservado al admin.
alter table public.services enable row level security;

drop policy if exists "equipo lee servicios" on public.services;
create policy "equipo lee servicios"
  on public.services for select
  using (public.is_staff());

drop policy if exists "equipo crea servicios" on public.services;
create policy "equipo crea servicios"
  on public.services for insert
  with check (public.is_staff());

drop policy if exists "admin actualiza servicios" on public.services;
create policy "admin actualiza servicios"
  on public.services for update
  using (public.is_admin());

drop policy if exists "admin elimina servicios" on public.services;
create policy "admin elimina servicios"
  on public.services for delete
  using (public.is_admin());
