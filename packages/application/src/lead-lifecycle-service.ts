import {
  createCommandEnvelope,
  createLeadLifecycle,
  transitionLeadLifecycle,
  type LeadLifecycleStage,
  type LeadLifecycleState,
  type LeadLifecycleTransitionResult,
  type TenantContext,
} from "@novussync/domain";

import { AuthorizationError, type AuthenticatedActorContext } from "./authorization.ts";

export interface LeadLifecycleActor {
  readonly type: "human" | "system";
  readonly id?: string;
}

export interface CreateLeadLifecycleRecord {
  readonly leadId: string;
  readonly actor: LeadLifecycleActor;
  readonly correlationId: string;
  readonly idempotencyKey?: string;
  readonly occurredAt: string;
}

export interface TransitionLeadLifecycleRecord {
  readonly leadId: string;
  readonly expectedVersion: number;
  readonly nextStage: LeadLifecycleStage;
  readonly reasonCode?: string;
  readonly actor: LeadLifecycleActor;
  readonly correlationId: string;
  readonly idempotencyKey?: string;
  readonly occurredAt: string;
}

export interface LeadLifecycleRecord {
  readonly organizationId: string;
  readonly workspaceId: string;
  readonly leadId: string;
  readonly stage: LeadLifecycleStage;
  readonly version: number;
  readonly openedAt: string;
  readonly updatedAt: string;
}

export interface LeadLifecycleTransitionRecord {
  readonly id: string;
  readonly organizationId: string;
  readonly workspaceId: string;
  readonly leadId: string;
  readonly version: number;
  readonly previousStage: LeadLifecycleStage | null;
  readonly nextStage: LeadLifecycleStage;
  readonly reasonCode: string | null;
  readonly actor: LeadLifecycleActor;
  readonly correlationId: string;
  readonly occurredAt: string;
  readonly recordedAt: string;
}

export type LeadLifecyclePersistenceErrorCode =
  | "already_exists"
  | "invalid_input"
  | "invalid_transition"
  | "not_found"
  | "time_regression"
  | "version_conflict";

export class LeadLifecyclePersistenceError extends Error {
  readonly code: LeadLifecyclePersistenceErrorCode;

  constructor(code: LeadLifecyclePersistenceErrorCode, message: string) {
    super(message);
    this.name = "LeadLifecyclePersistenceError";
    this.code = code;
  }
}

export interface LeadLifecycleRepositoryPort {
  create(context: TenantContext, input: CreateLeadLifecycleRecord): Promise<LeadLifecycleRecord>;
  findById(context: TenantContext, leadId: string): Promise<LeadLifecycleRecord | null>;
  listTransitions(
    context: TenantContext,
    leadId: string,
  ): Promise<readonly LeadLifecycleTransitionRecord[]>;
  transition(
    context: TenantContext,
    input: TransitionLeadLifecycleRecord,
  ): Promise<LeadLifecycleRecord>;
}

export type CreateLeadLifecycleCommand = Readonly<{
  leadId: string;
  occurredAt: string;
  idempotencyKey: string;
}>;

export type TransitionLeadLifecycleCommand = Readonly<{
  leadId: string;
  expectedVersion: number;
  to: LeadLifecycleStage;
  occurredAt: string;
  reasonCode?: string;
  idempotencyKey: string;
}>;

export interface LeadLifecycleCommandService {
  create(
    context: AuthenticatedActorContext,
    command: CreateLeadLifecycleCommand,
  ): Promise<LeadLifecycleState>;
  transition(
    context: AuthenticatedActorContext,
    command: TransitionLeadLifecycleCommand,
  ): Promise<LeadLifecycleTransitionResult>;
}

