#!/usr/bin/env bash
# Insert sample work items for local development (run after seed-users.sh).
# Owners/statuses/labels are resolved by email/key/name. Safe to re-run (clears
# previously seeded demo items by their [demo] marker first).
set -euo pipefail

DB_CONTAINER="${SUPABASE_DB_CONTAINER:-supabase_db_backlogTracking}"
psql() { docker exec -i "$DB_CONTAINER" psql -U postgres -d postgres "$@"; }

psql <<'SQL'
delete from public.work_items where description like '[demo]%';

with ids as (
  select
    (select id from public.profiles where email='admin@demo.local') as admin_id,
    (select id from public.profiles where email='dev@demo.local')   as dev_id
)
insert into public.work_items
  (description, stack_rank, status_id, pm_owner, tech_lead_owner, sdm_owner, target_date, date_type, created_by)
select * from (
  select '[demo] Ship login + RLS hardening' as description, 1.0 as stack_rank,
         (select id from public.statuses where key='on_track'),
         (select admin_id from ids), (select dev_id from ids), (select admin_id from ids),
         (current_date + 14), 'ECD', (select dev_id from ids)
  union all
  select '[demo] Audit log timeline UI', 2.0,
         (select id from public.statuses where key='at_risk'),
         (select dev_id from ids), (select dev_id from ids), null,
         (current_date + 7), 'DFD', (select dev_id from ids)
  union all
  select '[demo] Saved queries: team scope', 3.0,
         (select id from public.statuses where key='blocked'),
         (select admin_id from ids), null, (select admin_id from ids),
         (current_date + 30), 'ECD', (select admin_id from ids)
  union all
  select '[demo] Dashboard buckets', 4.0,
         (select id from public.statuses where key='not_started'),
         (select dev_id from ids), (select admin_id from ids), (select dev_id from ids),
         null, null, (select dev_id from ids)
  union all
  select '[demo] Migrate to production Supabase', 5.0,
         (select id from public.statuses where key='done'),
         (select admin_id from ids), (select dev_id from ids), (select admin_id from ids),
         (current_date - 3), 'ECD', (select admin_id from ids)
) rows;

-- Attach a couple of labels to the first demo item.
insert into public.work_item_labels (work_item_id, label_id)
select wi.id, l.id
from public.work_items wi, public.labels l
where wi.description = '[demo] Ship login + RLS hardening'
  and l.name in ('backend','feature')
on conflict do nothing;

select count(*) || ' demo work items' as seeded from public.work_items where description like '[demo]%';
SQL
