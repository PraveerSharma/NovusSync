create or replace function app_private.list_workspace_directory(
  p_identity_provider text,
  p_provider_subject text,
  p_assurance_level text
)
returns table (
  organization_id uuid,
  organization_name text,
  workspace_id uuid,
  workspace_name text,
  membership_role text,
  profile_id text,
  profile_display_name text,
  playbook_id text,
  playbook_version integer,
  draft_version integer,
  profile_updated_at timestamptz,
  approved_fact_count bigint,
  last_verified_at timestamptz
)
language sql
stable
security definer
set search_path = pg_catalog, public
as $function$
  select
    organization.id,
    organization.name,
    workspace.id,
    workspace.name,
    membership.role::text,
    profile.profile_id,
    case
      when profile.profile_id is null then null
      else coalesce(
        nullif(btrim(profile.values ->> 'businessName'), ''),
        nullif(btrim(profile.values ->> 'business.name'), ''),
        nullif(btrim(profile.values #>> '{business,name}'), ''),
        'Untitled business profile'
      )
    end,
    profile.playbook_id,
    profile.playbook_version,
    profile.version,
    profile.updated_at,
    coalesce(facts.approved_fact_count, 0),
    facts.last_verified_at
  from app_actor actor
  join workspace_membership membership
    on membership.actor_id = actor.id
   and membership.status = 'active'
   and membership.revoked_at is null
   and membership.role in ('owner', 'staff')
  join workspace
    on workspace.id = membership.workspace_id
   and workspace.organization_id = membership.organization_id
   and workspace.status = 'active'
  join organization
    on organization.id = workspace.organization_id
  left join business_profile_draft profile
    on profile.organization_id = workspace.organization_id
   and profile.workspace_id = workspace.id
  left join lateral (
    select
      count(distinct fact.field_key)::bigint as approved_fact_count,
      max(fact.verified_at) as last_verified_at
    from approved_fact_version fact
    where fact.organization_id = profile.organization_id
      and fact.workspace_id = profile.workspace_id
      and fact.profile_id = profile.profile_id
      and fact.governance_status = 'approved'
      and (fact.expires_at is null or fact.expires_at > statement_timestamp())
  ) facts on profile.profile_id is not null
  where actor.identity_provider = p_identity_provider
    and actor.provider_subject = p_provider_subject
    and actor.status = 'active'
    and p_identity_provider = 'supabase'
    and p_assurance_level in ('aal1', 'aal2')
  order by
    lower(organization.name),
    organization.id,
    lower(workspace.name),
    workspace.id,
    lower(coalesce(profile.profile_id, '')),
    profile.profile_id;
$function$;

revoke all on function app_private.list_workspace_directory(text, text, text) from public;
grant usage on schema app_private to novussync_app;
grant execute on function app_private.list_workspace_directory(text, text, text) to novussync_app;
