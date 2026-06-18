-- Fix FK violation when deleting a work item.
--
-- `audit_log.item_id` and `work_item_labels.work_item_id` both reference
-- `work_items (id) ON DELETE CASCADE`. Deleting a work item therefore cascades
-- its audit trail (and label rows) away. The audit triggers' DELETE branches
-- inserted audit rows keyed on the *already-deleted* work item, so the FK check
-- failed and the whole DELETE aborted (the delete button on /items/[id] threw).
--
-- Plan-consistent behavior: the ON DELETE CASCADE on audit_log.item_id means a
-- deleted item is *meant* to take its audit trail with it, so we record no
-- delete-audit row. (Retaining a delete trail would require making item_id
-- nullable + ON DELETE SET NULL and stashing the old id elsewhere — a data-model
-- change left as a deliberate follow-up, not done here.)

-- work_items: stop inserting an FK-violating 'delete' audit row.
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
    -- Item deletion cascades its audit_log rows away; a delete-audit row keyed on
    -- old.id would both violate the FK and be cascaded out. Record nothing.
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

-- work_item_labels: a real label removal (item still present) must still be
-- audited, but a removal caused by the parent item being deleted (cascade) must
-- not insert an FK-violating row. Guard the DELETE branch on the item existing.
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
    -- Skip when the parent work item is gone (cascaded delete); only audit a
    -- genuine label removal where the item still exists.
    if exists (select 1 from public.work_items wi where wi.id = old.work_item_id) then
      insert into public.audit_log (item_id, changed_by, field_changed, old_value, change_type)
      values (old.work_item_id, actor, 'label',
              (select l.name from public.labels l where l.id = old.label_id), 'label_change');
    end if;
    return old;
  end if;
end;
$$;
