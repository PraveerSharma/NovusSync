alter table app_actor enable row level security;
alter table app_actor force row level security;

create index audit_event_actor_idx on audit_event (actor_id);
create index support_grant_actor_idx on support_grant (actor_id);
create index support_grant_granted_by_actor_idx on support_grant (granted_by_actor_id);

drop policy audit_event_tenant_select on audit_event;
create policy audit_event_tenant_select on audit_event
for select to novussync_app
using (
  organization_id = (select nullif(current_setting('app.organization_id', true), '')::uuid)
  and workspace_id = (select nullif(current_setting('app.workspace_id', true), '')::uuid)
);

drop policy audit_event_tenant_insert on audit_event;
create policy audit_event_tenant_insert on audit_event
for insert to novussync_app
with check (
  organization_id = (select nullif(current_setting('app.organization_id', true), '')::uuid)
  and workspace_id = (select nullif(current_setting('app.workspace_id', true), '')::uuid)
);

drop policy idempotency_record_tenant_access on idempotency_record;
create policy idempotency_record_tenant_access on idempotency_record
for all to novussync_app
using (
  organization_id = (select nullif(current_setting('app.organization_id', true), '')::uuid)
  and workspace_id = (select nullif(current_setting('app.workspace_id', true), '')::uuid)
)
with check (
  organization_id = (select nullif(current_setting('app.organization_id', true), '')::uuid)
  and workspace_id = (select nullif(current_setting('app.workspace_id', true), '')::uuid)
);

drop policy organization_tenant_access on organization;
create policy organization_tenant_access on organization
for all to novussync_app
using (
  id = (select nullif(current_setting('app.organization_id', true), '')::uuid)
)
with check (
  id = (select nullif(current_setting('app.organization_id', true), '')::uuid)
);

drop policy outbox_message_tenant_access on outbox_message;
create policy outbox_message_tenant_access on outbox_message
for all to novussync_app
using (
  organization_id = (select nullif(current_setting('app.organization_id', true), '')::uuid)
  and workspace_id = (select nullif(current_setting('app.workspace_id', true), '')::uuid)
)
with check (
  organization_id = (select nullif(current_setting('app.organization_id', true), '')::uuid)
  and workspace_id = (select nullif(current_setting('app.workspace_id', true), '')::uuid)
);

drop policy support_grant_tenant_access on support_grant;
create policy support_grant_tenant_access on support_grant
for all to novussync_app
using (
  organization_id = (select nullif(current_setting('app.organization_id', true), '')::uuid)
  and workspace_id = (select nullif(current_setting('app.workspace_id', true), '')::uuid)
)
with check (
  organization_id = (select nullif(current_setting('app.organization_id', true), '')::uuid)
  and workspace_id = (select nullif(current_setting('app.workspace_id', true), '')::uuid)
);

drop policy webhook_inbox_tenant_access on webhook_inbox;
create policy webhook_inbox_tenant_access on webhook_inbox
for all to novussync_app
using (
  organization_id = (select nullif(current_setting('app.organization_id', true), '')::uuid)
  and workspace_id = (select nullif(current_setting('app.workspace_id', true), '')::uuid)
)
with check (
  organization_id = (select nullif(current_setting('app.organization_id', true), '')::uuid)
  and workspace_id = (select nullif(current_setting('app.workspace_id', true), '')::uuid)
);

drop policy workspace_membership_tenant_access on workspace_membership;
create policy workspace_membership_tenant_access on workspace_membership
for all to novussync_app
using (
  organization_id = (select nullif(current_setting('app.organization_id', true), '')::uuid)
  and workspace_id = (select nullif(current_setting('app.workspace_id', true), '')::uuid)
)
with check (
  organization_id = (select nullif(current_setting('app.organization_id', true), '')::uuid)
  and workspace_id = (select nullif(current_setting('app.workspace_id', true), '')::uuid)
);

drop policy workspace_tenant_access on workspace;
create policy workspace_tenant_access on workspace
for all to novussync_app
using (
  organization_id = (select nullif(current_setting('app.organization_id', true), '')::uuid)
  and id = (select nullif(current_setting('app.workspace_id', true), '')::uuid)
)
with check (
  organization_id = (select nullif(current_setting('app.organization_id', true), '')::uuid)
  and id = (select nullif(current_setting('app.workspace_id', true), '')::uuid)
);
