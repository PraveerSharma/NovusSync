CREATE TABLE "verified_context_snapshot" (
	"organization_id" uuid NOT NULL,
	"workspace_id" uuid NOT NULL,
	"snapshot_id" text NOT NULL,
	"schema_version" integer NOT NULL,
	"profile_id" text NOT NULL,
	"use_case" text NOT NULL,
	"as_of" timestamp with time zone NOT NULL,
	"items" jsonb NOT NULL,
	"created_by_actor_id" uuid NOT NULL,
	"request_id" text NOT NULL,
	"recorded_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "verified_context_snapshot_primary" PRIMARY KEY("organization_id","workspace_id","snapshot_id"),
	CONSTRAINT "verified_context_snapshot_id_format" CHECK ("verified_context_snapshot"."snapshot_id" ~ '^verified-context:sha256:[a-f0-9]{64}$'),
	CONSTRAINT "verified_context_snapshot_schema_version" CHECK ("verified_context_snapshot"."schema_version" = 1),
	CONSTRAINT "verified_context_snapshot_use_case_allowed" CHECK ("verified_context_snapshot"."use_case" in ('campaign_planning', 'concierge_response')),
	CONSTRAINT "verified_context_snapshot_items_array" CHECK (jsonb_typeof("verified_context_snapshot"."items") = 'array'),
	CONSTRAINT "verified_context_snapshot_request_present" CHECK (length("verified_context_snapshot"."request_id") > 0)
);
--> statement-breakpoint
ALTER TABLE "verified_context_snapshot" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "approved_fact_version" ADD COLUMN "governance_status" text DEFAULT 'available' NOT NULL;--> statement-breakpoint
ALTER TABLE "approved_fact_version" ADD COLUMN "allowed_use_cases" jsonb DEFAULT '["campaign_planning", "concierge_response"]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "approved_fact_version" ADD COLUMN "expires_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "approved_fact_version" ADD COLUMN "governance_reason_code" text;--> statement-breakpoint
ALTER TABLE "verified_context_snapshot" ADD CONSTRAINT "verified_context_snapshot_created_by_actor_id_app_actor_id_fk" FOREIGN KEY ("created_by_actor_id") REFERENCES "public"."app_actor"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "verified_context_snapshot" ADD CONSTRAINT "verified_context_snapshot_workspace_fk" FOREIGN KEY ("organization_id","workspace_id") REFERENCES "public"."workspace"("organization_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "verified_context_snapshot_profile_time_idx" ON "verified_context_snapshot" USING btree ("organization_id","workspace_id","profile_id","as_of");--> statement-breakpoint
ALTER TABLE "approved_fact_version" ADD CONSTRAINT "approved_fact_version_governance_status_allowed" CHECK ("approved_fact_version"."governance_status" in ('available', 'restricted', 'disputed'));--> statement-breakpoint
ALTER TABLE "approved_fact_version" ADD CONSTRAINT "approved_fact_version_allowed_use_cases" CHECK (jsonb_typeof("approved_fact_version"."allowed_use_cases") = 'array'
        and jsonb_array_length("approved_fact_version"."allowed_use_cases") > 0
        and "approved_fact_version"."allowed_use_cases" <@ '["campaign_planning", "concierge_response"]'::jsonb);--> statement-breakpoint
ALTER TABLE "approved_fact_version" ADD CONSTRAINT "approved_fact_version_governance_reason_shape" CHECK (("approved_fact_version"."governance_status" = 'available' and "approved_fact_version"."governance_reason_code" is null)
        or ("approved_fact_version"."governance_status" in ('restricted', 'disputed')
          and "approved_fact_version"."governance_reason_code" ~ '^[A-Z][A-Z0-9_-]{0,63}$'));--> statement-breakpoint
ALTER TABLE "approved_fact_version" ADD CONSTRAINT "approved_fact_version_expiry_after_verification" CHECK ("approved_fact_version"."expires_at" is null or "approved_fact_version"."expires_at" > "approved_fact_version"."verified_at");--> statement-breakpoint
CREATE POLICY "verified_context_snapshot_tenant_select" ON "verified_context_snapshot" AS PERMISSIVE FOR SELECT TO "novussync_app" USING (
  "verified_context_snapshot"."organization_id" = nullif((select current_setting('app.organization_id', true)), '')::uuid
  and "verified_context_snapshot"."workspace_id" = nullif((select current_setting('app.workspace_id', true)), '')::uuid
);--> statement-breakpoint
CREATE POLICY "verified_context_snapshot_tenant_insert" ON "verified_context_snapshot" AS PERMISSIVE FOR INSERT TO "novussync_app" WITH CHECK (
  "verified_context_snapshot"."organization_id" = nullif((select current_setting('app.organization_id', true)), '')::uuid
  and "verified_context_snapshot"."workspace_id" = nullif((select current_setting('app.workspace_id', true)), '')::uuid
);--> statement-breakpoint
ALTER TABLE "verified_context_snapshot" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
GRANT SELECT, INSERT ON TABLE "verified_context_snapshot" TO "novussync_app";
--> statement-breakpoint
REVOKE UPDATE, DELETE, TRUNCATE ON TABLE "verified_context_snapshot" FROM "novussync_app";
--> statement-breakpoint
CREATE OR REPLACE FUNCTION app_private.reject_verified_context_snapshot_mutation()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION USING
    ERRCODE = '55000',
    MESSAGE = 'verified context snapshots are immutable';
END;
$$;
--> statement-breakpoint
REVOKE ALL ON FUNCTION app_private.reject_verified_context_snapshot_mutation() FROM PUBLIC;
--> statement-breakpoint
CREATE TRIGGER verified_context_snapshot_append_only
BEFORE UPDATE OR DELETE ON "verified_context_snapshot"
FOR EACH ROW
EXECUTE FUNCTION app_private.reject_verified_context_snapshot_mutation();
