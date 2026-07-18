import { sql } from "drizzle-orm";
import {
  type AnyPgColumn,
  check,
  foreignKey,
  index,
  integer,
  jsonb,
  pgPolicy,
  pgRole,
  pgTable,
  primaryKey,
  text,
  timestamp,
  unique,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

export const novussyncAppRole = pgRole("novussync_app", { inherit: true });

const organizationScope = (organizationId: AnyPgColumn) => sql`
  ${organizationId} = nullif((select current_setting('app.organization_id', true)), '')::uuid
`;

const workspaceScope = (organizationId: AnyPgColumn, workspaceId: AnyPgColumn) => sql`
  ${organizationId} = nullif((select current_setting('app.organization_id', true)), '')::uuid
  and ${workspaceId} = nullif((select current_setting('app.workspace_id', true)), '')::uuid
`;

export const organizations = pgTable(
  "organization",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    slug: text("slug").notNull(),
    name: text("name").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("organization_slug_unique").on(table.slug),
    check("organization_slug_format", sql`${table.slug} ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'`),
    pgPolicy("organization_tenant_access", {
      to: novussyncAppRole,
      for: "all",
      using: organizationScope(table.id),
      withCheck: organizationScope(table.id),
    }),
  ],
);

export const workspaces = pgTable(
  "workspace",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    slug: text("slug").notNull(),
    name: text("name").notNull(),
    status: text("status", { enum: ["active", "suspended", "closed"] })
      .default("active")
      .notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    unique("workspace_organization_id_id_unique").on(table.organizationId, table.id),
    uniqueIndex("workspace_organization_slug_unique").on(table.organizationId, table.slug),
    check("workspace_slug_format", sql`${table.slug} ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'`),
    check("workspace_status_allowed", sql`${table.status} in ('active', 'suspended', 'closed')`),
    pgPolicy("workspace_tenant_access", {
      to: novussyncAppRole,
      for: "all",
      using: workspaceScope(table.organizationId, table.id),
      withCheck: workspaceScope(table.organizationId, table.id),
    }),
  ],
);

export const actors = pgTable(
  "app_actor",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    actorType: text("actor_type", { enum: ["human", "system"] }).notNull(),
    identityProvider: text("identity_provider"),
    providerSubject: text("provider_subject"),
    status: text("status", { enum: ["active", "disabled"] })
      .default("active")
      .notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("app_actor_provider_subject_unique")
      .on(table.identityProvider, table.providerSubject)
      .where(sql`${table.providerSubject} is not null`),
    check("app_actor_type_allowed", sql`${table.actorType} in ('human', 'system')`),
    check("app_actor_status_allowed", sql`${table.status} in ('active', 'disabled')`),
    check(
      "app_actor_identity_shape",
      sql`(${table.actorType} = 'human' and ${table.identityProvider} is not null and ${table.providerSubject} is not null)
        or (${table.actorType} = 'system' and ${table.providerSubject} is null)`,
    ),
    pgPolicy("app_actor_no_direct_access", {
      to: novussyncAppRole,
      for: "all",
      using: sql`false`,
      withCheck: sql`false`,
    }),
  ],
);

export const workspaceMemberships = pgTable(
  "workspace_membership",
  {
    organizationId: uuid("organization_id").notNull(),
    workspaceId: uuid("workspace_id").notNull(),
    actorId: uuid("actor_id")
      .notNull()
      .references(() => actors.id, { onDelete: "restrict" }),
    role: text("role", { enum: ["owner", "staff", "internal_operator"] }).notNull(),
    status: text("status", { enum: ["active", "revoked"] })
      .default("active")
      .notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
  },
  (table) => [
    primaryKey({
      name: "workspace_membership_primary",
      columns: [table.organizationId, table.workspaceId, table.actorId],
    }),
    foreignKey({
      name: "workspace_membership_workspace_fk",
      columns: [table.organizationId, table.workspaceId],
      foreignColumns: [workspaces.organizationId, workspaces.id],
    }).onDelete("cascade"),
    index("workspace_membership_actor_idx").on(table.actorId, table.status),
    check(
      "workspace_membership_role_allowed",
      sql`${table.role} in ('owner', 'staff', 'internal_operator')`,
    ),
    check("workspace_membership_status_allowed", sql`${table.status} in ('active', 'revoked')`),
    check(
      "workspace_membership_revocation_shape",
      sql`(${table.status} = 'active' and ${table.revokedAt} is null)
        or (${table.status} = 'revoked' and ${table.revokedAt} is not null)`,
    ),
    pgPolicy("workspace_membership_tenant_access", {
      to: novussyncAppRole,
      for: "all",
      using: workspaceScope(table.organizationId, table.workspaceId),
      withCheck: workspaceScope(table.organizationId, table.workspaceId),
    }),
  ],
);

