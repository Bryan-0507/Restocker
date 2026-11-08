-- Historial: movimientos de stock y cambios al catálogo en una sola línea de tiempo.
-- security_invoker = true: la vista respeta el RLS de las tablas base, así que cada
-- usuario solo ve lo de su negocio.

-- now() es la hora de inicio de la transacción: todo lo que hace create_product (producto,
-- alias, stock inicial) quedaría con la misma hora y en orden aleatorio. clock_timestamp()
-- marca el momento real de cada fila.
alter table public.movements alter column created_at set default clock_timestamp();
alter table public.catalog_events alter column created_at set default clock_timestamp();

create view public.history_feed
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
  m.created_at
from public.movements m
join public.products p on p.id = m.product_id
left join public.profiles pr on pr.id = m.performed_by

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
  e.created_at
from public.catalog_events e
join public.products p on p.id = e.product_id
left join public.profiles pr on pr.id = e.performed_by;

revoke all on public.history_feed from anon;
grant select on public.history_feed to authenticated;
