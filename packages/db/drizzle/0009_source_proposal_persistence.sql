CREATE TABLE "approved_business_source" (
	"organization_id" uuid NOT NULL,
	"workspace_id" uuid NOT NULL,
	"source_id" text NOT NULL,
	"kind" text NOT NULL,
	"configuration" jsonb NOT NULL,
	"approved_by_actor_id" uuid NOT NULL,
	"approved_at" timestamp with time zone NOT NULL,
	"recorded_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "approved_business_source_primary" PRIMARY KEY("organization_id","workspace_id","source_id"),
	CONSTRAINT "approved_business_source_id_present" CHECK (length("approved_business_source"."source_id") > 0),
	CONSTRAINT "approved_business_source_kind_allowed" CHECK ("approved_business_source"."kind" in ('business_website', 'booking_route_metadata')),
	CONSTRAINT "approved_business_source_configuration_object" CHECK (jsonb_typeof("approved_business_source"."configuration") = 'object')
);
--> statement-breakpoint
ALTER TABLE "approved_business_source" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "fact_candidate_review_decision" (
	"organization_id" uuid NOT NULL,
	"workspace_id" uuid NOT NULL,
	"decision_id" text NOT NULL,
	"candidate_id" text NOT NULL,
	"profile_id" text NOT NULL,
	"decision_version" integer NOT NULL,
	"outcome" text NOT NULL,
	"reason_code" text NOT NULL,
	"decided_by_actor_id" uuid NOT NULL,
	"candidate_authority" text NOT NULL,
	"application_status" text NOT NULL,
	"decided_at" timestamp with time zone NOT NULL,
	"recorded_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "fact_candidate_review_decision_primary" PRIMARY KEY("organization_id","workspace_id","decision_id"),
	CONSTRAINT "fact_candidate_review_decision_id_present" CHECK (length("fact_candidate_review_decision"."decision_id") > 0),
	CONSTRAINT "fact_candidate_review_decision_version_positive" CHECK ("fact_candidate_review_decision"."decision_version" > 0),
	CONSTRAINT "fact_candidate_review_decision_outcome_allowed" CHECK ("fact_candidate_review_decision"."outcome" in ('approved_for_profile_draft', 'rejected', 'needs_changes')),
	CONSTRAINT "fact_candidate_review_decision_reason_format" CHECK ("fact_candidate_review_decision"."reason_code" ~ '^[A-Z][A-Z0-9_-]{0,63}$'),
	CONSTRAINT "fact_candidate_review_decision_effect_fixed" CHECK ("fact_candidate_review_decision"."candidate_authority" = 'provisional' and "fact_candidate_review_decision"."application_status" = 'not_applied')
);
--> statement-breakpoint
ALTER TABLE "fact_candidate_review_decision" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "fact_candidate" (
	"organization_id" uuid NOT NULL,
	"workspace_id" uuid NOT NULL,
	"candidate_id" text NOT NULL,
	"batch_id" text NOT NULL,
	"profile_id" text NOT NULL,
	"source_id" text NOT NULL,
	"capture_id" text NOT NULL,
	"field_key" text NOT NULL,
	"fact_template_version" text NOT NULL,
	"playbook_version" text NOT NULL,
	"value" jsonb NOT NULL,
	"allowed_use_cases" text[] NOT NULL,
	"confidence_basis_points" integer NOT NULL,
	"conflict_kind" text NOT NULL,
	"conflict_detail" text,
	"verification_status" text NOT NULL,
	"authority" text NOT NULL,
	"candidate_created_at" timestamp with time zone NOT NULL,
	"recorded_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "fact_candidate_primary" PRIMARY KEY("organization_id","workspace_id","candidate_id"),
	CONSTRAINT "fact_candidate_id_present" CHECK (length("fact_candidate"."candidate_id") > 0),
	CONSTRAINT "fact_candidate_field_key_format" CHECK ("fact_candidate"."field_key" ~ '^[a-z][a-zA-Z0-9]*(\.[a-z][a-zA-Z0-9]*)+$'),
	CONSTRAINT "fact_candidate_allowed_use_cases_present" CHECK (cardinality("fact_candidate"."allowed_use_cases") > 0),
	CONSTRAINT "fact_candidate_confidence_range" CHECK ("fact_candidate"."confidence_basis_points" between 0 and 10000),
	CONSTRAINT "fact_candidate_conflict_allowed" CHECK ("fact_candidate"."conflict_kind" in ('none', 'existing_value', 'source_disagreement', 'stale_source_label', 'provider_conflict')),
	CONSTRAINT "fact_candidate_conflict_shape" CHECK (("fact_candidate"."conflict_kind" = 'none' and "fact_candidate"."conflict_detail" is null)
        or ("fact_candidate"."conflict_kind" <> 'none' and "fact_candidate"."conflict_detail" is not null)),
	CONSTRAINT "fact_candidate_authority_fixed" CHECK ("fact_candidate"."verification_status" = 'unverified' and "fact_candidate"."authority" = 'provisional')
);
--> statement-breakpoint
ALTER TABLE "fact_candidate" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "source_capture" (
	"organization_id" uuid NOT NULL,
	"workspace_id" uuid NOT NULL,
	"source_id" text NOT NULL,
	"capture_id" text NOT NULL,
	"source_kind" text NOT NULL,
	"source_location" text NOT NULL,
	"source_reference" text NOT NULL,
	"captured_at" timestamp with time zone NOT NULL,
	"extractor_id" text NOT NULL,
	"extractor_version" text NOT NULL,
	"content_digest" text NOT NULL,
	"content_bytes" integer NOT NULL,
	"recorded_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "source_capture_primary" PRIMARY KEY("organization_id","workspace_id","capture_id"),
	CONSTRAINT "source_capture_source_identity_unique" UNIQUE("organization_id","workspace_id","source_id","capture_id"),
	CONSTRAINT "source_capture_id_present" CHECK (length("source_capture"."capture_id") > 0),
	CONSTRAINT "source_capture_location_present" CHECK (length("source_capture"."source_location") > 0),
	CONSTRAINT "source_capture_reference_present" CHECK (length("source_capture"."source_reference") > 0),
	CONSTRAINT "source_capture_extractor_id_present" CHECK (length("source_capture"."extractor_id") > 0),
	CONSTRAINT "source_capture_extractor_version_present" CHECK (length("source_capture"."extractor_version") > 0),
	CONSTRAINT "source_capture_digest_present" CHECK (length("source_capture"."content_digest") > 0),
	CONSTRAINT "source_capture_bytes_positive" CHECK ("source_capture"."content_bytes" > 0)
);
--> statement-breakpoint
ALTER TABLE "source_capture" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "source_proposal_batch" (
	"organization_id" uuid NOT NULL,
	"workspace_id" uuid NOT NULL,
	"batch_id" text NOT NULL,
	"profile_id" text NOT NULL,
	"source_id" text NOT NULL,
	"capture_id" text NOT NULL,
	"status" text NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"recorded_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "source_proposal_batch_primary" PRIMARY KEY("organization_id","workspace_id","batch_id"),
	CONSTRAINT "source_proposal_batch_id_present" CHECK (length("source_proposal_batch"."batch_id") > 0),
	CONSTRAINT "source_proposal_batch_status_allowed" CHECK ("source_proposal_batch"."status" = 'requires_owner_review')
);
--> statement-breakpoint
ALTER TABLE "source_proposal_batch" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "approved_business_source" ADD CONSTRAINT "approved_business_source_approved_by_actor_id_app_actor_id_fk" FOREIGN KEY ("approved_by_actor_id") REFERENCES "public"."app_actor"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "approved_business_source" ADD CONSTRAINT "approved_business_source_workspace_fk" FOREIGN KEY ("organization_id","workspace_id") REFERENCES "public"."workspace"("organization_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fact_candidate_review_decision" ADD CONSTRAINT "fact_candidate_review_decision_decided_by_actor_id_app_actor_id_fk" FOREIGN KEY ("decided_by_actor_id") REFERENCES "public"."app_actor"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fact_candidate_review_decision" ADD CONSTRAINT "fact_candidate_review_decision_candidate_fk" FOREIGN KEY ("organization_id","workspace_id","candidate_id") REFERENCES "public"."fact_candidate"("organization_id","workspace_id","candidate_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fact_candidate" ADD CONSTRAINT "fact_candidate_batch_fk" FOREIGN KEY ("organization_id","workspace_id","batch_id") REFERENCES "public"."source_proposal_batch"("organization_id","workspace_id","batch_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fact_candidate" ADD CONSTRAINT "fact_candidate_capture_fk" FOREIGN KEY ("organization_id","workspace_id","source_id","capture_id") REFERENCES "public"."source_capture"("organization_id","workspace_id","source_id","capture_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "source_capture" ADD CONSTRAINT "source_capture_source_fk" FOREIGN KEY ("organization_id","workspace_id","source_id") REFERENCES "public"."approved_business_source"("organization_id","workspace_id","source_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "source_proposal_batch" ADD CONSTRAINT "source_proposal_batch_profile_fk" FOREIGN KEY ("organization_id","workspace_id","profile_id") REFERENCES "public"."business_profile_draft"("organization_id","workspace_id","profile_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "source_proposal_batch" ADD CONSTRAINT "source_proposal_batch_source_fk" FOREIGN KEY ("organization_id","workspace_id","source_id") REFERENCES "public"."approved_business_source"("organization_id","workspace_id","source_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "source_proposal_batch" ADD CONSTRAINT "source_proposal_batch_capture_fk" FOREIGN KEY ("organization_id","workspace_id","source_id","capture_id") REFERENCES "public"."source_capture"("organization_id","workspace_id","source_id","capture_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "approved_business_source_kind_idx" ON "approved_business_source" USING btree ("organization_id","workspace_id","kind","recorded_at");--> statement-breakpoint
CREATE UNIQUE INDEX "fact_candidate_review_decision_version_unique" ON "fact_candidate_review_decision" USING btree ("organization_id","workspace_id","candidate_id","decision_version");--> statement-breakpoint
CREATE INDEX "fact_candidate_review_decision_time_idx" ON "fact_candidate_review_decision" USING btree ("organization_id","workspace_id","candidate_id","decided_at");--> statement-breakpoint
CREATE UNIQUE INDEX "fact_candidate_batch_field_unique" ON "fact_candidate" USING btree ("organization_id","workspace_id","batch_id","field_key");--> statement-breakpoint
CREATE INDEX "fact_candidate_profile_review_idx" ON "fact_candidate" USING btree ("organization_id","workspace_id","profile_id","recorded_at");--> statement-breakpoint
CREATE INDEX "source_capture_time_idx" ON "source_capture" USING btree ("organization_id","workspace_id","source_id","captured_at");--> statement-breakpoint
CREATE INDEX "source_proposal_batch_review_idx" ON "source_proposal_batch" USING btree ("organization_id","workspace_id","profile_id","status","created_at");--> statement-breakpoint
CREATE POLICY "approved_business_source_tenant_select" ON "approved_business_source" AS PERMISSIVE FOR SELECT TO "novussync_app" USING (
  "approved_business_source"."organization_id" = nullif((select current_setting('app.organization_id', true)), '')::uuid
  and "approved_business_source"."workspace_id" = nullif((select current_setting('app.workspace_id', true)), '')::uuid
);--> statement-breakpoint
CREATE POLICY "approved_business_source_tenant_insert" ON "approved_business_source" AS PERMISSIVE FOR INSERT TO "novussync_app" WITH CHECK (
  "approved_business_source"."organization_id" = nullif((select current_setting('app.organization_id', true)), '')::uuid
  and "approved_business_source"."workspace_id" = nullif((select current_setting('app.workspace_id', true)), '')::uuid
);--> statement-breakpoint
CREATE POLICY "fact_candidate_review_decision_tenant_select" ON "fact_candidate_review_decision" AS PERMISSIVE FOR SELECT TO "novussync_app" USING (
  "fact_candidate_review_decision"."organization_id" = nullif((select current_setting('app.organization_id', true)), '')::uuid
  and "fact_candidate_review_decision"."workspace_id" = nullif((select current_setting('app.workspace_id', true)), '')::uuid
);--> statement-breakpoint
CREATE POLICY "fact_candidate_review_decision_tenant_insert" ON "fact_candidate_review_decision" AS PERMISSIVE FOR INSERT TO "novussync_app" WITH CHECK (
  "fact_candidate_review_decision"."organization_id" = nullif((select current_setting('app.organization_id', true)), '')::uuid
  and "fact_candidate_review_decision"."workspace_id" = nullif((select current_setting('app.workspace_id', true)), '')::uuid
);--> statement-breakpoint
CREATE POLICY "fact_candidate_tenant_select" ON "fact_candidate" AS PERMISSIVE FOR SELECT TO "novussync_app" USING (
  "fact_candidate"."organization_id" = nullif((select current_setting('app.organization_id', true)), '')::uuid
  and "fact_candidate"."workspace_id" = nullif((select current_setting('app.workspace_id', true)), '')::uuid
);--> statement-breakpoint
CREATE POLICY "fact_candidate_tenant_insert" ON "fact_candidate" AS PERMISSIVE FOR INSERT TO "novussync_app" WITH CHECK (
  "fact_candidate"."organization_id" = nullif((select current_setting('app.organization_id', true)), '')::uuid
  and "fact_candidate"."workspace_id" = nullif((select current_setting('app.workspace_id', true)), '')::uuid
);--> statement-breakpoint
CREATE POLICY "source_capture_tenant_select" ON "source_capture" AS PERMISSIVE FOR SELECT TO "novussync_app" USING (
  "source_capture"."organization_id" = nullif((select current_setting('app.organization_id', true)), '')::uuid
  and "source_capture"."workspace_id" = nullif((select current_setting('app.workspace_id', true)), '')::uuid
);--> statement-breakpoint
CREATE POLICY "source_capture_tenant_insert" ON "source_capture" AS PERMISSIVE FOR INSERT TO "novussync_app" WITH CHECK (
  "source_capture"."organization_id" = nullif((select current_setting('app.organization_id', true)), '')::uuid
  and "source_capture"."workspace_id" = nullif((select current_setting('app.workspace_id', true)), '')::uuid
);--> statement-breakpoint
CREATE POLICY "source_proposal_batch_tenant_select" ON "source_proposal_batch" AS PERMISSIVE FOR SELECT TO "novussync_app" USING (
  "source_proposal_batch"."organization_id" = nullif((select current_setting('app.organization_id', true)), '')::uuid
  and "source_proposal_batch"."workspace_id" = nullif((select current_setting('app.workspace_id', true)), '')::uuid
);--> statement-breakpoint
CREATE POLICY "source_proposal_batch_tenant_insert" ON "source_proposal_batch" AS PERMISSIVE FOR INSERT TO "novussync_app" WITH CHECK (
  "source_proposal_batch"."organization_id" = nullif((select current_setting('app.organization_id', true)), '')::uuid
  and "source_proposal_batch"."workspace_id" = nullif((select current_setting('app.workspace_id', true)), '')::uuid
);--> statement-breakpoint
ALTER TABLE "approved_business_source" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "source_capture" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "source_proposal_batch" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "fact_candidate" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "fact_candidate_review_decision" FORCE ROW LEVEL SECURITY;--> statement-breakpoint
GRANT SELECT, INSERT ON TABLE
  "approved_business_source",
  "source_capture",
  "source_proposal_batch",
  "fact_candidate",
  "fact_candidate_review_decision"
TO "novussync_app";--> statement-breakpoint
REVOKE UPDATE, DELETE, TRUNCATE ON TABLE
  "approved_business_source",
  "source_capture",
  "source_proposal_batch",
  "fact_candidate",
  "fact_candidate_review_decision"
FROM "novussync_app";--> statement-breakpoint
CREATE OR REPLACE FUNCTION app_private.reject_source_proposal_record_mutation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = pg_catalog, public, app_private
AS $$
BEGIN
  RAISE EXCEPTION USING
    ERRCODE = '55000',
    MESSAGE = 'source proposal records are append-only';
END;
$$;--> statement-breakpoint
REVOKE ALL ON FUNCTION app_private.reject_source_proposal_record_mutation() FROM PUBLIC;--> statement-breakpoint
CREATE TRIGGER approved_business_source_reject_mutation
BEFORE UPDATE OR DELETE ON "approved_business_source"
FOR EACH ROW EXECUTE FUNCTION app_private.reject_source_proposal_record_mutation();--> statement-breakpoint
CREATE TRIGGER source_capture_reject_mutation
BEFORE UPDATE OR DELETE ON "source_capture"
FOR EACH ROW EXECUTE FUNCTION app_private.reject_source_proposal_record_mutation();--> statement-breakpoint
CREATE TRIGGER source_proposal_batch_reject_mutation
BEFORE UPDATE OR DELETE ON "source_proposal_batch"
FOR EACH ROW EXECUTE FUNCTION app_private.reject_source_proposal_record_mutation();--> statement-breakpoint
CREATE TRIGGER fact_candidate_reject_mutation
BEFORE UPDATE OR DELETE ON "fact_candidate"
FOR EACH ROW EXECUTE FUNCTION app_private.reject_source_proposal_record_mutation();--> statement-breakpoint
CREATE TRIGGER fact_candidate_review_decision_reject_mutation
BEFORE UPDATE OR DELETE ON "fact_candidate_review_decision"
FOR EACH ROW EXECUTE FUNCTION app_private.reject_source_proposal_record_mutation();