export const supportGrants = pgTable(
  "support_grant",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id").notNull(),
    workspaceId: uuid("workspace_id").notNull(),
    actorId: uuid("actor_id")
      .notNull()
      .references(() => actors.id, { onDelete: "restrict" }),
    grantedByActorId: uuid("granted_by_actor_id")
      .notNull()
      .references(() => actors.id, { onDelete: "restrict" }),
    purpose: text("purpose").notNull(),
    startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    unique("support_grant_organization_id_workspace_id_id_unique").on(
      table.organizationId,
      table.workspaceId,
      table.id,
    ),
    foreignKey({
      name: "support_grant_workspace_fk",
      columns: [table.organizationId, table.workspaceId],
      foreignColumns: [workspaces.organizationId, workspaces.id],
    }).onDelete("cascade"),
    index("support_grant_active_idx").on(
      table.organizationId,
      table.workspaceId,
      table.actorId,
      table.expiresAt,
    ),
    index("support_grant_actor_idx").on(table.actorId),
    index("support_grant_granted_by_actor_idx").on(table.grantedByActorId),
    check("support_grant_time_order", sql`${table.expiresAt} > ${table.startsAt}`),
    check(
      "support_grant_revoked_after_start",
      sql`${table.revokedAt} is null or ${table.revokedAt} >= ${table.startsAt}`,
    ),
    pgPolicy("support_grant_tenant_access", {
      to: novussyncAppRole,
      for: "all",
      using: workspaceScope(table.organizationId, table.workspaceId),
      withCheck: workspaceScope(table.organizationId, table.workspaceId),
    }),
  ],
);

export const auditEvents = pgTable(
  "audit_event",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id").notNull(),
    workspaceId: uuid("workspace_id").notNull(),
    actorType: text("actor_type", { enum: ["human", "system"] }).notNull(),
    actorId: uuid("actor_id").references(() => actors.id, { onDelete: "set null" }),
    action: text("action").notNull(),
    targetType: text("target_type").notNull(),
    targetId: text("target_id").notNull(),
    targetVersion: integer("target_version").notNull(),
    correlationId: uuid("correlation_id").notNull(),
    idempotencyKey: text("idempotency_key"),
    policyResult: text("policy_result", { enum: ["allow", "deny", "not_applicable"] }).notNull(),
    evidenceState: text("evidence_state", {
      enum: ["unverified", "verified", "disputed", "not_applicable"],
    }).notNull(),
    safeMetadata: jsonb("safe_metadata")
      .$type<Record<string, unknown>>()
      .default(sql`'{}'::jsonb`)
      .notNull(),
    occurredAt: timestamp("occurred_at", { withTimezone: true }).notNull(),
    recordedAt: timestamp("recorded_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    foreignKey({
      name: "audit_event_workspace_fk",
      columns: [table.organizationId, table.workspaceId],
      foreignColumns: [workspaces.organizationId, workspaces.id],
    }).onDelete("restrict"),
    index("audit_event_tenant_time_idx").on(
      table.organizationId,
      table.workspaceId,
      table.recordedAt,
      table.id,
    ),
    index("audit_event_correlation_idx").on(
      table.organizationId,
      table.workspaceId,
      table.correlationId,
    ),
    index("audit_event_actor_idx").on(table.actorId),
    check("audit_event_actor_type_allowed", sql`${table.actorType} in ('human', 'system')`),
    check("audit_event_target_version_positive", sql`${table.targetVersion} > 0`),
    check(
      "audit_event_policy_result_allowed",
      sql`${table.policyResult} in ('allow', 'deny', 'not_applicable')`,
    ),
    check(
      "audit_event_evidence_state_allowed",
      sql`${table.evidenceState} in ('unverified', 'verified', 'disputed', 'not_applicable')`,
    ),
    check("audit_event_safe_metadata_object", sql`jsonb_typeof(${table.safeMetadata}) = 'object'`),
    pgPolicy("audit_event_tenant_select", {
      to: novussyncAppRole,
      for: "select",
      using: workspaceScope(table.organizationId, table.workspaceId),
    }),
    pgPolicy("audit_event_tenant_insert", {
      to: novussyncAppRole,
      for: "insert",
      withCheck: workspaceScope(table.organizationId, table.workspaceId),
    }),
  ],
);

