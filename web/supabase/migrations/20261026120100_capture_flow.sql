-- Flujo de Capturar (docs/decisiones-captura.md):
-- 1) Columnas para el veredicto por entrada y lo que el modelo devuelve por propuesta.
-- 2) create_capture: guarda en una transacción la captura ya procesada por Gemini.
-- 3) confirm_capture / discard_capture: cierran la revisión en una sola transacción.
-- 4) Los archivos de la captura se pueden borrar al terminar la revisión.

------------------------------------------------------------
-- 1. Columnas
------------------------------------------------------------

-- Mismos valores que REJECTION_CATEGORIES en capture-response-schema.ts.
create type public.capture_rejection_category as enum (
  'sin_relacion',
  'sin_sentido',
  'ilegible',
  'inaudible',
  'consulta',
  'sin_movimiento',
  'instrucciones'
);

-- Mensaje del modelo cuando rechaza la captura completa.
alter table public.captures add column rejection_message text;

alter table public.capture_inputs
  add column rejection_category public.capture_rejection_category,
  -- Orden en que se enviaron, para mostrarlas igual en la revisión.
  add column position smallint not null default 0,
  -- Relevante sin categoría; rechazada con categoría. Null mientras no haya veredicto.
  add constraint capture_inputs_rejection_check check (
    is_relevant is null or is_relevant = (rejection_category is null)
  );

alter table public.capture_items
  -- La palabra con la que el modelo reconoció el producto; se aprende como alias si se corrige.
  add column product_mention text,
  -- Solo si el producto no está en el catálogo (llm_product_id nulo).
  add column suggested_product_name text,
  -- Lo dicho antes de convertir, para revisar las conversiones en el eval.
  add column quantity_mentioned numeric(12, 3),
  add column unit_mentioned text,
  add column review_note text,
  -- Orden en que vinieron en la respuesta; es el orden de la pila de revisión.
  add column position smallint not null default 0;

------------------------------------------------------------
-- 2. Guardar la captura procesada
------------------------------------------------------------

