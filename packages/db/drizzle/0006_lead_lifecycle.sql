CREATE TABLE "lead_lifecycle_transition" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"workspace_id" uuid NOT NULL,
	"lead_id" uuid NOT NULL,
	"version" integer NOT NULL,
	"previous_stage" text,
	"next_stage" text NOT NULL,
	"reason_code" text,
	"actor_type" text NOT NULL,
	"actor_id" uuid,
	"correlation_id" uuid NOT NULL,
	"occurred_at" timestamp with time zone NOT NULL,
	"recorded_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "lead_lifecycle_transition_version_positive" CHECK ("lead_lifecycle_transition"."version" > 0),
	CONSTRAINT "lead_lifecycle_transition_previous_stage_allowed" CHECK ("lead_lifecycle_transition"."previous_stage" is null or "lead_lifecycle_transition"."previous_stage" in (
        'new', 'contacted', 'qualified', 'booking_proposed', 'booked',
        'booking_confirmed', 'outcome_verified', 'outcome_missed',
        'conversion_follow_up', 'converted', 'closed_not_converted'
      )),
	CONSTRAINT "lead_lifecycle_transition_next_stage_allowed" CHECK ("lead_lifecycle_transition"."next_stage" in (
        'new', 'contacted', 'qualified', 'booking_proposed', 'booked',
        'booking_confirmed', 'outcome_verified', 'outcome_missed',
        'conversion_follow_up', 'converted', 'closed_not_converted'
      )),
	CONSTRAINT "lead_lifecycle_transition_initial_shape" CHECK (("lead_lifecycle_transition"."version" = 1 and "lead_lifecycle_transition"."previous_stage" is null and "lead_lifecycle_transition"."next_stage" = 'new')
        or ("lead_lifecycle_transition"."version" > 1 and "lead_lifecycle_transition"."previous_stage" is not null)),
	CONSTRAINT "lead_lifecycle_transition_actor_shape" CHECK (("lead_lifecycle_transition"."actor_type" = 'human' and "lead_lifecycle_transition"."actor_id" is not null)
        or "lead_lifecycle_transition"."actor_type" = 'system'),
	CONSTRAINT "lead_lifecycle_transition_reason_code_format" CHECK ("lead_lifecycle_transition"."reason_code" is null or "lead_lifecycle_transition"."reason_code" ~ '^[A-Z][A-Z0-9_]{0,63}$')
);
--> statement-breakpoint
ALTER TABLE "lead_lifecycle_transition" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "lead_lifecycle" (
	"organization_id" uuid NOT NULL,
	"workspace_id" uuid NOT NULL,
	"lead_id" uuid NOT NULL,
	"stage" text NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"opened_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	CONSTRAINT "lead_lifecycle_primary" PRIMARY KEY("organization_id","workspace_id","lead_id"),
	CONSTRAINT "lead_lifecycle_stage_allowed" CHECK ("lead_lifecycle"."stage" in (
        'new', 'contacted', 'qualified', 'booking_proposed', 'booked',
        'booking_confirmed', 'outcome_verified', 'outcome_missed',
        'conversion_follow_up', 'converted', 'closed_not_converted'
      )),
	CONSTRAINT "lead_lifecycle_version_positive" CHECK ("lead_lifecycle"."version" > 0),
	CONSTRAINT "lead_lifecycle_time_order" CHECK ("lead_lifecycle"."updated_at" >= "lead_lifecycle"."opened_at")
);
--> statement-breakpoint
ALTER TABLE "lead_lifecycle" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "lead_lifecycle_transition" ADD CONSTRAINT "lead_lifecycle_transition_actor_id_app_actor_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."app_actor"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lead_lifecycle_transition" ADD CONSTRAINT "lead_lifecycle_transition_lifecycle_fk" FOREIGN KEY ("organization_id","workspace_id","lead_id") REFERENCES "public"."lead_lifecycle"("organization_id","workspace_id","lead_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lead_lifecycle" ADD CONSTRAINT "lead_lifecycle_workspace_fk" FOREIGN KEY ("organization_id","workspace_id") REFERENCES "public"."workspace"("organization_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "lead_lifecycle_transition_version_unique" ON "lead_lifecycle_transition" USING btree ("organization_id","workspace_id","lead_id","version");--> statement-breakpoint
CREATE INDEX "lead_lifecycle_transition_time_idx" ON "lead_lifecycle_transition" USING btree ("organization_id","workspace_id","lead_id","occurred_at","id");--> statement-breakpoint
CREATE INDEX "lead_lifecycle_transition_actor_idx" ON "lead_lifecycle_transition" USING btree ("actor_id");--> statement-breakpoint
CREATE INDEX "lead_lifecycle_stage_idx" ON "lead_lifecycle" USING btree ("organization_id","workspace_id","stage","updated_at");--> statement-breakpoint
CREATE POLICY "lead_lifecycle_transition_tenant_select" ON "lead_lifecycle_transition" AS PERMISSIVE FOR SELECT TO "novussync_app" USING (
  "lead_lifecycle_transition"."organization_id" = nullif((select current_setting('app.organization_id', true)), '')::uuid
  and "lead_lifecycle_transition"."workspace_id" = nullif((select current_setting('app.workspace_id', true)), '')::uuid
);--> statement-breakpoint
CREATE POLICY "lead_lifecycle_transition_tenant_insert" ON "lead_lifecycle_transition" AS PERMISSIVE FOR INSERT TO "novussync_app" WITH CHECK (
  "lead_lifecycle_transition"."organization_id" = nullif((select current_setting('app.organization_id', true)), '')::uuid
  and "lead_lifecycle_transition"."workspace_id" = nullif((select current_setting('app.workspace_id', true)), '')::uuid
);--> statement-breakpoint
CREATE POLICY "lead_lifecycle_tenant_access" ON "lead_lifecycle" AS PERMISSIVE FOR ALL TO "novussync_app" USING (
  "lead_lifecycle"."organization_id" = nullif((select current_setting('app.organization_id', true)), '')::uuid
  and "lead_lifecycle"."workspace_id" = nullif((select current_setting('app.workspace_id', true)), '')::uuid
) WITH CHECK (
  "lead_lifecycle"."organization_id" = nullif((select current_setting('app.organization_id', true)), '')::uuid
  and "lead_lifecycle"."workspace_id" = nullif((select current_setting('app.workspace_id', true)), '')::uuid
);--> statement-breakpoint
grant select, insert, update on lead_lifecycle to novussync_app;
--> statement-breakpoint
grant select, insert on lead_lifecycle_transition to novussync_app;
--> statement-breakpoint
revoke delete, truncate on lead_lifecycle from novussync_app;
--> statement-breakpoint
revoke update, delete, truncate on lead_lifecycle_transition from novussync_app;
--> statement-breakpoint
alter table lead_lifecycle force row level security;
--> statement-breakpoint
alter table lead_lifecycle_transition force row level security;
--> statement-breakpoint
create or replace function app_private.validate_lead_lifecycle_update()
returns trigger
language plpgsql
security invoker
set search_path = pg_catalog, public
as $$
begin
  if new.organization_id is distinct from old.organization_id
     or new.workspace_id is distinct from old.workspace_id
     or new.lead_id is distinct from old.lead_id
     or new.opened_at is distinct from old.opened_at then
    raise exception using
      errcode = '55000',
      message = 'lead lifecycle identity and opening time are immutable';
  end if;

  if new.version <> old.version + 1 then
    raise exception using
      errcode = '40001',
      message = 'lead lifecycle version must increase exactly once';
  end if;

  if new.stage = old.stage then
    raise exception using
      errcode = '55000',
      message = 'lead lifecycle updates must change stage';
  end if;

  if new.updated_at < old.updated_at then
    raise exception using
      errcode = '22007',
      message = 'lead lifecycle update time cannot move backwards';
  end if;

  return new;
end;
$$;
--> statement-breakpoint
revoke all on function app_private.validate_lead_lifecycle_update() from public;
--> statement-breakpoint
create trigger lead_lifecycle_validate_update
before update on lead_lifecycle
for each row execute function app_private.validate_lead_lifecycle_update();
--> statement-breakpoint
create or replace function app_private.reject_lead_lifecycle_transition_mutation()
returns trigger
language plpgsql
security invoker
set search_path = pg_catalog, public
as $$
begin
  raise exception using
    errcode = '55000',
    message = 'lead lifecycle transition history is append-only';
end;
$$;
--> statement-breakpoint
revoke all on function app_private.reject_lead_lifecycle_transition_mutation() from public;
--> statement-breakpoint
create trigger lead_lifecycle_transition_reject_update_or_delete
before update or delete on lead_lifecycle_transition
for each row execute function app_private.reject_lead_lifecycle_transition_mutation();
