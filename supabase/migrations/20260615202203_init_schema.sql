-- Backlog Tracker — initial schema
-- Single shared workspace: every authenticated user reads/writes work items.
-- Config tables (statuses, labels) and team-scoped saved queries are admin-gated.
-- Every meaningful change is captured in audit_log via SECURITY DEFINER triggers.

-- ============================================================================
-- Tables
-- ============================================================================

create table public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  email       text,
  full_name   text,
  is_admin    boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table public.statuses (
  id            uuid primary key default gen_random_uuid(),
  key           text not null unique,
  label         text not null,
  color         text not null default 'gray',
  sort_order    integer not null default 0,
  is_terminal   boolean not null default false,  -- e.g. Done
  is_default    boolean not null default false,  -- status applied to new items
  is_attention  boolean not null default false,  -- e.g. At Risk / Blocked (dashboard bucket)
  created_at    timestamptz not null default now()
);

create table public.labels (
  id          uuid primary key default gen_random_uuid(),
  name        text not null unique,
  color       text not null default 'gray',
  created_at  timestamptz not null default now()
);

create table public.work_items (
  id                     uuid primary key default gen_random_uuid(),
  description            text not null,
  stack_rank             double precision not null default 0,
  pm_owner               uuid references public.profiles (id) on delete set null,
  tech_lead_owner        uuid references public.profiles (id) on delete set null,
  sdm_owner              uuid references public.profiles (id) on delete set null,
  status_id              uuid references public.statuses (id) on delete set null,
  target_date            date,
  date_type              text check (date_type in ('DFD', 'ECD')),
  latest_update          text,                  -- denormalized last comment body
  created_by             uuid references public.profiles (id) on delete set null,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now(),
  last_comment_at        timestamptz,
  last_status_change_at  timestamptz
);

create table public.work_item_labels (
  work_item_id  uuid not null references public.work_items (id) on delete cascade,
  label_id      uuid not null references public.labels (id) on delete cascade,
  primary key (work_item_id, label_id)
);

create table public.comments (
  id            uuid primary key default gen_random_uuid(),
  work_item_id  uuid not null references public.work_items (id) on delete cascade,
  author        uuid references public.profiles (id) on delete set null,
  body          text not null,
  created_at    timestamptz not null default now()
);

create table public.saved_queries (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  owner       uuid references public.profiles (id) on delete cascade,
  scope       text not null default 'personal' check (scope in ('personal', 'team')),
  definition  jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table public.audit_log (
  id            bigint generated always as identity primary key,
  item_id       uuid references public.work_items (id) on delete cascade,
  changed_by    uuid references public.profiles (id) on delete set null,
  changed_at    timestamptz not null default now(),
  field_changed text,
  old_value     text,
  new_value     text,
  change_type   text not null
    check (change_type in ('create', 'update', 'delete', 'status_change', 'comment', 'label_change'))
);

-- ============================================================================
-- Indexes (foreign keys + common sort/filter columns)
-- ============================================================================

create index idx_work_items_pm_owner        on public.work_items (pm_owner);
create index idx_work_items_tech_lead_owner on public.work_items (tech_lead_owner);
create index idx_work_items_sdm_owner        on public.work_items (sdm_owner);
create index idx_work_items_status_id        on public.work_items (status_id);
create index idx_work_items_created_by       on public.work_items (created_by);
create index idx_work_items_stack_rank       on public.work_items (stack_rank);
create index idx_work_items_target_date      on public.work_items (target_date);
create index idx_work_items_updated_at       on public.work_items (updated_at desc);

create index idx_work_item_labels_label_id   on public.work_item_labels (label_id);
create index idx_comments_work_item_id       on public.comments (work_item_id);
create index idx_comments_author             on public.comments (author);
create index idx_saved_queries_owner         on public.saved_queries (owner);
create index idx_saved_queries_scope         on public.saved_queries (scope);
create index idx_audit_log_item_id           on public.audit_log (item_id);
create index idx_audit_log_changed_by        on public.audit_log (changed_by);

-- ============================================================================
-- Functions & triggers
-- ============================================================================

-- New auth user -> profile row.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data ->> 'full_name');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Admin check used by RLS. SECURITY DEFINER so it can read profiles without
-- recursive RLS; only ever reveals the *caller's* own admin status.
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = ''
stable
as $$
  select coalesce(
    (select p.is_admin from public.profiles p where p.id = (select auth.uid())),
    false
  );
