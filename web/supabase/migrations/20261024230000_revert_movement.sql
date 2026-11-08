-- Deshacer un movimiento sin borrar nada: se registra el movimiento contrario,
-- ligado al original con reverts_movement_id.

-- Un movimiento se revierte a lo mucho una vez.
create unique index movements_reverts_once
  on public.movements (reverts_movement_id)
  where reverts_movement_id is not null;

-- security definer por la misma razón que register_manual_movement: bloquea la fila del
-- producto (FOR UPDATE) y cualquier miembro puede deshacer. Negocio y usuario se validan aquí.
create function public.revert_movement(p_movement_id uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_business_id uuid := public.current_business_id();
  v_movement public.movements;
  v_current numeric;
  v_revert_id uuid;
begin
  if v_business_id is null then
    raise exception 'Necesitas pertenecer a un negocio';
  end if;

  select * into v_movement
  from public.movements
  where id = p_movement_id and business_id = v_business_id
  for update;

  if not found then
    raise exception 'El movimiento no existe en tu negocio';
  end if;

  if v_movement.reverts_movement_id is not null then
    raise exception 'Una reversión no se puede deshacer';
  end if;

  if exists (select 1 from public.movements where reverts_movement_id = p_movement_id) then
    raise exception 'Este movimiento ya fue deshecho';
  end if;

  select current_quantity into v_current
  from public.products
  where id = v_movement.product_id
  for update;

  if v_current - v_movement.quantity < 0 then
    raise exception 'No se puede deshacer: el stock quedaría en negativo (hay % y habría que quitar %)',
      v_current, v_movement.quantity;
  end if;

  insert into public.movements (business_id, product_id, type, quantity, source, performed_by, reverts_movement_id)
  values (v_business_id, v_movement.product_id, v_movement.type, -v_movement.quantity, 'manual', auth.uid(), p_movement_id)
  returning id into v_revert_id;

  return v_revert_id;
end;
$$;

revoke execute on function public.revert_movement(uuid) from anon, public;
grant execute on function public.revert_movement(uuid) to authenticated;

-- El historial dice si un movimiento ya fue deshecho (reverted_by). Columna nueva al final.
create or replace view public.history_feed
with (security_invoker = true)
as
select
  m.id,
  m.business_id,
  'movimiento'::text as kind,
  m.type::text as event_type,
  m.product_id,
  p.name as product_name,
  p.unit as product_unit,
  m.quantity,
  m.source::text as source,
  null::jsonb as changes,
  m.performed_by,
  pr.full_name as performed_by_name,
  m.capture_item_id,
  m.reverts_movement_id,
  m.created_at,
  r.id as reverted_by
from public.movements m
join public.products p on p.id = m.product_id
left join public.profiles pr on pr.id = m.performed_by
left join public.movements r on r.reverts_movement_id = m.id

union all

select
  e.id,
  e.business_id,
  'catalogo'::text as kind,
  e.type::text as event_type,
  e.product_id,
  p.name as product_name,
  p.unit as product_unit,
  null::numeric as quantity,
  null::text as source,
  e.changes,
  e.performed_by,
  pr.full_name as performed_by_name,
  null::uuid as capture_item_id,
  null::uuid as reverts_movement_id,
  e.created_at,
  null::uuid as reverted_by
from public.catalog_events e
join public.products p on p.id = e.product_id
left join public.profiles pr on pr.id = e.performed_by;
