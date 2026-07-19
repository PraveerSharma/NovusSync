CREATE TABLE "approved_fact_version" (
	"organization_id" uuid NOT NULL,
	"workspace_id" uuid NOT NULL,
	"fact_version_id" text NOT NULL,
	"profile_id" text NOT NULL,
	"field_key" text NOT NULL,
	"version" integer NOT NULL,
	"value" jsonb NOT NULL,
	"state" text NOT NULL,
	"source_candidate_id" text NOT NULL,
	"source_id" text NOT NULL,
	"capture_id" text NOT NULL,
	"source_location" text NOT NULL,
	"source_reference" text NOT NULL,
	"source_captured_at" timestamp with time zone NOT NULL,
	"extractor_id" text NOT NULL,
	"extractor_version" text NOT NULL,
	"review_action" text NOT NULL,
	"reason_code" text NOT NULL,
	"supersedes_fact_version_id" text,
	"conflict_kind" text,
	"conflict_reason_code" text,
	"verified_by_actor_id" uuid NOT NULL,
	"verified_by_role" text NOT NULL,
	"verified_at" timestamp with time zone NOT NULL,
	"recorded_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "approved_fact_version_primary" PRIMARY KEY("organization_id","workspace_id","fact_version_id"),
	CONSTRAINT "approved_fact_version_id_present" CHECK (length("approved_fact_version"."fact_version_id") > 0),
	CONSTRAINT "approved_fact_version_field_key_format" CHECK ("approved_fact_version"."field_key" ~ '^[a-z][a-zA-Z0-9]*(\.[a-z][a-zA-Z0-9]*)+$'),
	CONSTRAINT "approved_fact_version_version_positive" CHECK ("approved_fact_version"."version" > 0),
	CONSTRAINT "approved_fact_version_state_fixed" CHECK ("approved_fact_version"."state" = 'approved'),
	CONSTRAINT "approved_fact_version_action_allowed" CHECK ("approved_fact_version"."review_action" in ('verify', 'correct_and_verify', 'resolve_conflict')),
	CONSTRAINT "approved_fact_version_reason_format" CHECK ("approved_fact_version"."reason_code" ~ '^[A-Z][A-Z0-9_-]{0,63}$'),
	CONSTRAINT "approved_fact_version_supersession_shape" CHECK (("approved_fact_version"."version" = 1 and "approved_fact_version"."supersedes_fact_version_id" is null)
        or ("approved_fact_version"."version" > 1 and "approved_fact_version"."supersedes_fact_version_id" is not null)),
	CONSTRAINT "approved_fact_version_conflict_shape" CHECK (("approved_fact_version"."review_action" = 'resolve_conflict'
          and "approved_fact_version"."conflict_kind" is not null
          and "approved_fact_version"."conflict_reason_code" is not null)
        or ("approved_fact_version"."review_action" <> 'resolve_conflict'
          and "approved_fact_version"."conflict_kind" is null
          and "approved_fact_version"."conflict_reason_code" is null)),
	CONSTRAINT "approved_fact_version_conflict_reason_format" CHECK ("approved_fact_version"."conflict_reason_code" is null
        or "approved_fact_version"."conflict_reason_code" ~ '^[A-Z][A-Z0-9_-]{0,63}$'),
	CONSTRAINT "approved_fact_version_owner_fixed" CHECK ("approved_fact_version"."verified_by_role" = 'owner')
);
--> statement-breakpoint
ALTER TABLE "approved_fact_version" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "fact_review_decision" (
	"organization_id" uuid NOT NULL,
	"workspace_id" uuid NOT NULL,
	"decision_id" text NOT NULL,
	"candidate_id" text NOT NULL,
	"profile_id" text NOT NULL,
	"field_key" text NOT NULL,
	"decision_version" integer NOT NULL,
	"action" text NOT NULL,
	"reason_code" text NOT NULL,
	"candidate_disposition" text NOT NULL,
	"approved_fact_version_id" text,
	"current_fact_version_id" text,
	"profile_application_status" text NOT NULL,
	"decided_by_actor_id" uuid NOT NULL,
	"decided_by_role" text NOT NULL,
	"decided_at" timestamp with time zone NOT NULL,
	"recorded_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "fact_review_decision_primary" PRIMARY KEY("organization_id","workspace_id","decision_id"),
	CONSTRAINT "fact_review_decision_id_present" CHECK (length("fact_review_decision"."decision_id") > 0),
	CONSTRAINT "fact_review_decision_field_key_format" CHECK ("fact_review_decision"."field_key" ~ '^[a-z][a-zA-Z0-9]*(\.[a-z][a-zA-Z0-9]*)+$'),
	CONSTRAINT "fact_review_decision_version_positive" CHECK ("fact_review_decision"."decision_version" > 0),
	CONSTRAINT "fact_review_decision_action_allowed" CHECK ("fact_review_decision"."action" in ('verify', 'correct_and_verify', 'reject', 'resolve_conflict')),
	CONSTRAINT "fact_review_decision_reason_format" CHECK ("fact_review_decision"."reason_code" ~ '^[A-Z][A-Z0-9_-]{0,63}$'),
	CONSTRAINT "fact_review_decision_result_shape" CHECK (("fact_review_decision"."candidate_disposition" = 'approved'
          and "fact_review_decision"."action" <> 'reject'
          and "fact_review_decision"."approved_fact_version_id" is not null
          and "fact_review_decision"."current_fact_version_id" is null)
        or ("fact_review_decision"."candidate_disposition" = 'rejected'
          and "fact_review_decision"."action" = 'reject'
          and "fact_review_decision"."approved_fact_version_id" is null)),
	CONSTRAINT "fact_review_decision_effect_fixed" CHECK ("fact_review_decision"."profile_application_status" = 'not_applied'
        and "fact_review_decision"."decided_by_role" = 'owner')
);
--> statement-breakpoint
ALTER TABLE "fact_review_decision" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "approved_fact_version" ADD CONSTRAINT "approved_fact_version_verified_by_actor_id_app_actor_id_fk" FOREIGN KEY ("verified_by_actor_id") REFERENCES "public"."app_actor"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "approved_fact_version" ADD CONSTRAINT "approved_fact_version_candidate_fk" FOREIGN KEY ("organization_id","workspace_id","source_candidate_id") REFERENCES "public"."fact_candidate"("organization_id","workspace_id","candidate_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "approved_fact_version" ADD CONSTRAINT "approved_fact_version_capture_fk" FOREIGN KEY ("organization_id","workspace_id","source_id","capture_id") REFERENCES "public"."source_capture"("organization_id","workspace_id","source_id","capture_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "approved_fact_version" ADD CONSTRAINT "approved_fact_version_supersedes_fk" FOREIGN KEY ("organization_id","workspace_id","supersedes_fact_version_id") REFERENCES "public"."approved_fact_version"("organization_id","workspace_id","fact_version_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fact_review_decision" ADD CONSTRAINT "fact_review_decision_decided_by_actor_id_app_actor_id_fk" FOREIGN KEY ("decided_by_actor_id") REFERENCES "public"."app_actor"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fact_review_decision" ADD CONSTRAINT "fact_review_decision_candidate_fk" FOREIGN KEY ("organization_id","workspace_id","candidate_id") REFERENCES "public"."fact_candidate"("organization_id","workspace_id","candidate_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fact_review_decision" ADD CONSTRAINT "fact_review_decision_approved_fact_fk" FOREIGN KEY ("organization_id","workspace_id","approved_fact_version_id") REFERENCES "public"."approved_fact_version"("organization_id","workspace_id","fact_version_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fact_review_decision" ADD CONSTRAINT "fact_review_decision_current_fact_fk" FOREIGN KEY ("organization_id","workspace_id","current_fact_version_id") REFERENCES "public"."approved_fact_version"("organization_id","workspace_id","fact_version_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "approved_fact_version_field_version_unique" ON "approved_fact_version" USING btree ("organization_id","workspace_id","profile_id","field_key","version");--> statement-breakpoint
CREATE INDEX "approved_fact_version_current_idx" ON "approved_fact_version" USING btree ("organization_id","workspace_id","profile_id","field_key","version");--> statement-breakpoint
CREATE UNIQUE INDEX "fact_review_decision_version_unique" ON "fact_review_decision" USING btree ("organization_id","workspace_id","candidate_id","decision_version");--> statement-breakpoint
CREATE INDEX "fact_review_decision_time_idx" ON "fact_review_decision" USING btree ("organization_id","workspace_id","candidate_id","decided_at");--> statement-breakpoint
CREATE POLICY "approved_fact_version_tenant_select" ON "approved_fact_version" AS PERMISSIVE FOR SELECT TO "novussync_app" USING (
  "approved_fact_version"."organization_id" = nullif((select current_setting('app.organization_id', true)), '')::uuid
  and "approved_fact_version"."workspace_id" = nullif((select current_setting('app.workspace_id', true)), '')::uuid
);--> statement-breakpoint
CREATE POLICY "approved_fact_version_tenant_insert" ON "approved_fact_version" AS PERMISSIVE FOR INSERT TO "novussync_app" WITH CHECK (
  "approved_fact_version"."organization_id" = nullif((select current_setting('app.organization_id', true)), '')::uuid
  and "approved_fact_version"."workspace_id" = nullif((select current_setting('app.workspace_id', true)), '')::uuid
);--> statement-breakpoint
CREATE POLICY "fact_review_decision_tenant_select" ON "fact_review_decision" AS PERMISSIVE FOR SELECT TO "novussync_app" USING (
  "fact_review_decision"."organization_id" = nullif((select current_setting('app.organization_id', true)), '')::uuid
  and "fact_review_decision"."workspace_id" = nullif((select current_setting('app.workspace_id', true)), '')::uuid
);--> statement-breakpoint
CREATE POLICY "fact_review_decision_tenant_insert" ON "fact_review_decision" AS PERMISSIVE FOR INSERT TO "novussync_app" WITH CHECK (
  "fact_review_decision"."organization_id" = nullif((select current_setting('app.organization_id', true)), '')::uuid
  and "fact_review_decision"."workspace_id" = nullif((select current_setting('app.workspace_id', true)), '')::uuid
);+--> statement-breakpoint
+ALTER TABLE "approved_fact_version" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
+ALTER TABLE "fact_review_decision" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
+GRANT SELECT, INSERT ON TABLE
+  "approved_fact_version",
+  "fact_review_decision"
+TO "novussync_app";--> statement-breakpoint
+REVOKE UPDATE, DELETE, TRUNCATE ON TABLE
+  "approved_fact_version",
+  "fact_review_decision"
+FROM "novussync_app";--> statement-breakpoint
+CREATE OR REPLACE FUNCTION app_private.reject_fact_review_record_mutation()
+RETURNS trigger
+LANGUAGE plpgsql
+SECURITY INVOKER
+SET search_path = pg_catalog, public, app_private
+AS $$
+BEGIN
+  RAISE EXCEPTION USING
+    ERRCODE = '55000',
+    MESSAGE = 'fact review records are append-only';
+END;
+$$;--> statement-breakpoint
+REVOKE ALL ON FUNCTION app_private.reject_fact_review_record_mutation() FROM PUBLIC;--> statement-breakpoint
+CREATE TRIGGER approved_fact_version_reject_mutation
+BEFORE UPDATE OR DELETE ON "approved_fact_version"
+FOR EACH ROW EXECUTE FUNCTION app_private.reject_fact_review_record_mutation();--> statement-breakpoint
+CREATE TRIGGER fact_review_decision_reject_mutation
+BEFORE UPDATE OR DELETE ON "fact_review_decision"
+FOR EACH ROW EXECUTE FUNCTION app_private.reject_fact_review_record_mutation();
+SQL
+perl -0pi -e 's/^\+//mg' packages/db/drizzle/0010_fact_review_persistence.sql