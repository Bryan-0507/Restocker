-- Los trabajadores operan el catálogo; el administrador supervisa.
-- 1) Cualquier miembro crea, edita, activa y desactiva productos y alias.
-- 2) Cada cambio al catálogo queda en catalog_events (lo llenan triggers, no el frontend).

------------------------------------------------------------
-- 1. Permisos del catálogo para todos los miembros
------------------------------------------------------------

drop policy "Admin crea productos" on public.products;
drop policy "Admin edita productos" on public.products;
drop policy "Admin borra alias" on public.product_aliases;

create policy "Miembros crean productos" on public.products
  for insert to authenticated
  with check (business_id = public.current_business_id());

create policy "Miembros editan productos" on public.products
  for update to authenticated
  using (business_id = public.current_business_id())
  with check (business_id = public.current_business_id());

create policy "Miembros quitan alias" on public.product_aliases
  for delete to authenticated
  using (business_id = public.current_business_id());

-- create_product ya no exige ser administrador.
create or replace function public.create_product(
  p_name text,
  p_unit public.product_unit,
  p_minimum_quantity numeric default 0,
  p_description text default null,
  p_initial_quantity numeric default 0,
  p_aliases text[] default '{}'
)
returns uuid
language plpgsql
set search_path = ''
as $$
declare
  v_business_id uuid := public.current_business_id();
  v_product_id uuid;
begin
  if v_business_id is null then
    raise exception 'Necesitas pertenecer a un negocio';
  end if;

  if coalesce(p_initial_quantity, 0) < 0 then
    raise exception 'La cantidad inicial no puede ser negativa';
  end if;

  insert into public.products (business_id, name, description, unit, minimum_quantity)
  values (v_business_id, trim(p_name), nullif(trim(p_description), ''), p_unit, coalesce(p_minimum_quantity, 0))
  returning id into v_product_id;

  insert into public.product_aliases (product_id, business_id, alias, origin)
  select v_product_id, v_business_id, alias, 'manual'
  from (
    select distinct on (lower(trim(value))) trim(value) as alias
    from unnest(coalesce(p_aliases, '{}')) as value
    where length(trim(value)) > 0
  ) as cleaned;

  if coalesce(p_initial_quantity, 0) > 0 then
    insert into public.movements (business_id, product_id, type, quantity, source, performed_by)
    values (v_business_id, v_product_id, 'ajuste', p_initial_quantity, 'manual', auth.uid());
  end if;

  return v_product_id;
end;
$$;

------------------------------------------------------------
-- 2. Historial de cambios al catálogo
------------------------------------------------------------

create type public.catalog_event_type as enum (
  'producto_creado',
  'producto_editado',
  'producto_desactivado',
  'producto_reactivado',
  'alias_agregado',
  'alias_quitado'
);

create table public.catalog_events (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses (id) on delete cascade,
  product_id uuid not null references public.products (id) on delete cascade,
  type public.catalog_event_type not null,
  -- Nulo solo si el cambio no vino de un usuario (por ejemplo, el service role).
  performed_by uuid references public.profiles (id),
  -- producto_editado: { "campo": { "from": ..., "to": ... } } solo con lo que cambió.
  -- producto_creado: los datos con los que nació. alias_*: { "alias": ..., "origin": ... }.
  changes jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create index catalog_events_business_created_idx on public.catalog_events (business_id, created_at desc);
create index catalog_events_product_id_idx on public.catalog_events (product_id);

alter table public.catalog_events enable row level security;

create policy "Miembros ven los cambios del catálogo" on public.catalog_events
  for select to authenticated using (business_id = public.current_business_id());

-- Solo los triggers escriben aquí.
revoke insert, update, delete on public.catalog_events from authenticated;
revoke all on public.catalog_events from anon;

-- Producto creado o editado. current_quantity no cuenta: ese cambio ya vive en movements.
create function public.log_product_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_diff jsonb := '{}';
  v_field text;
  v_old jsonb;
  v_new jsonb;
begin
  if tg_op = 'INSERT' then
    insert into public.catalog_events (business_id, product_id, type, performed_by, changes)
    values (
      new.business_id, new.id, 'producto_creado', auth.uid(),
      jsonb_build_object(
        'name', new.name,
        'description', new.description,
        'unit', new.unit,
        'minimum_quantity', new.minimum_quantity
      )
    );
    return new;
  end if;

  v_old := to_jsonb(old);
  v_new := to_jsonb(new);

  foreach v_field in array array['name', 'description', 'unit', 'minimum_quantity', 'image_path'] loop
    if v_old -> v_field is distinct from v_new -> v_field then
      v_diff := v_diff || jsonb_build_object(v_field, jsonb_build_object('from', v_old -> v_field, 'to', v_new -> v_field));
    end if;
  end loop;

  if v_diff <> '{}' then
    insert into public.catalog_events (business_id, product_id, type, performed_by, changes)
    values (new.business_id, new.id, 'producto_editado', auth.uid(), v_diff);
  end if;

  if old.is_active is distinct from new.is_active then
    insert into public.catalog_events (business_id, product_id, type, performed_by)
    values (
      new.business_id, new.id,
      case when new.is_active then 'producto_reactivado' else 'producto_desactivado' end::public.catalog_event_type,
      auth.uid()
    );
  end if;

  return new;
end;
$$;

create trigger products_log_insert
  after insert on public.products
  for each row execute function public.log_product_change();

create trigger products_log_update
  after update on public.products
  for each row execute function public.log_product_change();

-- Alias agregado o quitado.
create function public.log_alias_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_row public.product_aliases := coalesce(new, old);
begin
  -- Si el producto se está borrando en cascada, no hay nada que registrar.
  if tg_op = 'DELETE' and not exists (select 1 from public.products where id = old.product_id) then
    return old;
  end if;

  insert into public.catalog_events (business_id, product_id, type, performed_by, changes)
  values (
    v_row.business_id, v_row.product_id,
    case when tg_op = 'INSERT' then 'alias_agregado' else 'alias_quitado' end::public.catalog_event_type,
    auth.uid(),
    jsonb_build_object('alias', v_row.alias, 'origin', v_row.origin)
  );

  return v_row;
end;
$$;

create trigger product_aliases_log
  after insert or delete on public.product_aliases
  for each row execute function public.log_alias_change();
