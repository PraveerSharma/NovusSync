export { createDatabase } from "./client.js";
export type { Database, DatabaseHandle, DatabaseOptions } from "./client.js";
export * from "./schema.js";
export { withTenantTransaction } from "./tenant-transaction.js";
export type { TenantContext } from "./tenant-transaction.js";
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
export { createLeadLifecycleRepository } from "./lead-lifecycle-repository.js";
export type { LeadLifecycleRepository } from "./lead-lifecycle-repository.js";
export { createWorkspaceAccessRepository } from "./workspace-access-repository.js";

export {
  BusinessProfilePersistenceError,
  createBusinessProfileDraftRepository,
} from "./business-profile-repository.js";
export type {
  BusinessProfileDraftRepository,
  BusinessProfilePersistenceErrorCode,
} from "./business-profile-repository.js";
