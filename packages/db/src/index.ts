export { createDatabase } from "./client.js";
export type { Database, DatabaseHandle, DatabaseOptions } from "./client.js";
export * from "./schema.js";
export { withTenantTransaction } from "./tenant-transaction.js";
export type { TenantContext } from "./tenant-transaction.js";
export {
  createLeadLifecycleRepository,
  LeadLifecyclePersistenceError,
} from "./lead-lifecycle-repository.js";
export type {
  CreateLeadLifecycleRecord,
  LeadLifecycleActor,
  LeadLifecyclePersistenceErrorCode,
  LeadLifecycleRecord,
  LeadLifecycleRepository,
  LeadLifecycleTransitionRecord,
  TransitionLeadLifecycleRecord,
} from "./lead-lifecycle-repository.js";
export { createWorkspaceAccessRepository } from "./workspace-access-repository.js";
