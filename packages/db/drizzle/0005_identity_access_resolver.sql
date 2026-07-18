create or replace function app_private.resolve_workspace_access(
  p_identity_provider text,
  p_provider_subject text,
  p_organization_id uuid,
  p_workspace_id uuid,
  p_assurance_level text
)
returns table (
  actor_id uuid,
  actor_type text,
  role text,
  access_kind text,
  support_grant_id uuid
)
language sql
stable
security definer
set search_path = pg_catalog, public
as $function$
  select
    actor.id,
    actor.actor_type,
    membership.role,
    case
      when membership.role = 'internal_operator' then 'support_grant'
      else 'membership'
    end,
    active_grant.id
  from public.app_actor as actor
  join public.workspace as workspace
    on workspace.organization_id = p_organization_id
   and workspace.id = p_workspace_id
   and workspace.status = 'active'
  join public.workspace_membership as membership
    on membership.organization_id = workspace.organization_id
   and membership.workspace_id = workspace.id
   and membership.actor_id = actor.id
   and membership.status = 'active'
  left join lateral (
    select grant_record.id
    from public.support_grant as grant_record
    where grant_record.organization_id = workspace.organization_id
      and grant_record.workspace_id = workspace.id
      and grant_record.actor_id = actor.id
      and grant_record.starts_at <= statement_timestamp()
      and grant_record.expires_at > statement_timestamp()
      and grant_record.revoked_at is null
    order by grant_record.expires_at, grant_record.id
    limit 1
  ) as active_grant on membership.role = 'internal_operator'
  where actor.identity_provider = p_identity_provider
    and actor.provider_subject = p_provider_subject
    and actor.actor_type = 'human'
    and actor.status = 'active'
    and (
      membership.role in ('owner', 'staff')
      or (
        membership.role = 'internal_operator'
        and p_assurance_level = 'aal2'
        and active_grant.id is not null
      )
    )
$function$;
--> statement-breakpoint
revoke all on function app_private.resolve_workspace_access(text, text, uuid, uuid, text) from public;
--> statement-breakpoint
grant usage on schema app_private to novussync_app;
--> statement-breakpoint
grant execute on function app_private.resolve_workspace_access(text, text, uuid, uuid, text) to novussync_app;
