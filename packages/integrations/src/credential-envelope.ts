import type { AppEnvironment } from "@novussync/config/server";

export const TENANT_CREDENTIAL_KINDS = [
  "oauth-access-token",
  "oauth-refresh-token",
  "provider-api-key",
  "provider-client-secret",
  "webhook-secret",
  "signing-key",
] as const;

export type TenantCredentialKind = (typeof TENANT_CREDENTIAL_KINDS)[number];

export type CredentialEncryptionContext = Readonly<{
  application: "NovusSync";
  environment: AppEnvironment;
  workspaceId: string;
  provider: string;
  connectionId: string;
  credentialVersion: string;
}>;

export type EncryptedCredentialEnvelope = Readonly<{
  format: "aws-encryption-sdk-message-v1";
  ciphertextBase64: string;
  kmsKeyId: string;
  credentialKind: TenantCredentialKind;
  context: CredentialEncryptionContext;
  createdAt: string;
}>;

export type EncryptCredentialRequest = Readonly<{
  plaintext: Uint8Array;
  credentialKind: TenantCredentialKind;
  context: CredentialEncryptionContext;
  correlationId: string;
}>;

export type UseCredentialRequest = Readonly<{
  envelope: EncryptedCredentialEnvelope;
  expectedContext: CredentialEncryptionContext;
  purpose: "immediate-provider-call";
  correlationId: string;
}>;

export interface CredentialEnvelopePort {
  encrypt(request: EncryptCredentialRequest): Promise<EncryptedCredentialEnvelope>;

  withDecryptedCredentialForProviderCall<Result>(
    request: UseCredentialRequest,
    use: (plaintext: Uint8Array) => Promise<Result>,
  ): Promise<Result>;
}
