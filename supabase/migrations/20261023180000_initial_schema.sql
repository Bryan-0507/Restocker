-- Restocker: esquema inicial
-- Negocios, usuarios, catálogo/inventario, historial de movimientos y capturas del LLM.

------------------------------------------------------------
-- Enums
------------------------------------------------------------

create type public.business_category as enum (
  'reposteria', 'panaderia', 'restaurante', 'cafeteria', 'tienda',
  'ferreteria', 'farmacia', 'salon_belleza', 'otro'
);

create type public.user_role as enum ('admin', 'base');

create type public.product_unit as enum ('kg', 'g', 'lb', 'oz', 'l', 'ml', 'unidad');

create type public.alias_origin as enum ('manual', 'aprendido');

create type public.movement_type as enum ('entrada', 'uso', 'perdida', 'ajuste');

create type public.movement_source as enum ('foto', 'audio', 'texto', 'manual');

create type public.capture_status as enum ('procesando', 'en_revision', 'confirmada', 'descartada', 'error');

create type public.capture_input_type as enum ('foto', 'audio', 'texto');

create type public.capture_item_status as enum ('pendiente', 'aceptada', 'editada', 'descartada');

create type public.invitation_status as enum ('pendiente', 'aceptada', 'expirada');

------------------------------------------------------------
-- Tablas
------------------------------------------------------------

create table public.businesses (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(trim(name)) > 0),
  category public.business_category not null,
  category_other text,
  created_at timestamptz not null default now(),
  -- "otro" exige describir el giro; los demás no lo llevan.
  constraint businesses_category_other_check check (
    (category = 'otro' and length(trim(coalesce(category_other, ''))) > 0)
    or (category <> 'otro' and category_other is null)
  )
);

-- Perfil 1:1 con auth.users. Email y contraseña viven en Supabase Auth, no aquí.
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null default '',
  role public.user_role not null default 'admin',
  -- Nullable: el administrador se registra antes de crear su negocio.
  business_id uuid references public.businesses (id) on delete set null,
  created_at timestamptz not null default now()
);

-- Catálogo e inventario son la misma tabla.
create table public.products (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  name text not null check (length(trim(name)) > 0),
  description text,
  unit public.product_unit not null default 'unidad',
  image_path text,
  minimum_quantity numeric(12, 3) not null default 0 check (minimum_quantity >= 0),
  -- Lo mantiene el trigger de movements; nadie lo edita directo.
  current_quantity numeric(12, 3) not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  -- Permite la FK compuesta de product_aliases.
  unique (id, business_id)
);

-- Otros nombres del mismo producto ("philadelphia" → Queso crema).
create table public.product_aliases (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null,
  business_id uuid not null,
  alias text not null check (length(trim(alias)) > 0),
  origin public.alias_origin not null default 'manual',
  created_at timestamptz not null default now(),
  foreign key (product_id, business_id) references public.products (id, business_id) on delete cascade
);

-- Un alias apunta a un solo producto dentro del negocio.
create unique index product_aliases_business_alias_key
  on public.product_aliases (business_id, lower(trim(alias)));

create table public.captures (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  captured_by uuid not null references public.profiles (id),
  status public.capture_status not null default 'procesando',
  reviewed_by uuid references public.profiles (id),
  reviewed_at timestamptz,
  -- Métricas operativas para el informe.
  model text,
  prompt_version text,
  input_tokens integer check (input_tokens >= 0),
  output_tokens integer check (output_tokens >= 0),
  latency_ms integer check (latency_ms >= 0),
  cost_usd numeric(10, 6) check (cost_usd >= 0),
  raw_response jsonb,
  created_at timestamptz not null default now()
);

-- Una sola captura pendiente por negocio: Capturar se bloquea hasta revisarla.
create unique index captures_one_pending_per_business
  on public.captures (business_id)
  where status in ('procesando', 'en_revision');

create table public.capture_inputs (
  id uuid primary key default gen_random_uuid(),
  capture_id uuid not null references public.captures (id) on delete cascade,
  type public.capture_input_type not null,
  storage_path text,
  text_content text,
  transcription text,
  is_relevant boolean,
  rejection_reason text,
  created_at timestamptz not null default now(),
  -- Foto y audio van a Storage; el texto se guarda aquí.
  constraint capture_inputs_content_check check (
    (type = 'texto' and text_content is not null)
    or (type <> 'texto' and storage_path is not null)
  )
);

create table public.capture_items (
  id uuid primary key default gen_random_uuid(),
  capture_id uuid not null references public.captures (id) on delete cascade,
  input_id uuid references public.capture_inputs (id) on delete set null,
  raw_text text not null,
  -- Lo que propuso el LLM, sin modificar.
  llm_product_id uuid references public.products (id),
  llm_type public.movement_type,
  llm_quantity numeric(12, 3),
  confidence numeric(4, 3) check (confidence between 0 and 1),
  -- Lo que quedó tras la revisión.
  product_id uuid references public.products (id),
  type public.movement_type,
  quantity numeric(12, 3),
  status public.capture_item_status not null default 'pendiente',
  created_at timestamptz not null default now()
);

