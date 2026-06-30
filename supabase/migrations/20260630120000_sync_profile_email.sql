-- Keep profiles.email in sync with auth.users.email.
--
-- profiles.email is a denormalized copy populated by handle_new_user() at signup,
-- but nothing kept it current afterward. Now that users can change their email
-- from the profile page (via Supabase Auth), that copy would drift and the items
-- list / owner columns would show a stale address. Mirror confirmed email changes
-- from auth.users back onto the matching profile row.
--
-- Expand-only / backward-compatible: this only adds a trigger that maintains an
-- existing column, so the currently-deployed code keeps working unchanged.
-- SECURITY DEFINER so it can write profiles regardless of the caller; it only
-- ever touches the row whose id matches the changed auth user.

create or replace function public.sync_profile_email()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.profiles
  set email = new.email
  where id = new.id;
  return new;
end;
$$;

create trigger on_auth_user_email_changed
  after update of email on auth.users
  for each row
  when (new.email is distinct from old.email)
  execute function public.sync_profile_email();
