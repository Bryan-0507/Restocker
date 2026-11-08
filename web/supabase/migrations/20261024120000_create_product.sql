-- Catálogo: crear un producto con sus alias y su cantidad inicial en una sola transacción.

-- Un nombre de producto activo no se repite dentro del negocio.
create unique index products_business_active_name_key
  on public.products (business_id, lower(trim(name)))
  where is_active;

-- Corre con los permisos del usuario (security invoker), así que RLS sigue aplicando:
-- solo el admin puede crear productos, y el movimiento queda a su nombre.
create function public.create_product(
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

  if not public.is_business_admin() then
    raise exception 'Solo el administrador puede crear productos' using errcode = '42501';
  end if;

  if coalesce(p_initial_quantity, 0) < 0 then
    raise exception 'La cantidad inicial no puede ser negativa';
  end if;

  insert into public.products (business_id, name, description, unit, minimum_quantity)
  values (v_business_id, trim(p_name), nullif(trim(p_description), ''), p_unit, coalesce(p_minimum_quantity, 0))
  returning id into v_product_id;

  -- Alias sin vacíos ni repetidos dentro de la misma petición.
  insert into public.product_aliases (product_id, business_id, alias, origin)
  select v_product_id, v_business_id, alias, 'manual'
  from (
    select distinct on (lower(trim(value))) trim(value) as alias
    from unnest(coalesce(p_aliases, '{}')) as value
    where length(trim(value)) > 0
  ) as cleaned;

  -- La cantidad inicial entra como ajuste, para que el libro de movimientos cuadre.
  if coalesce(p_initial_quantity, 0) > 0 then
    insert into public.movements (business_id, product_id, type, quantity, source, performed_by)
    values (v_business_id, v_product_id, 'ajuste', p_initial_quantity, 'manual', auth.uid());
  end if;

  return v_product_id;
end;
$$;

revoke execute on function public.create_product(text, public.product_unit, numeric, text, numeric, text[]) from anon, public;
grant execute on function public.create_product(text, public.product_unit, numeric, text, numeric, text[]) to authenticated;
