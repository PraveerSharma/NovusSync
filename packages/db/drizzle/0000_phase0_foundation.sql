CREATE ROLE "novussync_app";--> statement-breakpoint
CREATE TABLE "app_actor" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"actor_type" text NOT NULL,
	"identity_provider" text,
	"provider_subject" text,
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "app_actor_type_allowed" CHECK ("app_actor"."actor_type" in ('human', 'system')),
	CONSTRAINT "app_actor_status_allowed" CHECK ("app_actor"."status" in ('active', 'disabled')),
	CONSTRAINT "app_actor_identity_shape" CHECK (("app_actor"."actor_type" = 'human' and "app_actor"."identity_provider" is not null and "app_actor"."provider_subject" is not null)
        or ("app_actor"."actor_type" = 'system' and "app_actor"."provider_subject" is null))
);
--> statement-breakpoint
CREATE TABLE "audit_event" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"workspace_id" uuid NOT NULL,
	"actor_type" text NOT NULL,
	"actor_id" uuid,
	"action" text NOT NULL,
	"target_type" text NOT NULL,
	"target_id" text NOT NULL,
	"target_version" integer NOT NULL,
	"correlation_id" uuid NOT NULL,
	"idempotency_key" text,
	"policy_result" text NOT NULL,
	"evidence_state" text NOT NULL,
	"safe_metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"occurred_at" timestamp with time zone NOT NULL,
	"recorded_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "audit_event_actor_type_allowed" CHECK ("audit_event"."actor_type" in ('human', 'system')),
	CONSTRAINT "audit_event_target_version_positive" CHECK ("audit_event"."target_version" > 0),
	CONSTRAINT "audit_event_policy_result_allowed" CHECK ("audit_event"."policy_result" in ('allow', 'deny', 'not_applicable')),
	CONSTRAINT "audit_event_evidence_state_allowed" CHECK ("audit_event"."evidence_state" in ('unverified', 'verified', 'disputed', 'not_applicable')),
	CONSTRAINT "audit_event_safe_metadata_object" CHECK (jsonb_typeof("audit_event"."safe_metadata") = 'object')
);
--> statement-breakpoint
ALTER TABLE "audit_event" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "idempotency_record" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"workspace_id" uuid NOT NULL,
	"scope" text NOT NULL,
	"idempotency_key" text NOT NULL,
	"request_hash" text NOT NULL,
	"status" text NOT NULL,
	"result_reference" text,
	"locked_until" timestamp with time zone,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "idempotency_record_status_allowed" CHECK ("idempotency_record"."status" in ('in_progress', 'succeeded', 'failed', 'ambiguous')),
	CONSTRAINT "idempotency_record_expiry_order" CHECK ("idempotency_record"."expires_at" > "idempotency_record"."created_at")
);
--> statement-breakpoint
ALTER TABLE "idempotency_record" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "organization" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "organization_slug_format" CHECK ("organization"."slug" ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$')
);
--> statement-breakpoint
ALTER TABLE "organization" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "outbox_message" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"workspace_id" uuid NOT NULL,
	"aggregate_type" text NOT NULL,
	"aggregate_id" text NOT NULL,
	"aggregate_version" integer NOT NULL,
	"effect_kind" text NOT NULL,
	"effect_key" text NOT NULL,
	"safe_payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"available_at" timestamp with time zone DEFAULT now() NOT NULL,
	"lease_owner" text,
	"lease_expires_at" timestamp with time zone,
	"last_error_code" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone,
	CONSTRAINT "outbox_message_aggregate_version_positive" CHECK ("outbox_message"."aggregate_version" > 0),
	CONSTRAINT "outbox_message_attempts_nonnegative" CHECK ("outbox_message"."attempts" >= 0),
	CONSTRAINT "outbox_message_status_allowed" CHECK ("outbox_message"."status" in ('pending', 'processing', 'succeeded', 'failed', 'ambiguous', 'cancelled')),
	CONSTRAINT "outbox_message_safe_payload_object" CHECK (jsonb_typeof("outbox_message"."safe_payload") = 'object'),
	CONSTRAINT "outbox_message_lease_shape" CHECK (("outbox_message"."lease_owner" is null and "outbox_message"."lease_expires_at" is null)
        or ("outbox_message"."lease_owner" is not null and "outbox_message"."lease_expires_at" is not null))
);
--> statement-breakpoint
ALTER TABLE "outbox_message" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "support_grant" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"workspace_id" uuid NOT NULL,
	"actor_id" uuid NOT NULL,
	"granted_by_actor_id" uuid NOT NULL,
	"purpose" text NOT NULL,
	"starts_at" timestamp with time zone NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"revoked_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "support_grant_organization_id_workspace_id_id_unique" UNIQUE("organization_id","workspace_id","id"),
	CONSTRAINT "support_grant_time_order" CHECK ("support_grant"."expires_at" > "support_grant"."starts_at"),
	CONSTRAINT "support_grant_revoked_after_start" CHECK ("support_grant"."revoked_at" is null or "support_grant"."revoked_at" >= "support_grant"."starts_at")
);
--> statement-breakpoint
ALTER TABLE "support_grant" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "webhook_inbox" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"workspace_id" uuid NOT NULL,
	"provider" text NOT NULL,
	"event_key" text NOT NULL,
	"payload_hash" text NOT NULL,
	"safe_payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"status" text DEFAULT 'received' NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"last_error_code" text,
	"received_at" timestamp with time zone DEFAULT now() NOT NULL,
	"processed_at" timestamp with time zone,
	CONSTRAINT "webhook_inbox_status_allowed" CHECK ("webhook_inbox"."status" in ('received', 'processing', 'processed', 'failed', 'quarantined')),
	CONSTRAINT "webhook_inbox_attempts_nonnegative" CHECK ("webhook_inbox"."attempts" >= 0),
	CONSTRAINT "webhook_inbox_safe_payload_object" CHECK (jsonb_typeof("webhook_inbox"."safe_payload") = 'object')
);
--> statement-breakpoint
ALTER TABLE "webhook_inbox" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "workspace_membership" (
	"organization_id" uuid NOT NULL,
	"workspace_id" uuid NOT NULL,
	"actor_id" uuid NOT NULL,
	"role" text NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"revoked_at" timestamp with time zone,
	CONSTRAINT "workspace_membership_primary" PRIMARY KEY("organization_id","workspace_id","actor_id"),
	CONSTRAINT "workspace_membership_role_allowed" CHECK ("workspace_membership"."role" in ('owner', 'staff', 'internal_operator')),
	CONSTRAINT "workspace_membership_status_allowed" CHECK ("workspace_membership"."status" in ('active', 'revoked')),
	CONSTRAINT "workspace_membership_revocation_shape" CHECK (("workspace_membership"."status" = 'active' and "workspace_membership"."revoked_at" is null)
        or ("workspace_membership"."status" = 'revoked' and "workspace_membership"."revoked_at" is not null))
);
--> statement-breakpoint
ALTER TABLE "workspace_membership" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "workspace" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "workspace_organization_id_id_unique" UNIQUE("organization_id","id"),
	CONSTRAINT "workspace_slug_format" CHECK ("workspace"."slug" ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
	CONSTRAINT "workspace_status_allowed" CHECK ("workspace"."status" in ('active', 'suspended', 'closed'))
);
--> statement-breakpoint
ALTER TABLE "workspace" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "audit_event" ADD CONSTRAINT "audit_event_actor_id_app_actor_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."app_actor"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_event" ADD CONSTRAINT "audit_event_workspace_fk" FOREIGN KEY ("organization_id","workspace_id") REFERENCES "public"."workspace"("organization_id","id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "idempotency_record" ADD CONSTRAINT "idempotency_record_workspace_fk" FOREIGN KEY ("organization_id","workspace_id") REFERENCES "public"."workspace"("organization_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "outbox_message" ADD CONSTRAINT "outbox_message_workspace_fk" FOREIGN KEY ("organization_id","workspace_id") REFERENCES "public"."workspace"("organization_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "support_grant" ADD CONSTRAINT "support_grant_actor_id_app_actor_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."app_actor"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "support_grant" ADD CONSTRAINT "support_grant_granted_by_actor_id_app_actor_id_fk" FOREIGN KEY ("granted_by_actor_id") REFERENCES "public"."app_actor"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "support_grant" ADD CONSTRAINT "support_grant_workspace_fk" FOREIGN KEY ("organization_id","workspace_id") REFERENCES "public"."workspace"("organization_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "webhook_inbox" ADD CONSTRAINT "webhook_inbox_workspace_fk" FOREIGN KEY ("organization_id","workspace_id") REFERENCES "public"."workspace"("organization_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspace_membership" ADD CONSTRAINT "workspace_membership_actor_id_app_actor_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."app_actor"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspace_membership" ADD CONSTRAINT "workspace_membership_workspace_fk" FOREIGN KEY ("organization_id","workspace_id") REFERENCES "public"."workspace"("organization_id","id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspace" ADD CONSTRAINT "workspace_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "app_actor_provider_subject_unique" ON "app_actor" USING btree ("identity_provider","provider_subject") WHERE "app_actor"."provider_subject" is not null;--> statement-breakpoint
CREATE INDEX "audit_event_tenant_time_idx" ON "audit_event" USING btree ("organization_id","workspace_id","recorded_at","id");--> statement-breakpoint
CREATE INDEX "audit_event_correlation_idx" ON "audit_event" USING btree ("organization_id","workspace_id","correlation_id");--> statement-breakpoint
CREATE UNIQUE INDEX "idempotency_record_logical_key_unique" ON "idempotency_record" USING btree ("organization_id","workspace_id","scope","idempotency_key");--> statement-breakpoint
CREATE INDEX "idempotency_record_expiry_idx" ON "idempotency_record" USING btree ("expires_at");--> statement-breakpoint
CREATE UNIQUE INDEX "organization_slug_unique" ON "organization" USING btree ("slug");--> statement-breakpoint
CREATE UNIQUE INDEX "outbox_message_effect_key_unique" ON "outbox_message" USING btree ("organization_id","workspace_id","effect_kind","effect_key");--> statement-breakpoint
CREATE INDEX "outbox_message_dispatch_idx" ON "outbox_message" USING btree ("available_at","created_at","id") WHERE "outbox_message"."status" in ('pending', 'failed');--> statement-breakpoint
CREATE INDEX "support_grant_active_idx" ON "support_grant" USING btree ("organization_id","workspace_id","actor_id","expires_at");--> statement-breakpoint
CREATE UNIQUE INDEX "webhook_inbox_provider_event_unique" ON "webhook_inbox" USING btree ("organization_id","workspace_id","provider","event_key");--> statement-breakpoint
CREATE INDEX "webhook_inbox_pending_idx" ON "webhook_inbox" USING btree ("organization_id","workspace_id","received_at") WHERE "webhook_inbox"."status" in ('received', 'failed');--> statement-breakpoint
CREATE INDEX "workspace_membership_actor_idx" ON "workspace_membership" USING btree ("actor_id","status");--> statement-breakpoint
CREATE UNIQUE INDEX "workspace_organization_slug_unique" ON "workspace" USING btree ("organization_id","slug");--> statement-breakpoint
CREATE POLICY "audit_event_tenant_select" ON "audit_event" AS PERMISSIVE FOR SELECT TO "novussync_app" USING (
  "audit_event"."organization_id" = nullif(current_setting('app.organization_id', true), '')::uuid
  and "audit_event"."workspace_id" = nullif(current_setting('app.workspace_id', true), '')::uuid
);--> statement-breakpoint
CREATE POLICY "audit_event_tenant_insert" ON "audit_event" AS PERMISSIVE FOR INSERT TO "novussync_app" WITH CHECK (
  "audit_event"."organization_id" = nullif(current_setting('app.organization_id', true), '')::uuid
  and "audit_event"."workspace_id" = nullif(current_setting('app.workspace_id', true), '')::uuid
);--> statement-breakpoint
CREATE POLICY "idempotency_record_tenant_access" ON "idempotency_record" AS PERMISSIVE FOR ALL TO "novussync_app" USING (
  "idempotency_record"."organization_id" = nullif(current_setting('app.organization_id', true), '')::uuid
  and "idempotency_record"."workspace_id" = nullif(current_setting('app.workspace_id', true), '')::uuid
) WITH CHECK (
  "idempotency_record"."organization_id" = nullif(current_setting('app.organization_id', true), '')::uuid
  and "idempotency_record"."workspace_id" = nullif(current_setting('app.workspace_id', true), '')::uuid
);--> statement-breakpoint
CREATE POLICY "organization_tenant_access" ON "organization" AS PERMISSIVE FOR ALL TO "novussync_app" USING (
  "organization"."id" = nullif(current_setting('app.organization_id', true), '')::uuid
) WITH CHECK (
  "organization"."id" = nullif(current_setting('app.organization_id', true), '')::uuid
);--> statement-breakpoint
CREATE POLICY "outbox_message_tenant_access" ON "outbox_message" AS PERMISSIVE FOR ALL TO "novussync_app" USING (
  "outbox_message"."organization_id" = nullif(current_setting('app.organization_id', true), '')::uuid
  and "outbox_message"."workspace_id" = nullif(current_setting('app.workspace_id', true), '')::uuid
) WITH CHECK (
  "outbox_message"."organization_id" = nullif(current_setting('app.organization_id', true), '')::uuid
  and "outbox_message"."workspace_id" = nullif(current_setting('app.workspace_id', true), '')::uuid
);--> statement-breakpoint
CREATE POLICY "support_grant_tenant_access" ON "support_grant" AS PERMISSIVE FOR ALL TO "novussync_app" USING (
  "support_grant"."organization_id" = nullif(current_setting('app.organization_id', true), '')::uuid
  and "support_grant"."workspace_id" = nullif(current_setting('app.workspace_id', true), '')::uuid
) WITH CHECK (
  "support_grant"."organization_id" = nullif(current_setting('app.organization_id', true), '')::uuid
  and "support_grant"."workspace_id" = nullif(current_setting('app.workspace_id', true), '')::uuid
);--> statement-breakpoint
CREATE POLICY "webhook_inbox_tenant_access" ON "webhook_inbox" AS PERMISSIVE FOR ALL TO "novussync_app" USING (
  "webhook_inbox"."organization_id" = nullif(current_setting('app.organization_id', true), '')::uuid
  and "webhook_inbox"."workspace_id" = nullif(current_setting('app.workspace_id', true), '')::uuid
) WITH CHECK (
  "webhook_inbox"."organization_id" = nullif(current_setting('app.organization_id', true), '')::uuid
  and "webhook_inbox"."workspace_id" = nullif(current_setting('app.workspace_id', true), '')::uuid
);--> statement-breakpoint
CREATE POLICY "workspace_membership_tenant_access" ON "workspace_membership" AS PERMISSIVE FOR ALL TO "novussync_app" USING (
  "workspace_membership"."organization_id" = nullif(current_setting('app.organization_id', true), '')::uuid
  and "workspace_membership"."workspace_id" = nullif(current_setting('app.workspace_id', true), '')::uuid
) WITH CHECK (
  "workspace_membership"."organization_id" = nullif(current_setting('app.organization_id', true), '')::uuid
  and "workspace_membership"."workspace_id" = nullif(current_setting('app.workspace_id', true), '')::uuid
);--> statement-breakpoint
CREATE POLICY "workspace_tenant_access" ON "workspace" AS PERMISSIVE FOR ALL TO "novussync_app" USING (
  "workspace"."organization_id" = nullif(current_setting('app.organization_id', true), '')::uuid
  and "workspace"."id" = nullif(current_setting('app.workspace_id', true), '')::uuid
) WITH CHECK (
  "workspace"."organization_id" = nullif(current_setting('app.organization_id', true), '')::uuid
  and "workspace"."id" = nullif(current_setting('app.workspace_id', true), '')::uuid
);