export const leadLifecycles = pgTable(
  "lead_lifecycle",
  {
    organizationId: uuid("organization_id").notNull(),
    workspaceId: uuid("workspace_id").notNull(),
    leadId: uuid("lead_id").notNull(),
    stage: text("stage", {
      enum: [
        "new",
        "contacted",
        "qualified",
        "booking_proposed",
        "booked",
        "booking_confirmed",
        "outcome_verified",
        "outcome_missed",
        "conversion_follow_up",
        "converted",
        "closed_not_converted",
      ],
    }).notNull(),
    version: integer("version").default(1).notNull(),
    openedAt: timestamp("opened_at", { withTimezone: true }).notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
  },
  (table) => [
    primaryKey({
      name: "lead_lifecycle_primary",
      columns: [table.organizationId, table.workspaceId, table.leadId],
    }),
    foreignKey({
      name: "lead_lifecycle_workspace_fk",
      columns: [table.organizationId, table.workspaceId],
      foreignColumns: [workspaces.organizationId, workspaces.id],
    }).onDelete("restrict"),
    index("lead_lifecycle_stage_idx").on(
      table.organizationId,
      table.workspaceId,
      table.stage,
      table.updatedAt,
    ),
    check(
      "lead_lifecycle_stage_allowed",
      sql`${table.stage} in (
        'new', 'contacted', 'qualified', 'booking_proposed', 'booked',
        'booking_confirmed', 'outcome_verified', 'outcome_missed',
        'conversion_follow_up', 'converted', 'closed_not_converted'
      )`,
    ),
    check("lead_lifecycle_version_positive", sql`${table.version} > 0`),
    check("lead_lifecycle_time_order", sql`${table.updatedAt} >= ${table.openedAt}`),
    pgPolicy("lead_lifecycle_tenant_access", {
      to: novussyncAppRole,
      for: "all",
      using: workspaceScope(table.organizationId, table.workspaceId),
      withCheck: workspaceScope(table.organizationId, table.workspaceId),
    }),
  ],
);

