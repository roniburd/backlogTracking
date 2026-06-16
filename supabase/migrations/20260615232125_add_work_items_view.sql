-- Flattened, sortable/filterable view over work_items for the table view,
-- filters, and dashboard. security_invoker = true so the caller's RLS on the
-- underlying tables (work_items, profiles, statuses, labels) still applies.

create view public.work_items_view
with (security_invoker = true) as
select
  wi.id,
  wi.description,
  wi.stack_rank,
  wi.pm_owner,
  wi.tech_lead_owner,
  wi.sdm_owner,
  wi.status_id,
  wi.target_date,
  wi.date_type,
  wi.latest_update,
  wi.created_by,
  wi.created_at,
  wi.updated_at,
  wi.last_comment_at,
  wi.last_status_change_at,
  greatest(
    coalesce(wi.last_comment_at, wi.created_at),
    coalesce(wi.last_status_change_at, wi.created_at),
    wi.created_at
  ) as last_activity_at,
  s.label        as status_label,
  s.color        as status_color,
  s.sort_order   as status_sort_order,
  s.is_attention as status_is_attention,
  s.is_terminal  as status_is_terminal,
  pm.full_name   as pm_name,
  pm.email       as pm_email,
  tl.full_name   as tech_lead_name,
  tl.email       as tech_lead_email,
  sdm.full_name  as sdm_name,
  sdm.email      as sdm_email,
  coalesce(
    (select array_agg(l.name order by l.name)
       from public.work_item_labels wil
       join public.labels l on l.id = wil.label_id
      where wil.work_item_id = wi.id),
    array[]::text[]
  ) as label_names,
  coalesce(
    (select array_agg(l.id::text order by l.name)
       from public.work_item_labels wil
       join public.labels l on l.id = wil.label_id
      where wil.work_item_id = wi.id),
    array[]::text[]
  ) as label_ids
from public.work_items wi
left join public.statuses s   on s.id   = wi.status_id
left join public.profiles pm  on pm.id  = wi.pm_owner
left join public.profiles tl  on tl.id  = wi.tech_lead_owner
left join public.profiles sdm on sdm.id = wi.sdm_owner;

grant select on public.work_items_view to authenticated;
