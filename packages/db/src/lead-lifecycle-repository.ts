import { and, asc, eq } from "drizzle-orm";

import {
  LeadLifecyclePersistenceError,
  type CreateLeadLifecycleRecord,
  type LeadLifecycleActor,
  type LeadLifecycleRecord,
  type LeadLifecycleRepositoryPort,
  type LeadLifecycleTransitionRecord,
  type TransitionLeadLifecycleRecord,
} from "@novussync/application";

import {
  canTransitionLeadLifecycle,
  isLeadLifecycleStage,
  type LeadLifecycleStage,
} from "@novussync/domain";

import type { Database } from "./client.ts";
import { auditEvents, leadLifecycles, leadLifecycleTransitions } from "./schema.ts";
import { withTenantTransaction, type TenantContext } from "./tenant-transaction.ts";

export type LeadLifecycleRepository = LeadLifecycleRepositoryPort;

export function createLeadLifecycleRepository(database: Database): LeadLifecycleRepositoryPort {
  return Object.freeze({
    async create(context: TenantContext, input: CreateLeadLifecycleRecord) {
      const occurredAt = validateCreateInput(input);

      try {
        return await withTenantTransaction(database, context, async (transaction) => {
          const [created] = await transaction
            .insert(leadLifecycles)
            .values({
              organizationId: context.organizationId,
              workspaceId: context.workspaceId,
              leadId: input.leadId,
              stage: "new",
              version: 1,
              openedAt: occurredAt,
              updatedAt: occurredAt,
            })
            .returning();

          if (!created) {
            throw new LeadLifecyclePersistenceError(
              "not_found",
              "The lifecycle could not be created",
            );
          }

          await transaction.insert(leadLifecycleTransitions).values({
            organizationId: context.organizationId,
            workspaceId: context.workspaceId,
            leadId: input.leadId,
            version: 1,
            previousStage: null,
            nextStage: "new",
            actorType: input.actor.type,
            actorId: input.actor.id,
            correlationId: input.correlationId,
            occurredAt,
          });

          await transaction.insert(auditEvents).values({
            organizationId: context.organizationId,
            workspaceId: context.workspaceId,
            actorType: input.actor.type,
            actorId: input.actor.id,
            action: "lead.lifecycle.created",
            targetType: "lead",
            targetId: input.leadId,
            targetVersion: 1,
            correlationId: input.correlationId,
            idempotencyKey: input.idempotencyKey,
            policyResult: "allow",
            evidenceState: "not_applicable",
            safeMetadata: { previousStage: null, nextStage: "new" },
            occurredAt,
          });

          return mapLifecycle(created);
        });
      } catch (error) {
        if (postgresErrorCode(error) === "23505") {
          throw new LeadLifecyclePersistenceError(
            "already_exists",
            "A lifecycle already exists for this lead",
          );
        }
        throw error;
      }
    },

    async findById(context: TenantContext, leadId: string) {
      assertUuid(leadId, "leadId");
      return withTenantTransaction(database, context, async (transaction) => {
        const [record] = await transaction
          .select()
          .from(leadLifecycles)
          .where(
            and(
              eq(leadLifecycles.organizationId, context.organizationId),
              eq(leadLifecycles.workspaceId, context.workspaceId),
              eq(leadLifecycles.leadId, leadId),
            ),
          )
          .limit(1);
        return record ? mapLifecycle(record) : null;
      });
    },

    async listTransitions(context: TenantContext, leadId: string) {
      assertUuid(leadId, "leadId");
      return withTenantTransaction(database, context, async (transaction) => {
        const records = await transaction
          .select()
          .from(leadLifecycleTransitions)
          .where(
            and(
              eq(leadLifecycleTransitions.organizationId, context.organizationId),
              eq(leadLifecycleTransitions.workspaceId, context.workspaceId),
              eq(leadLifecycleTransitions.leadId, leadId),
            ),
          )
          .orderBy(asc(leadLifecycleTransitions.version));
        return Object.freeze(records.map(mapTransition));
      });
    },

    async transition(context: TenantContext, input: TransitionLeadLifecycleRecord) {
      const occurredAt = validateTransitionInput(input);

      return withTenantTransaction(database, context, async (transaction) => {
        const [current] = await transaction
          .select()
          .from(leadLifecycles)
          .where(
            and(
              eq(leadLifecycles.organizationId, context.organizationId),
              eq(leadLifecycles.workspaceId, context.workspaceId),
              eq(leadLifecycles.leadId, input.leadId),
            ),
          )
          .limit(1);

        if (!current) {
          throw new LeadLifecyclePersistenceError("not_found", "Lead lifecycle was not found");
        }
        if (current.version !== input.expectedVersion) {
          throw new LeadLifecyclePersistenceError(
            "version_conflict",
            "Lead lifecycle changed after it was read",
          );
        }
        if (occurredAt.getTime() < current.updatedAt.getTime()) {
          throw new LeadLifecyclePersistenceError(
            "time_regression",
            "Lifecycle transition time cannot move backwards",
          );
        }
        if (!canTransitionLeadLifecycle(current.stage, input.nextStage)) {
          throw new LeadLifecyclePersistenceError(
            "invalid_transition",
            `Cannot transition from ${current.stage} to ${input.nextStage}`,
          );
        }

        const nextVersion = current.version + 1;
        const [updated] = await transaction
          .update(leadLifecycles)
          .set({
            stage: input.nextStage,
            version: nextVersion,
            updatedAt: occurredAt,
          })
          .where(
            and(
              eq(leadLifecycles.organizationId, context.organizationId),
              eq(leadLifecycles.workspaceId, context.workspaceId),
              eq(leadLifecycles.leadId, input.leadId),
              eq(leadLifecycles.version, input.expectedVersion),
              eq(leadLifecycles.stage, current.stage),
            ),
          )
          .returning();

        if (!updated) {
          throw new LeadLifecyclePersistenceError(
            "version_conflict",
            "Lead lifecycle changed during the transition",
          );
        }

        await transaction.insert(leadLifecycleTransitions).values({
          organizationId: context.organizationId,
          workspaceId: context.workspaceId,
          leadId: input.leadId,
          version: nextVersion,
          previousStage: current.stage,
          nextStage: input.nextStage,
          reasonCode: input.reasonCode,
          actorType: input.actor.type,
          actorId: input.actor.id,
          correlationId: input.correlationId,
          occurredAt,
        });

        await transaction.insert(auditEvents).values({
          organizationId: context.organizationId,
          workspaceId: context.workspaceId,
          actorType: input.actor.type,
          actorId: input.actor.id,
          action: "lead.lifecycle.transitioned",
          targetType: "lead",
          targetId: input.leadId,
          targetVersion: nextVersion,
          correlationId: input.correlationId,
          idempotencyKey: input.idempotencyKey,
          policyResult: "allow",
          evidenceState: "not_applicable",
          safeMetadata: {
            previousStage: current.stage,
            nextStage: input.nextStage,
            ...(input.reasonCode ? { reasonCode: input.reasonCode } : {}),
          },
          occurredAt,
        });

        return mapLifecycle(updated);
      });
    },
  });
}