export const leadLifecycleTransitions = pgTable(
  "lead_lifecycle_transition",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id").notNull(),
    workspaceId: uuid("workspace_id").notNull(),
    leadId: uuid("lead_id").notNull(),
    version: integer("version").notNull(),
    previousStage: text("previous_stage", {
      enum: [
        "new",
        "contacted",
        "qualified",
        "booking_proposed",
        "booked",
        "booking_confirmed",
        "outcome_verified",
        "outcome_missed",
        "conversion_follow_up",
        "converted",
        "closed_not_converted",
      ],
    }),
    nextStage: text("next_stage", {
      enum: [
        "new",
        "contacted",
        "qualified",
        "booking_proposed",
        "booked",
        "booking_confirmed",
        "outcome_verified",
        "outcome_missed",
        "conversion_follow_up",
        "converted",
        "closed_not_converted",
      ],
    }).notNull(),
    reasonCode: text("reason_code"),
    actorType: text("actor_type", { enum: ["human", "system"] }).notNull(),
    actorId: uuid("actor_id").references(() => actors.id, { onDelete: "set null" }),
    correlationId: uuid("correlation_id").notNull(),
    occurredAt: timestamp("occurred_at", { withTimezone: true }).notNull(),
    recordedAt: timestamp("recorded_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    foreignKey({
      name: "lead_lifecycle_transition_lifecycle_fk",
      columns: [table.organizationId, table.workspaceId, table.leadId],
      foreignColumns: [
        leadLifecycles.organizationId,
        leadLifecycles.workspaceId,
        leadLifecycles.leadId,
      ],
    }).onDelete("restrict"),
    uniqueIndex("lead_lifecycle_transition_version_unique").on(
      table.organizationId,
      table.workspaceId,
      table.leadId,
      table.version,
    ),
    index("lead_lifecycle_transition_time_idx").on(
      table.organizationId,
      table.workspaceId,
      table.leadId,
      table.occurredAt,
      table.id,
    ),
    index("lead_lifecycle_transition_actor_idx").on(table.actorId),
    check("lead_lifecycle_transition_version_positive", sql`${table.version} > 0`),
    check(
      "lead_lifecycle_transition_previous_stage_allowed",
      sql`${table.previousStage} is null or ${table.previousStage} in (
        'new', 'contacted', 'qualified', 'booking_proposed', 'booked',
        'booking_confirmed', 'outcome_verified', 'outcome_missed',
        'conversion_follow_up', 'converted', 'closed_not_converted'
      )`,
    ),
    check(
      "lead_lifecycle_transition_next_stage_allowed",
      sql`${table.nextStage} in (
        'new', 'contacted', 'qualified', 'booking_proposed', 'booked',
        'booking_confirmed', 'outcome_verified', 'outcome_missed',
        'conversion_follow_up', 'converted', 'closed_not_converted'
      )`,
    ),
    check(
      "lead_lifecycle_transition_initial_shape",
      sql`(${table.version} = 1 and ${table.previousStage} is null and ${table.nextStage} = 'new')
        or (${table.version} > 1 and ${table.previousStage} is not null)`,
    ),
    check(
      "lead_lifecycle_transition_actor_shape",
      sql`(${table.actorType} = 'human' and ${table.actorId} is not null)
        or ${table.actorType} = 'system'`,
    ),
    check(
      "lead_lifecycle_transition_reason_code_format",
      sql`${table.reasonCode} is null or ${table.reasonCode} ~ '^[A-Z][A-Z0-9_-]{0,63}$'`,
    ),
    pgPolicy("lead_lifecycle_transition_tenant_select", {
      to: novussyncAppRole,
      for: "select",
      using: workspaceScope(table.organizationId, table.workspaceId),
    }),
    pgPolicy("lead_lifecycle_transition_tenant_insert", {
      to: novussyncAppRole,
      for: "insert",
      withCheck: workspaceScope(table.organizationId, table.workspaceId),
    }),
  ],
);

export const idempotencyRecords = pgTable(
  "idempotency_record",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id").notNull(),
    workspaceId: uuid("workspace_id").notNull(),
    scope: text("scope").notNull(),
    idempotencyKey: text("idempotency_key").notNull(),
    requestHash: text("request_hash").notNull(),
    status: text("status", { enum: ["in_progress", "succeeded", "failed", "ambiguous"] }).notNull(),
    resultReference: text("result_reference"),
    lockedUntil: timestamp("locked_until", { withTimezone: true }),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    foreignKey({
      name: "idempotency_record_workspace_fk",
      columns: [table.organizationId, table.workspaceId],
      foreignColumns: [workspaces.organizationId, workspaces.id],
    }).onDelete("cascade"),
    uniqueIndex("idempotency_record_logical_key_unique").on(
      table.organizationId,
      table.workspaceId,
      table.scope,
      table.idempotencyKey,
    ),
    index("idempotency_record_expiry_idx").on(table.expiresAt),
    check(
      "idempotency_record_status_allowed",
      sql`${table.status} in ('in_progress', 'succeeded', 'failed', 'ambiguous')`,
    ),
    check("idempotency_record_expiry_order", sql`${table.expiresAt} > ${table.createdAt}`),
    pgPolicy("idempotency_record_tenant_access", {
      to: novussyncAppRole,
      for: "all",
      using: workspaceScope(table.organizationId, table.workspaceId),
      withCheck: workspaceScope(table.organizationId, table.workspaceId),
    }),
  ],
);

