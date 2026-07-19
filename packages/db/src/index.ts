export { createDatabase } from "./client.ts";
export type { Database, DatabaseHandle, DatabaseOptions } from "./client.ts";
export * from "./schema.ts";
export { withTenantTransaction } from "./tenant-transaction.ts";
export type { TenantContext } from "./tenant-transaction.ts";
export { LeadLifecyclePersistenceError } from "@novussync/application";
export type {
  CreateLeadLifecycleRecord,
  LeadLifecycleActor,
  LeadLifecyclePersistenceErrorCode,
  LeadLifecycleRecord,
  LeadLifecycleRepositoryPort,
  LeadLifecycleTransitionRecord,
  TransitionLeadLifecycleRecord,
} from "@novussync/application";
export { createLeadLifecycleRepository } from "./lead-lifecycle-repository.ts";
export type { LeadLifecycleRepository } from "./lead-lifecycle-repository.ts";
export { createWorkspaceAccessRepository } from "./workspace-access-repository.ts";

export {
  BusinessProfilePersistenceError,
  createBusinessProfileDraftRepository,
} from "./business-profile-repository.ts";
export type {
  BusinessProfileDraftRepository,
  BusinessProfilePersistenceErrorCode,
} from "./business-profile-repository.ts";

export {
  SourceProposalPersistenceError,
  createSourceProposalRepository,
} from "./source-proposal-repository.ts";
export type {
  SourceProposalPersistenceErrorCode,
  SourceProposalRepository,
} from "./source-proposal-repository.ts";

export {
  FactReviewPersistenceError,
  createFactReviewRepository,
} from "./fact-review-repository.ts";
export type {
  FactReviewPersistenceErrorCode,
  FactReviewRepository,
} from "./fact-review-repository.ts";

export {
  ApprovedContextPersistenceError,
  createApprovedContextRepository,
} from "./approved-context-repository.ts";
export type {
  ApprovedContextPersistenceErrorCode,
  ApprovedContextPersistenceRepository,
} from "./approved-context-repository.ts";

export {
  WorkspaceDirectoryPersistenceError,
  createWorkspaceDirectoryRepository,
} from "./workspace-directory-repository.ts";
export type {
  WorkspaceDirectoryPersistenceErrorCode,
  WorkspaceDirectoryRepository,
} from "./workspace-directory-repository.ts";
