-- ============================================================================
-- Hekko — esquema inicial
-- ============================================================================
-- Plataforma de seguimiento de proyectos para Hekko (estrategas de marketing:
-- diseño gráfico, marketing y desarrollo web).
--
-- Una sola empresa. Tres tipos de acceso:
--   · admin      — dirige la operación: crea estrategas y órdenes.
--   · strategist — estratega asignado a una orden; la trabaja y la actualiza.
--   · cliente    — sin cuenta: ve el avance por un enlace público (public_token).
--
-- Las políticas RLS viven en 0002_hekko_rls.sql.
-- ----------------------------------------------------------------------------

create extension if not exists pgcrypto with schema extensions;

-- ----------------------------------------------------------------------------
-- Enums
-- ----------------------------------------------------------------------------
do $$ begin
  create type public.user_role as enum ('admin', 'strategist');
exception when duplicate_object then null; end $$;

do $$ begin
  -- sin_estratega : orden sin estratega asignado
  -- con_estratega : orden en proceso, con estratega asignado
  -- entregada     : proyecto terminado y entregado al cliente
  create type public.order_status as enum ('sin_estratega', 'con_estratega', 'entregada');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.stage_status as enum ('pending', 'in_progress', 'done');
exception when duplicate_object then null; end $$;

do $$ begin
  -- Servicios que ofrece Hekko. Para agregar uno nuevo:
  --   alter type public.service_type add value 'nuevo_servicio';
  create type public.service_type as enum ('diseno_grafico', 'marketing', 'desarrollo_web');
exception when duplicate_object then null; end $$;

-- ----------------------------------------------------------------------------
-- company_settings — datos de Hekko (fila única id = 1)
-- ----------------------------------------------------------------------------
-- Sustituye a la antigua tabla multi-tenant de talleres: al ser una sola
-- empresa, su marca vive en una fila única en vez de un tenant por cliente.
create table if not exists public.company_settings (
  id          smallint primary key default 1 check (id = 1),
  name        text        not null default 'Hekko',
  logo_url    text,
  whatsapp    text,
  updated_at  timestamptz not null default now()
);

comment on table public.company_settings is
  'Marca de Hekko (nombre, logo, WhatsApp). Fila única id = 1; se muestra en el panel y en el tracking del cliente.';

insert into public.company_settings (id, name) values (1, 'Hekko')
  on conflict (id) do nothing;

-- ----------------------------------------------------------------------------
-- profiles — una fila por usuario de auth; guarda el rol
-- ----------------------------------------------------------------------------
create table if not exists public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  full_name   text        not null,
  role        public.user_role not null default 'strategist',
  phone       text,
  active      boolean     not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

comment on table public.profiles is 'Usuarios del equipo Hekko (admins y estrategas).';

-- ----------------------------------------------------------------------------
-- orders — órdenes de cliente (proyectos)
-- ----------------------------------------------------------------------------
create table if not exists public.orders (
  id                      uuid primary key default extensions.gen_random_uuid(),
  public_token            uuid not null unique default extensions.gen_random_uuid(),
  client_first_name       text not null,
  client_last_name        text not null,
  client_whatsapp         text not null,
  service_type            public.service_type not null,
  project_name            text not null,
  assigned_strategist_id  uuid references public.profiles (id) on delete set null,
  status                  public.order_status not null default 'sin_estratega',
  notes                   text,
  created_by              uuid references public.profiles (id) on delete set null,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);

comment on table public.orders is
  'Órdenes de cliente. public_token se comparte con el cliente para el seguimiento público.';
comment on column public.orders.service_type is
  'Servicio contratado: diseño gráfico, marketing o desarrollo web.';
comment on column public.orders.project_name is
  'Nombre del proyecto, ej. "Rebranding Café Luna".';

create index if not exists orders_assigned_strategist_idx on public.orders (assigned_strategist_id);
create index if not exists orders_status_idx on public.orders (status);
create index if not exists orders_service_type_idx on public.orders (service_type);
create index if not exists orders_created_at_idx on public.orders (created_at desc);

-- ----------------------------------------------------------------------------
-- order_stages — la línea de tiempo que ve el cliente
-- ----------------------------------------------------------------------------
-- La posición 0 ("Materiales del cliente") guarda los archivos que se adjuntan
-- al crear la orden. Las etapas del proyecto van de la posición 1 en adelante
-- y las siembra el trigger seed_default_stages.
create table if not exists public.order_stages (
  id            uuid primary key default extensions.gen_random_uuid(),
  order_id      uuid not null references public.orders (id) on delete cascade,
  name          text not null,
  description   text,
  position      integer not null default 0,
  status        public.stage_status not null default 'pending',
  completed_at  timestamptz,
  created_at    timestamptz not null default now()
);

comment on table public.order_stages is
  'Etapas de seguimiento de una orden: las gestiona el equipo y las ve el cliente.';

create index if not exists order_stages_order_idx on public.order_stages (order_id, position);

-- ----------------------------------------------------------------------------
-- stage_attachments — archivos por etapa (imágenes, video, audio, documentos)
-- ----------------------------------------------------------------------------
create table if not exists public.stage_attachments (
  id          uuid primary key default extensions.gen_random_uuid(),
  stage_id    uuid not null references public.order_stages (id) on delete cascade,
  order_id    uuid not null references public.orders (id) on delete cascade,
  path        text not null,
  url         text not null,
  name        text,
  mime        text,
  created_by  uuid,
  created_at  timestamptz not null default now()
);

create index if not exists stage_attachments_stage_id_idx on public.stage_attachments (stage_id);

-- ----------------------------------------------------------------------------
-- Trigger updated_at
-- ----------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

drop trigger if exists trg_orders_updated_at on public.orders;
create trigger trg_orders_updated_at
  before update on public.orders
  for each row execute function public.set_updated_at();

drop trigger if exists trg_company_settings_updated_at on public.company_settings;
create trigger trg_company_settings_updated_at
  before update on public.company_settings
  for each row execute function public.set_updated_at();

-- ----------------------------------------------------------------------------
-- Etapas por defecto al crear una orden (posiciones 1..5)
-- ----------------------------------------------------------------------------
-- Son editables, reordenables y se pueden agregar/quitar desde la app.
create or replace function public.seed_default_stages()
returns trigger
language plpgsql
as $$
begin
  insert into public.order_stages (order_id, name, position, status, completed_at) values
    (new.id, 'Brief y diagnóstico',     1, 'pending', null),
    (new.id, 'Propuesta y estrategia',  2, 'pending', null),
    (new.id, 'Producción',              3, 'pending', null),
    (new.id, 'Revisión con el cliente', 4, 'pending', null),
    (new.id, 'Entrega final',           5, 'pending', null);
  return new;
end;
$$;

drop trigger if exists trg_seed_stages on public.orders;
create trigger trg_seed_stages
  after insert on public.orders
  for each row execute function public.seed_default_stages();

-- ----------------------------------------------------------------------------
-- Helpers de rol (security definer: evitan recursión de RLS sobre profiles)
-- ----------------------------------------------------------------------------
create or replace function public.is_staff()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and active = true
  );
$$;

create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin' and active = true
  );
$$;

-- ----------------------------------------------------------------------------
-- Alta de usuario → crear su perfil automáticamente
-- ----------------------------------------------------------------------------
-- El admin crea los estrategas con la Admin API (service role) pasando
-- full_name y role en user_metadata.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.email),
    coalesce((new.raw_user_meta_data->>'role')::public.user_role, 'strategist')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists trg_handle_new_user on auth.users;
create trigger trg_handle_new_user
  after insert on auth.users
  for each row execute function public.handle_new_user();
