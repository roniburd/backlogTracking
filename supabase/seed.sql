-- Seed data loaded after migrations on `supabase db reset`.

insert into public.statuses (key, label, color, sort_order, is_terminal, is_default, is_attention)
values
  ('not_started',     'Not Started',          'gray',   1, false, true,  false),
  ('on_track',        'On Track',             'green',  2, false, false, false),
  ('on_track_issues', 'On Track with Issues', 'amber',  3, false, false, false),
  ('at_risk',         'At Risk',              'orange', 4, false, false, true),
  ('blocked',         'Blocked',              'red',    5, false, false, true),
  ('done',            'Done',                 'blue',   6, true,  false, false)
on conflict (key) do nothing;

insert into public.labels (name, color)
values
  ('frontend', 'blue'),
  ('backend',  'green'),
  ('infra',    'purple'),
  ('bug',      'red'),
  ('feature',  'teal')
on conflict (name) do nothing;
