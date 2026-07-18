insert into organization (id, slug, name)
values
  ('00000000-0000-4000-8000-000000000001', 'synthetic-alpha', 'Synthetic Alpha Organization'),
  ('00000000-0000-4000-8000-000000000002', 'synthetic-beta', 'Synthetic Beta Organization')
on conflict (id) do nothing;

insert into workspace (id, organization_id, slug, name)
values
  ('00000000-0000-4000-8000-000000000101', '00000000-0000-4000-8000-000000000001', 'alpha-workspace', 'Synthetic Alpha Workspace'),
  ('00000000-0000-4000-8000-000000000102', '00000000-0000-4000-8000-000000000002', 'beta-workspace', 'Synthetic Beta Workspace')
on conflict (id) do nothing;

insert into app_actor (id, actor_type, identity_provider, provider_subject)
values
  ('00000000-0000-4000-8000-000000000201', 'human', 'synthetic', 'synthetic-alpha-owner'),
  ('00000000-0000-4000-8000-000000000202', 'human', 'synthetic', 'synthetic-beta-owner')
on conflict (id) do nothing;

insert into workspace_membership (organization_id, workspace_id, actor_id, role)
values
  ('00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000101', '00000000-0000-4000-8000-000000000201', 'owner'),
  ('00000000-0000-4000-8000-000000000002', '00000000-0000-4000-8000-000000000102', '00000000-0000-4000-8000-000000000202', 'owner')
on conflict (organization_id, workspace_id, actor_id) do nothing;