$$;

-- Generic updated_at bump.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

create trigger saved_queries_set_updated_at
  before update on public.saved_queries
  for each row execute function public.set_updated_at();

-- work_items: maintain timestamps and default created_by (BEFORE so we can write NEW).
create or replace function public.work_items_set_timestamps()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if (tg_op = 'INSERT') then
    if new.created_by is null then
      new.created_by := (select auth.uid());
    end if;
    new.created_at := now();
    new.updated_at := now();
    new.last_status_change_at := now();
  elsif (tg_op = 'UPDATE') then
    new.updated_at := now();
    if new.status_id is distinct from old.status_id then
      new.last_status_change_at := now();
    end if;
  end if;
  return new;
end;
$$;

create trigger work_items_timestamps
  before insert or update on public.work_items
  for each row execute function public.work_items_set_timestamps();

-- work_items: write a per-field audit trail. SECURITY DEFINER so it can insert
-- into audit_log even though authenticated users have no INSERT grant there.
create or replace function public.audit_work_item()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor uuid := (select auth.uid());
begin
  if (tg_op = 'INSERT') then
    insert into public.audit_log (item_id, changed_by, change_type)
    values (new.id, actor, 'create');
    return new;
  elsif (tg_op = 'DELETE') then
    insert into public.audit_log (item_id, changed_by, change_type)
    values (old.id, actor, 'delete');
    return old;
  elsif (tg_op = 'UPDATE') then
    if new.description is distinct from old.description then
      insert into public.audit_log (item_id, changed_by, field_changed, old_value, new_value, change_type)
      values (new.id, actor, 'description', old.description, new.description, 'update');
    end if;
    if new.stack_rank is distinct from old.stack_rank then
      insert into public.audit_log (item_id, changed_by, field_changed, old_value, new_value, change_type)
      values (new.id, actor, 'stack_rank', old.stack_rank::text, new.stack_rank::text, 'update');
    end if;
    if new.pm_owner is distinct from old.pm_owner then
      insert into public.audit_log (item_id, changed_by, field_changed, old_value, new_value, change_type)
      values (new.id, actor, 'pm_owner', old.pm_owner::text, new.pm_owner::text, 'update');
    end if;
    if new.tech_lead_owner is distinct from old.tech_lead_owner then
      insert into public.audit_log (item_id, changed_by, field_changed, old_value, new_value, change_type)
      values (new.id, actor, 'tech_lead_owner', old.tech_lead_owner::text, new.tech_lead_owner::text, 'update');
    end if;
    if new.sdm_owner is distinct from old.sdm_owner then
      insert into public.audit_log (item_id, changed_by, field_changed, old_value, new_value, change_type)
      values (new.id, actor, 'sdm_owner', old.sdm_owner::text, new.sdm_owner::text, 'update');
    end if;
    if new.status_id is distinct from old.status_id then
      insert into public.audit_log (item_id, changed_by, field_changed, old_value, new_value, change_type)
      values (new.id, actor, 'status_id', old.status_id::text, new.status_id::text, 'status_change');
    end if;
    if new.target_date is distinct from old.target_date then
      insert into public.audit_log (item_id, changed_by, field_changed, old_value, new_value, change_type)
      values (new.id, actor, 'target_date', old.target_date::text, new.target_date::text, 'update');
    end if;
    if new.date_type is distinct from old.date_type then
      insert into public.audit_log (item_id, changed_by, field_changed, old_value, new_value, change_type)
      values (new.id, actor, 'date_type', old.date_type, new.date_type, 'update');
    end if;
    return new;
  end if;
  return null;
end;
$$;

create trigger work_items_audit
  after insert or update or delete on public.work_items
  for each row execute function public.audit_work_item();

-- New comment -> update denormalized fields on the work item + audit row.
create or replace function public.on_new_comment()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.work_items
  set latest_update = new.body,
      last_comment_at = new.created_at
  where id = new.work_item_id;

  insert into public.audit_log (item_id, changed_by, field_changed, new_value, change_type)
  values (new.work_item_id, new.author, 'comment', new.body, 'comment');

  return new;
