-- Miembros del negocio: listarlos, cambiar su rol y quitarlos (solo el administrador).
-- Son security definer porque leen auth.users y cambian columnas de profiles que el
-- usuario no puede editar directo; cada función valida negocio y rol.

-- Lista de miembros con su correo y si ya entró alguna vez (si no, la invitación sigue pendiente).
create function public.business_members()
returns table (
  id uuid,
  full_name text,
  email text,
  role public.user_role,
  joined_at timestamptz,
  last_sign_in_at timestamptz,
  is_current_user boolean
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.is_business_admin() then
    raise exception 'Solo el administrador puede ver los miembros' using errcode = '42501';
  end if;

  return query
  select p.id, p.full_name, u.email::text, p.role, p.created_at, u.last_sign_in_at, p.id = auth.uid()
  from public.profiles p
  join auth.users u on u.id = p.id
  where p.business_id = public.current_business_id()
  order by p.created_at;
end;
$$;

create function public.set_member_role(p_member_id uuid, p_role public.user_role)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_business_admin() then
    raise exception 'Solo el administrador puede cambiar roles' using errcode = '42501';
  end if;

  -- Así el negocio nunca se queda sin administrador.
  if p_member_id = auth.uid() then
    raise exception 'No puedes cambiar tu propio rol';
  end if;

  update public.profiles
  set role = p_role
  where id = p_member_id and business_id = public.current_business_id();

  if not found then
    raise exception 'Esa persona no es miembro de tu negocio';
  end if;
end;
$$;

-- Saca a alguien del negocio. Su cuenta sigue existiendo; si vuelve a entrar,
-- pasa por el onboarding como cualquier usuario sin negocio.
create function public.remove_member(p_member_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_business_admin() then
    raise exception 'Solo el administrador puede quitar miembros' using errcode = '42501';
  end if;

  if p_member_id = auth.uid() then
    raise exception 'No puedes quitarte a ti mismo del negocio';
  end if;

  update public.profiles
  set business_id = null, role = 'admin'
  where id = p_member_id and business_id = public.current_business_id();

  if not found then
    raise exception 'Esa persona no es miembro de tu negocio';
  end if;
end;
$$;

revoke execute on function public.business_members() from anon, public;
revoke execute on function public.set_member_role(uuid, public.user_role) from anon, public;
revoke execute on function public.remove_member(uuid) from anon, public;
grant execute on function public.business_members() to authenticated;
grant execute on function public.set_member_role(uuid, public.user_role) to authenticated;
grant execute on function public.remove_member(uuid) to authenticated;
