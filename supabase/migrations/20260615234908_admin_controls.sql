-- Admin controls + privilege-escalation fix.
--
-- Problem: the profiles UPDATE policy allows a user to update their own row,
-- which (without column restrictions) would let them set is_admin = true on
-- themselves. Lock it down so only full_name is user-updatable, and route admin
-- promotion through a SECURITY DEFINER function that verifies the caller.

-- Restrict which columns authenticated users may update on profiles.
revoke update on public.profiles from authenticated;
grant update (full_name) on public.profiles to authenticated;

-- Admin-only promotion/demotion. SECURITY DEFINER so it can write is_admin,
-- but it verifies the caller is an admin first (never a bare definer write).
create or replace function public.set_user_admin(target_user uuid, make_admin boolean)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'Only admins can change admin status';
  end if;
  update public.profiles set is_admin = make_admin where id = target_user;
end;
$$;

revoke execute on function public.set_user_admin(uuid, boolean) from public, anon;
grant execute on function public.set_user_admin(uuid, boolean) to authenticated;