-- La ruta del servidor llama a Gemini y después guarda todo aquí, con la sesión del usuario.
-- Los ids de la captura y las entradas los genera la ruta, porque los archivos ya se subieron
-- a <business_id>/<capture_id>/... antes de llamar a esta función.
--
-- p_inputs: [{ id, type, storage_path, text_content, transcription, is_relevant,
--              rejection_category, rejection_reason }]
-- p_items:  [{ input_id, raw_text, product_mention, product_id, suggested_product_name, type,
--              quantity_mentioned, unit_mentioned, quantity, review_note, confidence }]
--
-- security definer como las demás RPC que escriben varias tablas; negocio y usuario se validan aquí.
create function public.create_capture(
  p_capture_id uuid,
  p_status public.capture_status,
  p_model text,
  p_prompt_version text,
  p_input_tokens integer,
  p_output_tokens integer,
  p_latency_ms integer,
  p_cost_usd numeric,
  p_raw_response jsonb,
  p_rejection_message text default null,
  p_inputs jsonb default '[]',
  p_items jsonb default '[]'
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_business_id uuid := public.current_business_id();
  v_item_count integer := jsonb_array_length(coalesce(p_items, '[]'));
begin
  if v_business_id is null then
    raise exception 'Necesitas pertenecer a un negocio';
  end if;

  if p_status not in ('en_revision', 'rechazada', 'error') then
    raise exception 'Estado de captura no válido: %', p_status;
  end if;

  if p_status = 'en_revision' and v_item_count = 0 then
    raise exception 'Una captura para revisar necesita al menos una propuesta';
  end if;

  if p_status <> 'en_revision' and v_item_count > 0 then
    raise exception 'Solo una captura para revisar lleva propuestas';
  end if;

  if p_status = 'rechazada' and length(trim(coalesce(p_rejection_message, ''))) = 0 then
    raise exception 'Una captura rechazada necesita el mensaje del modelo';
  end if;

  -- Candado: el índice captures_one_pending_per_business deja una sola en revisión por negocio.
  begin
    insert into public.captures (
      id, business_id, captured_by, status, model, prompt_version,
      input_tokens, output_tokens, latency_ms, cost_usd, raw_response, rejection_message
    )
    values (
      p_capture_id, v_business_id, auth.uid(), p_status, p_model, p_prompt_version,
      p_input_tokens, p_output_tokens, p_latency_ms, p_cost_usd, p_raw_response,
      nullif(trim(p_rejection_message), '')
    );
  exception when unique_violation then
    raise exception 'Alguien acaba de enviar una captura; revísala primero' using errcode = '23505';
  end;

  insert into public.capture_inputs (
    id, capture_id, type, storage_path, text_content, transcription,
    is_relevant, rejection_category, rejection_reason, position
  )
  select
    r.id, p_capture_id, r.type, r.storage_path, r.text_content, r.transcription,
    r.is_relevant, r.rejection_category, r.rejection_reason, (e.ord - 1)::smallint
  from jsonb_array_elements(coalesce(p_inputs, '[]')) with ordinality as e(value, ord),
    jsonb_to_record(e.value) as r(
      id uuid,
      type public.capture_input_type,
      storage_path text,
      text_content text,
      transcription text,
      is_relevant boolean,
      rejection_category public.capture_rejection_category,
      rejection_reason text
    );

  -- Los archivos tienen que estar en la carpeta del negocio (la misma regla que Storage).
  if exists (
    select 1 from public.capture_inputs
    where capture_id = p_capture_id
      and storage_path is not null
      and split_part(storage_path, '/', 1) <> v_business_id::text
  ) then
    raise exception 'Un archivo de la captura no está en la carpeta de tu negocio';
  end if;

  insert into public.capture_items (
    capture_id, input_id, raw_text, product_mention, llm_product_id, suggested_product_name,
    llm_type, quantity_mentioned, unit_mentioned, llm_quantity, review_note, confidence, position
  )
  select
    p_capture_id, r.input_id, r.raw_text, nullif(trim(r.product_mention), ''), r.product_id,
    nullif(trim(r.suggested_product_name), ''), r.type, r.quantity_mentioned,
    nullif(trim(r.unit_mentioned), ''), r.quantity, nullif(trim(r.review_note), ''), r.confidence,
    (e.ord - 1)::smallint
  from jsonb_array_elements(coalesce(p_items, '[]')) with ordinality as e(value, ord),
    jsonb_to_record(e.value) as r(
      input_id uuid,
      raw_text text,
      product_mention text,
      product_id uuid,
      suggested_product_name text,
      type public.movement_type,
      quantity_mentioned numeric,
      unit_mentioned text,
      quantity numeric,
      review_note text,
      confidence numeric
    );

  if exists (
    select 1 from public.capture_items i
    where i.capture_id = p_capture_id
      and not exists (
        select 1 from public.capture_inputs ci
        where ci.id = i.input_id and ci.capture_id = p_capture_id and ci.is_relevant
      )
  ) then
    raise exception 'Cada propuesta tiene que venir de una entrada relevante de esta captura';
  end if;

  if exists (
    select 1 from public.capture_items i
    where i.capture_id = p_capture_id
      and i.llm_product_id is not null
      and not exists (
        select 1 from public.products p
        where p.id = i.llm_product_id and p.business_id = v_business_id
      )
  ) then
    raise exception 'Una propuesta apunta a un producto que no es de tu negocio';
  end if;

  return p_capture_id;
end;
$$;

------------------------------------------------------------
-- 3. Cerrar la revisión
------------------------------------------------------------

-- Confirma la revisión: movimientos, alias aprendidos, estado de cada propuesta y de la
-- captura, todo junto. Al pasar a confirmada se libera el candado de Capturar.
--
-- p_decisions: [{ item_id, action: 'aceptar' | 'descartar', product_id, type, quantity }]
-- Las propuestas que no vienen en p_decisions se descartan (por ejemplo, las de productos
-- que no están en el catálogo). quantity llega positiva; en ajuste es el total contado.
--
-- security definer por la misma razón que register_manual_movement (bloquea productos con
-- FOR UPDATE); negocio y usuario se validan aquí.
create function public.confirm_capture(p_capture_id uuid, p_decisions jsonb)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_business_id uuid := public.current_business_id();
  v_decisions jsonb := coalesce(p_decisions, '[]');
  v_item record;
  v_decision jsonb;
  v_product public.products;
  v_type public.movement_type;
  v_quantity numeric;
  v_delta numeric;
  v_movement_id uuid;
  v_movements integer := 0;
begin
  if v_business_id is null then
    raise exception 'Necesitas pertenecer a un negocio';
  end if;

  perform 1 from public.captures
  where id = p_capture_id and business_id = v_business_id and status = 'en_revision'
  for update;

  if not found then
    raise exception 'Esta captura ya no está pendiente de revisión';
  end if;

  if exists (
    select 1 from jsonb_array_elements(v_decisions) d
    where not exists (
      select 1 from public.capture_items i
      where i.capture_id = p_capture_id and i.id = (d ->> 'item_id')::uuid
    )
  ) then
    raise exception 'Hay decisiones sobre propuestas que no son de esta captura';
  end if;

  -- En el orden de la pila: dos propuestas del mismo producto se aplican una tras otra.
  for v_item in
    select i.*, ci.type as input_type
    from public.capture_items i
    left join public.capture_inputs ci on ci.id = i.input_id
    where i.capture_id = p_capture_id
    order by i.position, i.created_at
  loop
    v_decision := (
      select d from jsonb_array_elements(v_decisions) d
      where (d ->> 'item_id')::uuid = v_item.id
      limit 1
    );

    if v_decision is null or v_decision ->> 'action' = 'descartar' then
      update public.capture_items set status = 'descartada' where id = v_item.id;
      continue;
    end if;

    if v_decision ->> 'action' is distinct from 'aceptar' then
      raise exception 'Acción no válida: %', v_decision ->> 'action';
    end if;

    v_type := (v_decision ->> 'type')::public.movement_type;
    v_quantity := (v_decision ->> 'quantity')::numeric;

    if v_type is null then
      raise exception 'Falta el tipo de movimiento en "%"', v_item.raw_text;
    end if;

    if v_quantity is null then
      raise exception 'Falta la cantidad en "%"', v_item.raw_text;
    end if;

    if v_quantity < 0 or (v_type <> 'ajuste' and v_quantity = 0) then
      raise exception 'La cantidad de "%" debe ser mayor a cero', v_item.raw_text;
    end if;

    select * into v_product
    from public.products
    where id = (v_decision ->> 'product_id')::uuid and business_id = v_business_id and is_active
    for update;

    if not found then
      raise exception 'El producto de "%" ya no está en tu catálogo', v_item.raw_text;
    end if;

    v_delta := case v_type
      when 'entrada' then v_quantity
      when 'ajuste' then v_quantity - v_product.current_quantity
      else -v_quantity
    end;

    if v_delta = 0 then
      raise exception 'El conteo de % coincide con el stock actual; quita esa propuesta', v_product.name;
    end if;

    if v_product.current_quantity + v_delta < 0 then
      raise exception 'No hay suficiente %: quedan % y quieres sacar %',
        v_product.name, v_product.current_quantity, v_quantity;
    end if;

    update public.capture_items
    set
      product_id = v_product.id,
      type = v_type,
      quantity = v_quantity,
      status = case
        when v_product.id is not distinct from v_item.llm_product_id
          and v_type is not distinct from v_item.llm_type
          and v_quantity is not distinct from v_item.llm_quantity
        then 'aceptada'
        else 'editada'
      end::public.capture_item_status
    where id = v_item.id;

    insert into public.movements (business_id, product_id, type, quantity, source, performed_by, capture_item_id)
    values (
      v_business_id, v_product.id, v_type, v_delta,
      coalesce(v_item.input_type::text, 'texto')::public.movement_source,
      auth.uid(), v_item.id
    )
    returning id into v_movement_id;

    v_movements := v_movements + 1;

    -- Alias aprendido: el modelo se equivocó de producto (o no lo encontró) y la persona
    -- eligió el correcto. Si la palabra ya es alias de otro producto, no se mueve.
    if v_product.id is distinct from v_item.llm_product_id
      and length(trim(coalesce(v_item.product_mention, ''))) > 0
      and lower(trim(v_item.product_mention)) <> lower(trim(v_product.name))
    then
      insert into public.product_aliases (product_id, business_id, alias, origin)
      values (v_product.id, v_business_id, trim(v_item.product_mention), 'aprendido')
      on conflict (business_id, (lower(trim(alias)))) do nothing;
    end if;
  end loop;

  update public.captures
  set status = 'confirmada', reviewed_by = auth.uid(), reviewed_at = now()
  where id = p_capture_id;

  return v_movements;
end;
$$;

-- Descarta la captura completa sin registrar nada y libera el candado de Capturar.
create function public.discard_capture(p_capture_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_business_id uuid := public.current_business_id();
begin
  if v_business_id is null then
    raise exception 'Necesitas pertenecer a un negocio';
  end if;

  update public.captures
  set status = 'descartada', reviewed_by = auth.uid(), reviewed_at = now()
  where id = p_capture_id and business_id = v_business_id and status = 'en_revision';

  if not found then
    raise exception 'Esta captura ya no está pendiente de revisión';
  end if;

  update public.capture_items set status = 'descartada' where capture_id = p_capture_id;
end;
$$;

revoke execute on function public.create_capture(
  uuid, public.capture_status, text, text, integer, integer, integer, numeric, jsonb, text, jsonb, jsonb
) from anon, public;
grant execute on function public.create_capture(
  uuid, public.capture_status, text, text, integer, integer, integer, numeric, jsonb, text, jsonb, jsonb
) to authenticated;

revoke execute on function public.confirm_capture(uuid, jsonb) from anon, public;
grant execute on function public.confirm_capture(uuid, jsonb) to authenticated;

revoke execute on function public.discard_capture(uuid) from anon, public;
grant execute on function public.discard_capture(uuid) to authenticated;

------------------------------------------------------------
-- 4. Storage: borrar los archivos al terminar la revisión
------------------------------------------------------------

-- Los archivos de entradas aceptadas se borran al cerrar la revisión (punto 3); los de
-- entradas rechazadas se conservan para métricas (punto 9). Esa regla la aplica la app.
create policy "Miembros borran capturas de su negocio" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'captures'
    and (storage.foldername(name))[1] = public.current_business_id()::text
  );