end;
$$;

create trigger comments_after_insert
  after insert on public.comments
  for each row execute function public.on_new_comment();

-- Label add/remove -> audit row.
create or replace function public.audit_label_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  actor uuid := (select auth.uid());
begin
  if (tg_op = 'INSERT') then
    insert into public.audit_log (item_id, changed_by, field_changed, new_value, change_type)
    values (new.work_item_id, actor, 'label',
            (select l.name from public.labels l where l.id = new.label_id), 'label_change');
    return new;
  else
    insert into public.audit_log (item_id, changed_by, field_changed, old_value, change_type)
    values (old.work_item_id, actor, 'label',
            (select l.name from public.labels l where l.id = old.label_id), 'label_change');
    return old;
  end if;
end;
$$;

create trigger work_item_labels_audit
  after insert or delete on public.work_item_labels
  for each row execute function public.audit_label_change();

-- ============================================================================
-- Grants (tables are NOT auto-exposed to the Data API; grant explicitly).
-- RLS below is the row-level gate; these grants are the table-level gate.
-- ============================================================================

grant usage on schema public to authenticated;

grant select, update                  on public.profiles         to authenticated;
grant select, insert, update, delete  on public.statuses         to authenticated;
grant select, insert, update, delete  on public.labels           to authenticated;
grant select, insert, update, delete  on public.work_items       to authenticated;
grant select, insert, update, delete  on public.work_item_labels to authenticated;
grant select, insert                  on public.comments         to authenticated;
grant select, insert, update, delete  on public.saved_queries    to authenticated;
grant select                          on public.audit_log        to authenticated;

-- ============================================================================
-- Row Level Security
-- ============================================================================

alter table public.profiles         enable row level security;
alter table public.statuses         enable row level security;
alter table public.labels           enable row level security;
alter table public.work_items       enable row level security;
alter table public.work_item_labels enable row level security;
alter table public.comments         enable row level security;
alter table public.saved_queries    enable row level security;
alter table public.audit_log        enable row level security;

-- profiles: everyone reads; you update only your own row.
create policy "profiles_select" on public.profiles
  for select to authenticated using (true);
create policy "profiles_update_own" on public.profiles
  for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- statuses: everyone reads; admins write.
create policy "statuses_select" on public.statuses
  for select to authenticated using (true);
create policy "statuses_admin_write" on public.statuses
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- labels: everyone reads; admins manage the label catalog.
create policy "labels_select" on public.labels
  for select to authenticated using (true);
create policy "labels_admin_write" on public.labels
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- work_items: shared workspace — all authenticated users have full access.
create policy "work_items_all" on public.work_items
  for all to authenticated
  using (true)
  with check (true);

-- work_item_labels: shared workspace.
create policy "work_item_labels_all" on public.work_item_labels
  for all to authenticated
  using (true)
  with check (true);

-- comments: everyone reads; you may only insert comments authored by you.
create policy "comments_select" on public.comments
  for select to authenticated using (true);
create policy "comments_insert_own" on public.comments
  for insert to authenticated
  with check (author = (select auth.uid()));

-- saved_queries: read team + own; manage own personal; admins manage team.
create policy "saved_queries_select" on public.saved_queries
  for select to authenticated
  using (scope = 'team' or owner = (select auth.uid()));
create policy "saved_queries_insert" on public.saved_queries
  for insert to authenticated
  with check (
    owner = (select auth.uid())
    and (scope = 'personal' or public.is_admin())
  );
create policy "saved_queries_update" on public.saved_queries
  for update to authenticated
  using (
    (scope = 'personal' and owner = (select auth.uid()))
    or (scope = 'team' and public.is_admin())
  )
  with check (
    (scope = 'personal' and owner = (select auth.uid()))
    or (scope = 'team' and public.is_admin())
  );
create policy "saved_queries_delete" on public.saved_queries
  for delete to authenticated
  using (
    (scope = 'personal' and owner = (select auth.uid()))
    or (scope = 'team' and public.is_admin())
  );

-- audit_log: read-only for users. Rows are written only by SECURITY DEFINER
-- triggers, so there are intentionally no insert/update/delete policies.
create policy "audit_log_select" on public.audit_log
  for select to authenticated using (true);