function validateCreateInput(input: CreateLeadLifecycleRecord): Date {
  assertUuid(input.leadId, "leadId");
  validateActor(input.actor);
  assertUuid(input.correlationId, "correlationId");
  validateIdempotencyKey(input.idempotencyKey);
  return parseTimestamp(input.occurredAt);
}

function validateTransitionInput(input: TransitionLeadLifecycleRecord): Date {
  assertUuid(input.leadId, "leadId");
  if (!Number.isSafeInteger(input.expectedVersion) || input.expectedVersion < 1) {
    throw invalidInput("expectedVersion must be a positive integer");
  }
  if (!isLeadLifecycleStage(input.nextStage)) {
    throw invalidInput("nextStage is not a supported lifecycle stage");
  }
  if (input.reasonCode !== undefined && !REASON_CODE_PATTERN.test(input.reasonCode)) {
    throw invalidInput("reasonCode must be a stable uppercase code");
  }
  if (REASON_REQUIRED_STAGES.has(input.nextStage) && !input.reasonCode) {
    throw invalidInput(`reasonCode is required for ${input.nextStage}`);
  }
  validateActor(input.actor);
  assertUuid(input.correlationId, "correlationId");
  validateIdempotencyKey(input.idempotencyKey);
  return parseTimestamp(input.occurredAt);
}

function validateActor(actor: LeadLifecycleActor): void {
  if (actor.type !== "human" && actor.type !== "system") {
    throw invalidInput("actor type must be human or system");
  }
  if (actor.type === "human" && !actor.id) {
    throw invalidInput("human lifecycle actions require an actor id");
  }
  if (actor.id !== undefined) {
    assertUuid(actor.id, "actor.id");
  }
}

function validateIdempotencyKey(value: string | undefined): void {
  if (value !== undefined && (!value.trim() || value.length > 200)) {
    throw invalidInput("idempotencyKey must contain 1 to 200 characters");
  }
}

function parseTimestamp(value: string): Date {
  const parsed = new Date(value);
  if (!value || Number.isNaN(parsed.getTime())) {
    throw invalidInput("occurredAt must be a valid timestamp");
  }
  return parsed;
}

function assertUuid(value: string, field: string): void {
  if (!UUID_PATTERN.test(value)) {
    throw invalidInput(`${field} must be a valid UUID`);
  }
}

function invalidInput(message: string): LeadLifecyclePersistenceError {
  return new LeadLifecyclePersistenceError("invalid_input", message);
}

function mapLifecycle(record: typeof leadLifecycles.$inferSelect): LeadLifecycleRecord {
  if (!isLeadLifecycleStage(record.stage)) {
    throw new Error("Database returned an unsupported lifecycle stage");
  }
  return Object.freeze({
    organizationId: record.organizationId,
    workspaceId: record.workspaceId,
    leadId: record.leadId,
    stage: record.stage,
    version: record.version,
    openedAt: record.openedAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  });
}

function mapTransition(
  record: typeof leadLifecycleTransitions.$inferSelect,
): LeadLifecycleTransitionRecord {
  if (
    !isLeadLifecycleStage(record.nextStage) ||
    (record.previousStage !== null && !isLeadLifecycleStage(record.previousStage))
  ) {
    throw new Error("Database returned an unsupported lifecycle transition stage");
  }
  return Object.freeze({
    id: record.id,
    organizationId: record.organizationId,
    workspaceId: record.workspaceId,
    leadId: record.leadId,
    version: record.version,
    previousStage: record.previousStage,
    nextStage: record.nextStage,
    reasonCode: record.reasonCode,
    actor: Object.freeze({
      type: record.actorType,
      ...(record.actorId ? { id: record.actorId } : {}),
    }),
    correlationId: record.correlationId,
    occurredAt: record.occurredAt.toISOString(),
    recordedAt: record.recordedAt.toISOString(),
  });
}

function postgresErrorCode(error: unknown): string | undefined {
  return typeof error === "object" && error !== null && "code" in error
    ? String(error.code)
    : undefined;
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const REASON_CODE_PATTERN = /^[A-Z][A-Z0-9_-]{0,63}$/;
const REASON_REQUIRED_STAGES = new Set<LeadLifecycleStage>([
  "outcome_missed",
  "closed_not_converted",
]);