export function createLeadLifecycleService(
  dependencies: Readonly<{ repository: LeadLifecycleRepositoryPort }>,
): LeadLifecycleCommandService {
  return Object.freeze({
    async create(context: AuthenticatedActorContext, command: CreateLeadLifecycleCommand) {
      assertCommandContext(context, command.occurredAt, command.idempotencyKey);
      createCommandEnvelope({
        command: "lead.lifecycle.create",
        tenant: context.tenant,
        actor: context.actor,
        correlationId: context.correlationId,
        origin: context.origin,
        payload: Object.freeze({ leadId: command.leadId }),
        createdAt: command.occurredAt,
      });

      const expected = createLeadLifecycle({
        leadId: command.leadId,
        tenant: context.tenant,
        occurredAt: command.occurredAt,
      });
      const persisted = await dependencies.repository.create(context.tenant, {
        leadId: command.leadId,
        actor: lifecycleActor(context),
        correlationId: context.correlationId,
        idempotencyKey: command.idempotencyKey,
        occurredAt: command.occurredAt,
      });
      assertPersistenceResult(expected, persisted);
      return toDomainState(persisted);
    },

    async transition(context: AuthenticatedActorContext, command: TransitionLeadLifecycleCommand) {
      assertCommandContext(context, command.occurredAt, command.idempotencyKey);
      createCommandEnvelope({
        command: "lead.lifecycle.transition",
        tenant: context.tenant,
        actor: context.actor,
        correlationId: context.correlationId,
        origin: context.origin,
        payload: Object.freeze({
          leadId: command.leadId,
          expectedVersion: command.expectedVersion,
          to: command.to,
          ...(command.reasonCode ? { reasonCode: command.reasonCode } : {}),
        }),
        createdAt: command.occurredAt,
      });

      const currentRecord = await dependencies.repository.findById(context.tenant, command.leadId);
      if (!currentRecord) {
        throw new LeadLifecyclePersistenceError("not_found", "Lead lifecycle was not found");
      }
      if (currentRecord.version !== command.expectedVersion) {
        throw new LeadLifecyclePersistenceError(
          "version_conflict",
          "Lead lifecycle changed after it was read",
        );
      }

      const current = toDomainState(currentRecord);
      const expected = transitionLeadLifecycle(current, {
        to: command.to,
        occurredAt: command.occurredAt,
        ...(command.reasonCode ? { reasonCode: command.reasonCode } : {}),
      });
      const persisted = await dependencies.repository.transition(context.tenant, {
        leadId: command.leadId,
        expectedVersion: command.expectedVersion,
        nextStage: expected.state.stage,
        ...(expected.transition.reasonCode ? { reasonCode: expected.transition.reasonCode } : {}),
        actor: lifecycleActor(context),
        correlationId: context.correlationId,
        idempotencyKey: command.idempotencyKey,
        occurredAt: expected.transition.occurredAt,
      });
      assertPersistenceResult(expected.state, persisted);
      return Object.freeze({
        state: toDomainState(persisted),
        transition: expected.transition,
      });
    },
  });
}

function assertCommandContext(
  context: AuthenticatedActorContext,
  occurredAt: string,
  idempotencyKey: string,
): void {
  const occurredAtTime = Date.parse(occurredAt);
  if (Number.isNaN(occurredAtTime) || !idempotencyKey.trim() || idempotencyKey.length > 200) {
    throw new LeadLifecyclePersistenceError(
      "invalid_input",
      "Lifecycle commands require a timestamp and an idempotency key",
    );
  }
  if (context.actor.actorType !== "human") {
    throw new AuthorizationError(
      "WORKSPACE_ACCESS_DENIED",
      "Lifecycle commands require an authenticated human actor.",
    );
  }
  if (Date.parse(context.session.expiresAt) <= occurredAtTime) {
    throw new AuthorizationError("SESSION_EXPIRED", "The session has expired.");
  }
}

function lifecycleActor(context: AuthenticatedActorContext): LeadLifecycleActor {
  return Object.freeze({ type: "human", id: context.actor.id });
}

function toDomainState(record: LeadLifecycleRecord): LeadLifecycleState {
  return Object.freeze({
    leadId: record.leadId,
    tenant: Object.freeze({
      organizationId: record.organizationId,
      workspaceId: record.workspaceId,
    }),
    stage: record.stage,
    version: record.version,
    updatedAt: record.updatedAt,
  });
}

function assertPersistenceResult(
  expected: LeadLifecycleState,
  persisted: LeadLifecycleRecord,
): void {
  if (
    persisted.organizationId !== expected.tenant.organizationId ||
    persisted.workspaceId !== expected.tenant.workspaceId ||
    persisted.leadId !== expected.leadId ||
    persisted.stage !== expected.stage ||
    persisted.version !== expected.version ||
    Date.parse(persisted.updatedAt) !== Date.parse(expected.updatedAt)
  ) {
    throw new Error("Lifecycle persistence returned an inconsistent state");
  }
}
