CREATE TABLE "business_profile_draft_version" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"workspace_id" uuid NOT NULL,
	"profile_id" text NOT NULL,
	"playbook_id" text NOT NULL,
	"playbook_version" integer NOT NULL,
	"values" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"version" integer NOT NULL,
	"idempotency_key" text NOT NULL,
	"profile_created_at" timestamp with time zone NOT NULL,
	"occurred_at" timestamp with time zone NOT NULL,
	"recorded_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "business_profile_draft_version_positive" CHECK ("business_profile_draft_version"."version" > 0),
	CONSTRAINT "business_profile_draft_version_playbook_positive" CHECK ("business_profile_draft_version"."playbook_version" > 0),
	CONSTRAINT "business_profile_draft_version_values_object" CHECK (jsonb_typeof("business_profile_draft_version"."values") = 'object'),
	CONSTRAINT "business_profile_draft_version_time_order" CHECK ("business_profile_draft_version"."occurred_at" >= "business_profile_draft_version"."profile_created_at")
);
--> statement-breakpoint
ALTER TABLE "business_profile_draft_version" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "business_profile_draft" (
	"organization_id" uuid NOT NULL,
	"workspace_id" uuid NOT NULL,
	"profile_id" text NOT NULL,
	"playbook_id" text NOT NULL,
	"playbook_version" integer NOT NULL,
	"values" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"version" integer NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	CONSTRAINT "business_profile_draft_profile_id_present" CHECK (length("business_profile_draft"."profile_id") > 0),
	CONSTRAINT "business_profile_draft_playbook_id_present" CHECK (length("business_profile_draft"."playbook_id") > 0),
	CONSTRAINT "business_profile_draft_playbook_version_positive" CHECK ("business_profile_draft"."playbook_version" > 0),
	CONSTRAINT "business_profile_draft_version_positive" CHECK ("business_profile_draft"."version" > 0),
	CONSTRAINT "business_profile_draft_values_object" CHECK (jsonb_typeof("business_profile_draft"."values") = 'object'),
	CONSTRAINT "business_profile_draft_time_order" CHECK ("business_profile_draft"."updated_at" >= "business_profile_draft"."created_at")
);
--> statement-breakpoint
ALTER TABLE "business_profile_draft" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE UNIQUE INDEX "business_profile_draft_identity_unique" ON "business_profile_draft" USING btree ("organization_id","workspace_id","profile_id");--> statement-breakpoint
ALTER TABLE "business_profile_draft_version" ADD CONSTRAINT "business_profile_draft_version_profile_fk" FOREIGN KEY ("organization_id","workspace_id","profile_id") REFERENCES "public"."business_profile_draft"("organization_id","workspace_id","profile_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "business_profile_draft" ADD CONSTRAINT "business_profile_draft_workspace_fk" FOREIGN KEY ("organization_id","workspace_id") REFERENCES "public"."workspace"("organization_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "business_profile_draft_version_unique" ON "business_profile_draft_version" USING btree ("organization_id","workspace_id","profile_id","version");--> statement-breakpoint
CREATE INDEX "business_profile_draft_version_time_idx" ON "business_profile_draft_version" USING btree ("organization_id","workspace_id","profile_id","recorded_at");--> statement-breakpoint
CREATE INDEX "business_profile_draft_updated_idx" ON "business_profile_draft" USING btree ("organization_id","workspace_id","updated_at");--> statement-breakpoint
CREATE POLICY "business_profile_draft_version_tenant_select" ON "business_profile_draft_version" AS PERMISSIVE FOR SELECT TO "novussync_app" USING (
  "business_profile_draft_version"."organization_id" = nullif((select current_setting('app.organization_id', true)), '')::uuid
  and "business_profile_draft_version"."workspace_id" = nullif((select current_setting('app.workspace_id', true)), '')::uuid
);--> statement-breakpoint
CREATE POLICY "business_profile_draft_version_tenant_insert" ON "business_profile_draft_version" AS PERMISSIVE FOR INSERT TO "novussync_app" WITH CHECK (
  "business_profile_draft_version"."organization_id" = nullif((select current_setting('app.organization_id', true)), '')::uuid
  and "business_profile_draft_version"."workspace_id" = nullif((select current_setting('app.workspace_id', true)), '')::uuid
);--> statement-breakpoint
CREATE POLICY "business_profile_draft_tenant_select" ON "business_profile_draft" AS PERMISSIVE FOR SELECT TO "novussync_app" USING (
  "business_profile_draft"."organization_id" = nullif((select current_setting('app.organization_id', true)), '')::uuid
  and "business_profile_draft"."workspace_id" = nullif((select current_setting('app.workspace_id', true)), '')::uuid
);--> statement-breakpoint
CREATE POLICY "business_profile_draft_tenant_insert" ON "business_profile_draft" AS PERMISSIVE FOR INSERT TO "novussync_app" WITH CHECK (
  "business_profile_draft"."organization_id" = nullif((select current_setting('app.organization_id', true)), '')::uuid
  and "business_profile_draft"."workspace_id" = nullif((select current_setting('app.workspace_id', true)), '')::uuid
);--> statement-breakpoint
CREATE POLICY "business_profile_draft_tenant_update" ON "business_profile_draft" AS PERMISSIVE FOR UPDATE TO "novussync_app" USING (
  "business_profile_draft"."organization_id" = nullif((select current_setting('app.organization_id', true)), '')::uuid
  and "business_profile_draft"."workspace_id" = nullif((select current_setting('app.workspace_id', true)), '')::uuid
) WITH CHECK (
  "business_profile_draft"."organization_id" = nullif((select current_setting('app.organization_id', true)), '')::uuid
  and "business_profile_draft"."workspace_id" = nullif((select current_setting('app.workspace_id', true)), '')::uuid
);
--> statement-breakpoint
ALTER TABLE "business_profile_draft" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE "business_profile_draft_version" FORCE ROW LEVEL SECURITY;
--> statement-breakpoint
GRANT SELECT, INSERT, UPDATE ON "business_profile_draft" TO "novussync_app";
--> statement-breakpoint
GRANT SELECT, INSERT ON "business_profile_draft_version" TO "novussync_app";
--> statement-breakpoint
REVOKE DELETE, TRUNCATE ON "business_profile_draft" FROM "novussync_app";
--> statement-breakpoint
REVOKE UPDATE, DELETE, TRUNCATE ON "business_profile_draft_version" FROM "novussync_app";
--> statement-breakpoint
CREATE OR REPLACE FUNCTION app_private.reject_business_profile_draft_version_mutation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = pg_catalog, public
AS $$
BEGIN
  RAISE EXCEPTION USING
    ERRCODE = '55000',
    MESSAGE = 'business_profile_draft_version is append-only; append a new version instead';
END;
$$;
--> statement-breakpoint
REVOKE ALL ON FUNCTION app_private.reject_business_profile_draft_version_mutation() FROM PUBLIC;
--> statement-breakpoint
CREATE TRIGGER business_profile_draft_version_reject_update_or_delete
BEFORE UPDATE OR DELETE ON "business_profile_draft_version"
FOR EACH ROW EXECUTE FUNCTION app_private.reject_business_profile_draft_version_mutation();
