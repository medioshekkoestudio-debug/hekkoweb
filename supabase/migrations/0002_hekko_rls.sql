-- ============================================================================
-- Hekko — Row Level Security
-- ============================================================================
-- Depende de 0001_hekko_init.sql (tablas y helpers is_staff/is_admin).
--
-- Criterio: el equipo de Hekko (admin + estrategas) ve y trabaja todas las
-- órdenes; solo el admin da de alta y elimina personas. El seguimiento del
-- cliente NO pasa por RLS: la ruta /api/tracking/[token] lee con el service
-- role y filtra por public_token, así que las tablas de órdenes quedan
-- cerradas al público (anon) y el enlace del cliente sigue funcionando.
-- ----------------------------------------------------------------------------

alter table public.company_settings  enable row level security;
alter table public.profiles          enable row level security;
alter table public.orders            enable row level security;
alter table public.order_stages      enable row level security;
alter table public.stage_attachments enable row level security;

-- ============================================================================
-- company_settings — la marca es pública (se muestra en el tracking del cliente)
-- ============================================================================
drop policy if exists "cualquiera puede leer la marca" on public.company_settings;
create policy "cualquiera puede leer la marca"
  on public.company_settings for select
  using (true);

drop policy if exists "admin actualiza la marca" on public.company_settings;
create policy "admin actualiza la marca"
  on public.company_settings for update
  using (public.is_admin());

-- ============================================================================
-- profiles
-- ============================================================================
drop policy if exists "equipo lee perfiles" on public.profiles;
create policy "equipo lee perfiles"
  on public.profiles for select
  using (public.is_staff());

drop policy if exists "admin crea perfiles" on public.profiles;
create policy "admin crea perfiles"
  on public.profiles for insert
  with check (public.is_admin());

drop policy if exists "admin actualiza cualquier perfil" on public.profiles;
create policy "admin actualiza cualquier perfil"
  on public.profiles for update
  using (public.is_admin());

drop policy if exists "cada quien actualiza su perfil" on public.profiles;
create policy "cada quien actualiza su perfil"
  on public.profiles for update
  using (auth.uid() = id and public.is_staff());

drop policy if exists "admin elimina perfiles" on public.profiles;
create policy "admin elimina perfiles"
  on public.profiles for delete
  using (public.is_admin());

-- ============================================================================
-- orders
-- ============================================================================
drop policy if exists "equipo lee ordenes" on public.orders;
create policy "equipo lee ordenes"
  on public.orders for select
  using (public.is_staff());

drop policy if exists "equipo crea ordenes" on public.orders;
create policy "equipo crea ordenes"
  on public.orders for insert
  with check (public.is_staff());

drop policy if exists "admin actualiza cualquier orden" on public.orders;
create policy "admin actualiza cualquier orden"
  on public.orders for update
  using (public.is_admin());

drop policy if exists "estratega actualiza su orden" on public.orders;
create policy "estratega actualiza su orden"
  on public.orders for update
  using (public.is_staff() and assigned_strategist_id = auth.uid());

drop policy if exists "admin elimina ordenes" on public.orders;
create policy "admin elimina ordenes"
  on public.orders for delete
  using (public.is_admin());

-- ============================================================================
-- order_stages
-- ============================================================================
drop policy if exists "equipo lee etapas" on public.order_stages;
create policy "equipo lee etapas"
  on public.order_stages for select
  using (public.is_staff());

drop policy if exists "equipo crea etapas" on public.order_stages;
create policy "equipo crea etapas"
  on public.order_stages for insert
  with check (public.is_staff());

drop policy if exists "admin actualiza cualquier etapa" on public.order_stages;
create policy "admin actualiza cualquier etapa"
  on public.order_stages for update
  using (public.is_admin());

drop policy if exists "estratega actualiza etapas de su orden" on public.order_stages;
create policy "estratega actualiza etapas de su orden"
  on public.order_stages for update
  using (
    public.is_staff()
    and exists (
      select 1 from public.orders o
      where o.id = order_id and o.assigned_strategist_id = auth.uid()
    )
  );

drop policy if exists "admin elimina etapas" on public.order_stages;
create policy "admin elimina etapas"
  on public.order_stages for delete
  using (public.is_admin());

-- ============================================================================
-- stage_attachments
-- ============================================================================
-- Las escrituras reales pasan por el service role en las rutas de API; estas
-- políticas mantienen la tabla coherente para cualquier acceso directo.
drop policy if exists "equipo lee adjuntos" on public.stage_attachments;
create policy "equipo lee adjuntos"
  on public.stage_attachments for select
  using (public.is_staff());

drop policy if exists "equipo crea adjuntos" on public.stage_attachments;
create policy "equipo crea adjuntos"
  on public.stage_attachments for insert
  with check (public.is_staff());

drop policy if exists "equipo elimina adjuntos" on public.stage_attachments;
create policy "equipo elimina adjuntos"
  on public.stage_attachments for delete
  using (public.is_staff());

-- ============================================================================
-- Storage — bucket público de archivos de etapas y logos
-- ============================================================================
-- Público en lectura para que las imágenes carguen en el seguimiento del
-- cliente (que no tiene sesión). Las subidas van por el service role.
insert into storage.buckets (id, name, public)
values ('stage-files', 'stage-files', true)
on conflict (id) do nothing;