export const webhookInbox = pgTable(
  "webhook_inbox",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id").notNull(),
    workspaceId: uuid("workspace_id").notNull(),
    provider: text("provider").notNull(),
    eventKey: text("event_key").notNull(),
    payloadHash: text("payload_hash").notNull(),
    safePayload: jsonb("safe_payload")
      .$type<Record<string, unknown>>()
      .default(sql`'{}'::jsonb`)
      .notNull(),
    status: text("status", {
      enum: ["received", "processing", "processed", "failed", "quarantined"],
    })
      .default("received")
      .notNull(),
    attempts: integer("attempts").default(0).notNull(),
    lastErrorCode: text("last_error_code"),
    receivedAt: timestamp("received_at", { withTimezone: true }).defaultNow().notNull(),
    processedAt: timestamp("processed_at", { withTimezone: true }),
  },
  (table) => [
    foreignKey({
      name: "webhook_inbox_workspace_fk",
      columns: [table.organizationId, table.workspaceId],
      foreignColumns: [workspaces.organizationId, workspaces.id],
    }).onDelete("cascade"),
    uniqueIndex("webhook_inbox_provider_event_unique").on(
      table.organizationId,
      table.workspaceId,
      table.provider,
      table.eventKey,
    ),
    index("webhook_inbox_pending_idx")
      .on(table.organizationId, table.workspaceId, table.receivedAt)
      .where(sql`${table.status} in ('received', 'failed')`),
    check(
      "webhook_inbox_status_allowed",
      sql`${table.status} in ('received', 'processing', 'processed', 'failed', 'quarantined')`,
    ),
    check("webhook_inbox_attempts_nonnegative", sql`${table.attempts} >= 0`),
    check("webhook_inbox_safe_payload_object", sql`jsonb_typeof(${table.safePayload}) = 'object'`),
    pgPolicy("webhook_inbox_tenant_access", {
      to: novussyncAppRole,
      for: "all",
      using: workspaceScope(table.organizationId, table.workspaceId),
      withCheck: workspaceScope(table.organizationId, table.workspaceId),
    }),
  ],
);

export const outboxMessages = pgTable(
  "outbox_message",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id").notNull(),
    workspaceId: uuid("workspace_id").notNull(),
    aggregateType: text("aggregate_type").notNull(),
    aggregateId: text("aggregate_id").notNull(),
    aggregateVersion: integer("aggregate_version").notNull(),
    effectKind: text("effect_kind").notNull(),
    effectKey: text("effect_key").notNull(),
    safePayload: jsonb("safe_payload")
      .$type<Record<string, unknown>>()
      .default(sql`'{}'::jsonb`)
      .notNull(),
    status: text("status", {
      enum: ["pending", "processing", "succeeded", "failed", "ambiguous", "cancelled"],
    })
      .default("pending")
      .notNull(),
    attempts: integer("attempts").default(0).notNull(),
    availableAt: timestamp("available_at", { withTimezone: true }).defaultNow().notNull(),
    leaseOwner: text("lease_owner"),
    leaseExpiresAt: timestamp("lease_expires_at", { withTimezone: true }),
    lastErrorCode: text("last_error_code"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
    completedAt: timestamp("completed_at", { withTimezone: true }),
  },
  (table) => [
    foreignKey({
      name: "outbox_message_workspace_fk",
      columns: [table.organizationId, table.workspaceId],
      foreignColumns: [workspaces.organizationId, workspaces.id],
    }).onDelete("cascade"),
    uniqueIndex("outbox_message_effect_key_unique").on(
      table.organizationId,
      table.workspaceId,
      table.effectKind,
      table.effectKey,
    ),
    index("outbox_message_dispatch_idx")
      .on(table.availableAt, table.createdAt, table.id)
      .where(sql`${table.status} in ('pending', 'failed')`),
    check("outbox_message_aggregate_version_positive", sql`${table.aggregateVersion} > 0`),
    check("outbox_message_attempts_nonnegative", sql`${table.attempts} >= 0`),
    check(
      "outbox_message_status_allowed",
      sql`${table.status} in ('pending', 'processing', 'succeeded', 'failed', 'ambiguous', 'cancelled')`,
    ),
    check("outbox_message_safe_payload_object", sql`jsonb_typeof(${table.safePayload}) = 'object'`),
    check(
      "outbox_message_lease_shape",
      sql`(${table.leaseOwner} is null and ${table.leaseExpiresAt} is null)
        or (${table.leaseOwner} is not null and ${table.leaseExpiresAt} is not null)`,
    ),
    pgPolicy("outbox_message_tenant_access", {
      to: novussyncAppRole,
      for: "all",
      using: workspaceScope(table.organizationId, table.workspaceId),
      withCheck: workspaceScope(table.organizationId, table.workspaceId),
    }),
  ],
);

