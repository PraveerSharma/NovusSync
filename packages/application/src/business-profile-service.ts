import {
  BusinessProfileError,
  createBusinessProfileDraft,
  reviseBusinessProfileDraft,
  type BusinessProfileDraft,
  type BusinessProfilePlaybook,
  type BusinessProfileTenant,
  type BusinessProfileValue,
} from "@novussync/domain";

import type { AuthenticatedActorContext } from "./authorization.ts";

export type BusinessProfileWriteAction = "business_profile.create" | "business_profile.revise";

export interface BusinessProfileAuthorizationPort {
  authorize(
    context: AuthenticatedActorContext,
    request: Readonly<{
      action: BusinessProfileWriteAction;
      tenant: BusinessProfileTenant;
      profileId: string;
      now: string;
    }>,
  ): Promise<void>;
}

export interface BusinessProfileDraftRepositoryPort {
  findById(
    context: AuthenticatedActorContext,
    tenant: BusinessProfileTenant,
    profileId: string,
    playbook: BusinessProfilePlaybook,
  ): Promise<BusinessProfileDraft | null>;
  create(
    context: AuthenticatedActorContext,
    draft: BusinessProfileDraft,
    playbook: BusinessProfilePlaybook,
    idempotencyKey: string,
  ): Promise<BusinessProfileDraft>;
  revise(
    context: AuthenticatedActorContext,
    draft: BusinessProfileDraft,
    playbook: BusinessProfilePlaybook,
    expectedVersion: number,
    idempotencyKey: string,
  ): Promise<BusinessProfileDraft>;
}

export type CreateBusinessProfileDraftCommand = Readonly<{
  context: AuthenticatedActorContext;
  tenant: BusinessProfileTenant;
  profileId: string;
  playbook: BusinessProfilePlaybook;
  values?: Readonly<Record<string, BusinessProfileValue>>;
  idempotencyKey: string;
}>;

export type ReviseBusinessProfileDraftCommand = Readonly<{
  context: AuthenticatedActorContext;
  tenant: BusinessProfileTenant;
  profileId: string;
  playbook: BusinessProfilePlaybook;
  expectedVersion: number;
  changes: Readonly<Record<string, BusinessProfileValue | null>>;
  idempotencyKey: string;
}>;

export const BUSINESS_PROFILE_APPLICATION_ERROR_CODES = [
  "INVALID_IDEMPOTENCY_KEY",
  "PROFILE_NOT_FOUND",
] as const;

export type BusinessProfileApplicationErrorCode =
  (typeof BUSINESS_PROFILE_APPLICATION_ERROR_CODES)[number];

export class BusinessProfileApplicationError extends Error {
  override readonly name = "BusinessProfileApplicationError";
  readonly code: BusinessProfileApplicationErrorCode;

  constructor(code: BusinessProfileApplicationErrorCode, message: string) {
    super(message);
    this.code = code;
  }
}

export function createBusinessProfileDraftService(dependencies: {
  authorization: BusinessProfileAuthorizationPort;
  repository: BusinessProfileDraftRepositoryPort;
  clock: () => string;
}) {
  return Object.freeze({
    async create(command: CreateBusinessProfileDraftCommand): Promise<BusinessProfileDraft> {
      assertIdempotencyKey(command.idempotencyKey);
      const now = dependencies.clock();
      await dependencies.authorization.authorize(command.context, {
        action: "business_profile.create",
        tenant: command.tenant,
        profileId: command.profileId,
        now,
      });

      const draft = createBusinessProfileDraft({
        profileId: command.profileId,
        tenant: command.tenant,
        playbook: command.playbook,
        values: command.values,
        now,
      });
      return dependencies.repository.create(
        command.context,
        draft,
        command.playbook,
        command.idempotencyKey,
      );
    },

    async revise(command: ReviseBusinessProfileDraftCommand): Promise<BusinessProfileDraft> {
      assertIdempotencyKey(command.idempotencyKey);
      const now = dependencies.clock();
      await dependencies.authorization.authorize(command.context, {
        action: "business_profile.revise",
        tenant: command.tenant,
        profileId: command.profileId,
        now,
      });

      const current = await dependencies.repository.findById(
        command.context,
        command.tenant,
        command.profileId,
        command.playbook,
      );
      if (!current) {
        throw new BusinessProfileApplicationError(
          "PROFILE_NOT_FOUND",
          "The business profile draft was not found.",
        );
      }

      const revised = reviseBusinessProfileDraft(current, {
        expectedVersion: command.expectedVersion,
        playbook: command.playbook,
        changes: command.changes,
        now,
      });
      return dependencies.repository.revise(
        command.context,
        revised,
        command.playbook,
        command.expectedVersion,
        command.idempotencyKey,
      );
    },
  });
}

function assertIdempotencyKey(value: string): void {
  if (!/^[a-zA-Z0-9][a-zA-Z0-9._:-]{7,127}$/.test(value)) {
    throw new BusinessProfileApplicationError(
      "INVALID_IDEMPOTENCY_KEY",
      "A stable idempotency key is required.",
    );
  }
}

export { BusinessProfileError };
