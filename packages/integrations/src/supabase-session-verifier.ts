import { createClient } from "@supabase/supabase-js";

import type {
  AuthenticationAssurance,
  SessionVerifierPort,
  VerifiedSessionPrincipal,
} from "@novussync/application";

export type SupabaseSessionVerifierOptions = Readonly<{
  projectUrl: string;
  publishableKey: string;
}>;

export type SupabaseSessionVerifierDependencies = Readonly<{
  readClaims(accessToken: string): Promise<unknown>;
}>;

export class SessionVerificationError extends Error {
  readonly code = "SESSION_INVALID" as const;

  constructor() {
    super("The Supabase session could not be verified.");
    this.name = "SessionVerificationError";
  }
}

export function createSupabaseSessionVerifier(
  options: SupabaseSessionVerifierOptions,
  dependencies?: SupabaseSessionVerifierDependencies,
): SessionVerifierPort {
  const projectUrl = parseProjectUrl(options.projectUrl);
  if (!options.publishableKey.trim()) {
    throw new Error("A Supabase publishable key is required");
  }

  const expectedIssuer = new URL("/auth/v1", projectUrl).toString().replace(/\/$/, "");
  const readClaims =
    dependencies?.readClaims ?? createClaimsReader(projectUrl, options.publishableKey);

  return Object.freeze({
    async verify(accessToken: string): Promise<VerifiedSessionPrincipal> {
      if (!accessToken.trim() || accessToken.length > 16_384) {
        throw new SessionVerificationError();
      }

      let claims: unknown;
      try {
        claims = await readClaims(accessToken);
      } catch {
        throw new SessionVerificationError();
      }

      return parseClaims(claims, expectedIssuer);
    },
  });
}

function createClaimsReader(projectUrl: URL, publishableKey: string) {
  const client = createClient(projectUrl.toString().replace(/\/$/, ""), publishableKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  });

  return async (accessToken: string): Promise<unknown> => {
    const { data, error } = await client.auth.getClaims(accessToken);
    if (error || !data?.claims) {
      throw new SessionVerificationError();
    }
    return data.claims;
  };
}

function parseProjectUrl(value: string): URL {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error("Supabase project URL must be a valid HTTPS URL");
  }
  if (url.protocol !== "https:") {
    throw new Error("Supabase project URL must use HTTPS");
  }
  return url;
}

function parseClaims(value: unknown, expectedIssuer: string): VerifiedSessionPrincipal {
  if (!isRecord(value)) {
    throw new SessionVerificationError();
  }

  const subject = readString(value, "sub");
  const issuer = readString(value, "iss");
  const role = readString(value, "role");
  const sessionId = readString(value, "session_id");
  const assurance = readAssurance(value.aal);
  const issuedAt = readNumericDate(value.iat);
  const expiresAt = readNumericDate(value.exp);
  const audience = readAudience(value.aud);

  if (
    !UUID_PATTERN.test(subject) ||
    !UUID_PATTERN.test(sessionId) ||
    issuer !== expectedIssuer ||
    role !== "authenticated" ||
    !audience.includes("authenticated")
  ) {
    throw new SessionVerificationError();
  }

  return Object.freeze({
    provider: "supabase" as const,
    subject,
    sessionId,
    assurance,
    issuedAt: new Date(issuedAt * 1000).toISOString(),
    expiresAt: new Date(expiresAt * 1000).toISOString(),
  });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readString(value: Record<string, unknown>, key: string): string {
  const candidate = value[key];
  if (typeof candidate !== "string" || !candidate.trim()) {
    throw new SessionVerificationError();
  }
  return candidate;
}

function readAssurance(value: unknown): AuthenticationAssurance {
  if (value !== "aal1" && value !== "aal2") {
    throw new SessionVerificationError();
  }
  return value;
}

function readNumericDate(value: unknown): number {
  if (typeof value !== "number" || !Number.isSafeInteger(value) || value <= 0) {
    throw new SessionVerificationError();
  }
  return value;
}

function readAudience(value: unknown): string[] {
  if (typeof value === "string") {
    return [value];
  }
  if (Array.isArray(value) && value.every((item) => typeof item === "string")) {
    return value;
  }
  throw new SessionVerificationError();
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
