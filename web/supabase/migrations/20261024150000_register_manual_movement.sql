-- Inventario: registrar un movimiento a mano, sin pasar por una captura.
--
-- p_quantity siempre llega positiva y el signo lo pone el tipo:
--   entrada → suma · uso / perdida → resta · ajuste → p_quantity es lo que hay contado,
--   y se registra la diferencia contra el stock actual.

create function public.register_manual_movement(
  p_product_id uuid,
  p_type public.movement_type,
  p_quantity numeric
)
returns uuid
language plpgsql
-- security definer: el FOR UPDATE exigiría la política de UPDATE de products (solo admin),
-- y cualquier miembro puede registrar movimientos. El negocio y el usuario se validan aquí.
security definer
set search_path = ''
as $$
declare
  v_business_id uuid := public.current_business_id();
  v_current numeric;
  v_delta numeric;
  v_movement_id uuid;
begin
  if v_business_id is null then
    raise exception 'Necesitas pertenecer a un negocio';
  end if;

  if p_quantity is null or p_quantity < 0 or (p_type <> 'ajuste' and p_quantity = 0) then
    raise exception 'La cantidad debe ser mayor a cero';
  end if;

  -- Bloquea la fila para que dos ajustes simultáneos no calculen sobre el mismo stock.
  select current_quantity into v_current
  from public.products
  where id = p_product_id and business_id = v_business_id and is_active
  for update;

  if not found then
    raise exception 'El producto no existe en tu negocio';
  end if;

  v_delta := case p_type
    when 'entrada' then p_quantity
    when 'ajuste' then p_quantity - v_current
    else -p_quantity
  end;

  if v_delta = 0 then
    raise exception 'El conteo coincide con el stock actual; no hay nada que ajustar';
  end if;

  if v_current + v_delta < 0 then
    raise exception 'No hay suficiente stock: quedan % y quieres sacar %', v_current, p_quantity;
  end if;

  insert into public.movements (business_id, product_id, type, quantity, source, performed_by)
  values (v_business_id, p_product_id, p_type, v_delta, 'manual', auth.uid())
  returning id into v_movement_id;

  return v_movement_id;
end;
$$;

revoke execute on function public.register_manual_movement(uuid, public.movement_type, numeric) from anon, public;
grant execute on function public.register_manual_movement(uuid, public.movement_type, numeric) to authenticated;