export const businessProfileDrafts = pgTable(
  "business_profile_draft",
  {
    organizationId: uuid("organization_id").notNull(),
    workspaceId: uuid("workspace_id").notNull(),
    profileId: text("profile_id").notNull(),
    playbookId: text("playbook_id").notNull(),
    playbookVersion: integer("playbook_version").notNull(),
    values: jsonb("values")
      .$type<Record<string, string | readonly string[]>>()
      .default(sql`'{}'::jsonb`)
      .notNull(),
    version: integer("version").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
  },
  (table) => [
    foreignKey({
      name: "business_profile_draft_workspace_fk",
      columns: [table.organizationId, table.workspaceId],
      foreignColumns: [workspaces.organizationId, workspaces.id],
    }).onDelete("cascade"),
    uniqueIndex("business_profile_draft_identity_unique").on(
      table.organizationId,
      table.workspaceId,
      table.profileId,
    ),
    index("business_profile_draft_updated_idx").on(
      table.organizationId,
      table.workspaceId,
      table.updatedAt,
    ),
    check("business_profile_draft_profile_id_present", sql`length(${table.profileId}) > 0`),
    check("business_profile_draft_playbook_id_present", sql`length(${table.playbookId}) > 0`),
    check("business_profile_draft_playbook_version_positive", sql`${table.playbookVersion} > 0`),
    check("business_profile_draft_version_positive", sql`${table.version} > 0`),
    check("business_profile_draft_values_object", sql`jsonb_typeof(${table.values}) = 'object'`),
    check("business_profile_draft_time_order", sql`${table.updatedAt} >= ${table.createdAt}`),
    pgPolicy("business_profile_draft_tenant_select", {
      to: novussyncAppRole,
      for: "select",
      using: workspaceScope(table.organizationId, table.workspaceId),
    }),
    pgPolicy("business_profile_draft_tenant_insert", {
      to: novussyncAppRole,
      for: "insert",
      withCheck: workspaceScope(table.organizationId, table.workspaceId),
    }),
    pgPolicy("business_profile_draft_tenant_update", {
      to: novussyncAppRole,
      for: "update",
      using: workspaceScope(table.organizationId, table.workspaceId),
      withCheck: workspaceScope(table.organizationId, table.workspaceId),
    }),
  ],
);

export const businessProfileDraftVersions = pgTable(
  "business_profile_draft_version",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id").notNull(),
    workspaceId: uuid("workspace_id").notNull(),
    profileId: text("profile_id").notNull(),
    playbookId: text("playbook_id").notNull(),
    playbookVersion: integer("playbook_version").notNull(),
    values: jsonb("values")
      .$type<Record<string, string | readonly string[]>>()
      .default(sql`'{}'::jsonb`)
      .notNull(),
    version: integer("version").notNull(),
    idempotencyKey: text("idempotency_key").notNull(),
    profileCreatedAt: timestamp("profile_created_at", { withTimezone: true }).notNull(),
    occurredAt: timestamp("occurred_at", { withTimezone: true }).notNull(),
    recordedAt: timestamp("recorded_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    foreignKey({
      name: "business_profile_draft_version_profile_fk",
      columns: [table.organizationId, table.workspaceId, table.profileId],
      foreignColumns: [
        businessProfileDrafts.organizationId,
        businessProfileDrafts.workspaceId,
        businessProfileDrafts.profileId,
      ],
    }).onDelete("cascade"),
    uniqueIndex("business_profile_draft_version_unique").on(
      table.organizationId,
      table.workspaceId,
      table.profileId,
      table.version,
    ),
    index("business_profile_draft_version_time_idx").on(
      table.organizationId,
      table.workspaceId,
      table.profileId,
      table.recordedAt,
    ),
    check("business_profile_draft_version_positive", sql`${table.version} > 0`),
    check("business_profile_draft_version_playbook_positive", sql`${table.playbookVersion} > 0`),
    check(
      "business_profile_draft_version_values_object",
      sql`jsonb_typeof(${table.values}) = 'object'`,
    ),
    check(
      "business_profile_draft_version_time_order",
      sql`${table.occurredAt} >= ${table.profileCreatedAt}`,
    ),
    pgPolicy("business_profile_draft_version_tenant_select", {
      to: novussyncAppRole,
      for: "select",
      using: workspaceScope(table.organizationId, table.workspaceId),
    }),
    pgPolicy("business_profile_draft_version_tenant_insert", {
      to: novussyncAppRole,
      for: "insert",
      withCheck: workspaceScope(table.organizationId, table.workspaceId),
    }),
  ],
);