-- Libro de movimientos: solo se insertan filas. Deshacer = movimiento contrario.
create table public.movements (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  product_id uuid not null references public.products (id),
  type public.movement_type not null,
  -- Con signo, en la unidad del producto: + entra, − sale.
  quantity numeric(12, 3) not null check (quantity <> 0),
  source public.movement_source not null,
  performed_by uuid not null references public.profiles (id),
  capture_item_id uuid references public.capture_items (id),
  reverts_movement_id uuid references public.movements (id),
  created_at timestamptz not null default now()
);

create table public.invitations (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  email text not null check (position('@' in email) > 1),
  role public.user_role not null default 'base',
  invited_by uuid not null references public.profiles (id),
  status public.invitation_status not null default 'pendiente',
  expires_at timestamptz not null default now() + interval '7 days',
  created_at timestamptz not null default now()
);

create unique index invitations_one_pending_per_email
  on public.invitations (business_id, lower(email))
  where status = 'pendiente';

------------------------------------------------------------
-- Índices para las consultas frecuentes
------------------------------------------------------------

create index profiles_business_id_idx on public.profiles (business_id);
create index products_business_id_idx on public.products (business_id);
create index product_aliases_product_id_idx on public.product_aliases (product_id);
create index movements_business_created_idx on public.movements (business_id, created_at desc);
create index movements_product_id_idx on public.movements (product_id);
create index captures_business_created_idx on public.captures (business_id, created_at desc);
create index capture_inputs_capture_id_idx on public.capture_inputs (capture_id);
create index capture_items_capture_id_idx on public.capture_items (capture_id);
create index invitations_email_idx on public.invitations (lower(email)) where status = 'pendiente';

------------------------------------------------------------
-- Funciones auxiliares para RLS
------------------------------------------------------------

create function public.current_business_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select business_id from public.profiles where id = auth.uid()
$$;

create function public.is_business_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin' and business_id is not null
  )
$$;

------------------------------------------------------------
-- Triggers
------------------------------------------------------------

-- Crea el perfil al registrarse. Si el correo tiene una invitación vigente,
-- entra directo a ese negocio con el rol invitado.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  pending public.invitations;
begin
  select * into pending
  from public.invitations
  where lower(email) = lower(new.email)
    and status = 'pendiente'
    and expires_at > now()
  order by created_at desc
  limit 1;

  insert into public.profiles (id, full_name, role, business_id)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    coalesce(pending.role, 'admin'),
    pending.business_id
  );

  if pending.id is not null then
    update public.invitations set status = 'aceptada' where id = pending.id;
  end if;

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- El producto del movimiento tiene que ser del mismo negocio.
create function public.validate_movement()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not exists (
    select 1 from public.products
    where id = new.product_id and business_id = new.business_id
  ) then
    raise exception 'El producto no pertenece a este negocio';
  end if;

  return new;
end;
$$;

create trigger movements_validate
  before insert on public.movements
  for each row execute function public.validate_movement();

-- Mantiene products.current_quantity en sincronía con el libro de movimientos.
create function public.apply_movement()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.products
  set current_quantity = current_quantity + new.quantity
  where id = new.product_id;

  return new;
end;
$$;

create trigger movements_apply
  after insert on public.movements
  for each row execute function public.apply_movement();

------------------------------------------------------------
-- RPC
------------------------------------------------------------

