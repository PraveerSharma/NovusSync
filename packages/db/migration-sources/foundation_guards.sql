alter role novussync_app nobypassrls;

grant usage on schema public to novussync_app;
grant select, insert, update on organization to novussync_app;
grant select, insert, update on workspace to novussync_app;
grant select, insert, update, delete on workspace_membership to novussync_app;
grant select, insert, update, delete on support_grant to novussync_app;
grant select, insert on audit_event to novussync_app;
grant select, insert, update, delete on idempotency_record to novussync_app;
grant select, insert, update, delete on webhook_inbox to novussync_app;
grant select, insert, update, delete on outbox_message to novussync_app;

revoke truncate on organization, workspace, workspace_membership, support_grant,
  audit_event, idempotency_record, webhook_inbox, outbox_message from novussync_app;

alter table organization force row level security;
alter table workspace force row level security;
alter table workspace_membership force row level security;
alter table support_grant force row level security;
alter table audit_event force row level security;
alter table idempotency_record force row level security;
alter table webhook_inbox force row level security;
alter table outbox_message force row level security;

create schema if not exists app_private;
revoke all on schema app_private from public;

create or replace function app_private.reject_audit_event_mutation()
returns trigger
language plpgsql
security invoker
set search_path = pg_catalog, public
as $$
begin
  raise exception using
    errcode = '55000',
    message = 'audit_event is append-only; append a correction event instead';
end;
$$;

revoke all on function app_private.reject_audit_event_mutation() from public;

create trigger audit_event_reject_update_or_delete
before update or delete on audit_event
for each row execute function app_private.reject_audit_event_mutation();
