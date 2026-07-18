export type ManualAction = "approved" | "queued" | "denied";

export type IntegrationReceipt = {
  id: string;
  action: ManualAction;
  metadata: Record<string, unknown>;
};

export {
  createSupabaseSessionVerifier,
  SessionVerificationError,
} from "./supabase-session-verifier.ts";
export type {
  SupabaseSessionVerifierDependencies,
  SupabaseSessionVerifierOptions,
} from "./supabase-session-verifier.ts";

export { TENANT_CREDENTIAL_KINDS } from "./credential-envelope.ts";
export type {
  CredentialEncryptionContext,
  CredentialEnvelopePort,
  EncryptedCredentialEnvelope,
  EncryptCredentialRequest,
  TenantCredentialKind,
  UseCredentialRequest,
} from "./credential-envelope.ts";