-- Crea el negocio del usuario actual y lo deja como administrador.
create function public.create_business(
  p_name text,
  p_category public.business_category,
  p_category_other text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  new_business_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Necesitas iniciar sesión';
  end if;

  if exists (select 1 from public.profiles where id = auth.uid() and business_id is not null) then
    raise exception 'Ya perteneces a un negocio';
  end if;

  insert into public.businesses (name, category, category_other)
  values (p_name, p_category, p_category_other)
  returning id into new_business_id;

  update public.profiles
  set business_id = new_business_id, role = 'admin'
  where id = auth.uid();

  return new_business_id;
end;
$$;

------------------------------------------------------------
-- Permisos
------------------------------------------------------------

-- Nada es público sin sesión.
revoke all on all tables in schema public from anon;
revoke execute on all functions in schema public from anon, public;

grant execute on function public.current_business_id() to authenticated;
grant execute on function public.is_business_admin() to authenticated;
grant execute on function public.create_business(text, public.business_category, text) to authenticated;

-- El negocio se crea solo con create_business.
revoke insert, delete on public.businesses from authenticated;

-- Del perfil propio solo se edita el nombre; rol y negocio no.
revoke insert, update, delete on public.profiles from authenticated;
grant update (full_name) on public.profiles to authenticated;

-- current_quantity solo lo cambia el trigger de movements; los productos no se borran.
revoke insert, update, delete on public.products from authenticated;
grant insert (business_id, name, description, unit, image_path, minimum_quantity)
  on public.products to authenticated;
grant update (name, description, unit, image_path, minimum_quantity, is_active)
  on public.products to authenticated;

-- El libro de movimientos no se edita ni se borra.
revoke update, delete on public.movements from authenticated;

------------------------------------------------------------
-- RLS
------------------------------------------------------------

alter table public.businesses enable row level security;
alter table public.profiles enable row level security;
alter table public.products enable row level security;
alter table public.product_aliases enable row level security;
alter table public.movements enable row level security;
alter table public.captures enable row level security;
alter table public.capture_inputs enable row level security;
alter table public.capture_items enable row level security;
alter table public.invitations enable row level security;

-- businesses
create policy "Miembros ven su negocio" on public.businesses
  for select to authenticated using (id = public.current_business_id());

create policy "Admin edita su negocio" on public.businesses
  for update to authenticated
  using (id = public.current_business_id() and public.is_business_admin())
  with check (id = public.current_business_id());

-- profiles
create policy "Ver el propio perfil y a los miembros del negocio" on public.profiles
  for select to authenticated
  using (id = auth.uid() or business_id = public.current_business_id());

create policy "Editar el propio perfil" on public.profiles
  for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

-- products
create policy "Miembros ven los productos" on public.products
  for select to authenticated using (business_id = public.current_business_id());

create policy "Admin crea productos" on public.products
  for insert to authenticated
  with check (business_id = public.current_business_id() and public.is_business_admin());

create policy "Admin edita productos" on public.products
  for update to authenticated
  using (business_id = public.current_business_id() and public.is_business_admin())
  with check (business_id = public.current_business_id());

-- product_aliases: cualquier miembro puede agregar (los aprendidos salen de la revisión).
create policy "Miembros ven los alias" on public.product_aliases
  for select to authenticated using (business_id = public.current_business_id());

create policy "Miembros agregan alias" on public.product_aliases
  for insert to authenticated with check (business_id = public.current_business_id());

create policy "Admin borra alias" on public.product_aliases
  for delete to authenticated
  using (business_id = public.current_business_id() and public.is_business_admin());

-- movements
create policy "Miembros ven los movimientos" on public.movements
  for select to authenticated using (business_id = public.current_business_id());

create policy "Miembros registran movimientos propios" on public.movements
  for insert to authenticated
  with check (business_id = public.current_business_id() and performed_by = auth.uid());

-- captures: cualquier miembro captura y revisa.
create policy "Miembros ven las capturas" on public.captures
  for select to authenticated using (business_id = public.current_business_id());

create policy "Miembros crean capturas propias" on public.captures
  for insert to authenticated
  with check (business_id = public.current_business_id() and captured_by = auth.uid());

create policy "Miembros actualizan capturas" on public.captures
  for update to authenticated
  using (business_id = public.current_business_id())
  with check (business_id = public.current_business_id());

-- capture_inputs y capture_items heredan el negocio de su captura.
create policy "Miembros gestionan los adjuntos" on public.capture_inputs
  for all to authenticated
  using (exists (
    select 1 from public.captures c
    where c.id = capture_id and c.business_id = public.current_business_id()
  ))
  with check (exists (
    select 1 from public.captures c
    where c.id = capture_id and c.business_id = public.current_business_id()
  ));

create policy "Miembros gestionan las propuestas" on public.capture_items
  for all to authenticated
  using (exists (
    select 1 from public.captures c
    where c.id = capture_id and c.business_id = public.current_business_id()
  ))
  with check (exists (
    select 1 from public.captures c
    where c.id = capture_id and c.business_id = public.current_business_id()
  ));

-- invitations: solo el admin.
create policy "Admin gestiona invitaciones" on public.invitations
  for all to authenticated
  using (business_id = public.current_business_id() and public.is_business_admin())
  with check (
    business_id = public.current_business_id()
    and public.is_business_admin()
    and invited_by = auth.uid()
  );

------------------------------------------------------------
-- Storage: archivos privados por negocio, en la carpeta <business_id>/...
------------------------------------------------------------

insert into storage.buckets (id, name, public)
values
  ('captures', 'captures', false),
  ('product-images', 'product-images', false)
on conflict (id) do nothing;

create policy "Miembros leen archivos de su negocio" on storage.objects
  for select to authenticated
  using (
    bucket_id in ('captures', 'product-images')
    and (storage.foldername(name))[1] = public.current_business_id()::text
  );

create policy "Miembros suben capturas de su negocio" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'captures'
    and (storage.foldername(name))[1] = public.current_business_id()::text
  );

create policy "Admin sube imágenes de productos" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'product-images'
    and (storage.foldername(name))[1] = public.current_business_id()::text
    and public.is_business_admin()
  );

create policy "Admin reemplaza imágenes de productos" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'product-images'
    and (storage.foldername(name))[1] = public.current_business_id()::text
    and public.is_business_admin()
  );
