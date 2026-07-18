import assert from "node:assert/strict";
import test from "node:test";

import {
  createSupabaseSessionVerifier,
  SessionVerificationError,
} from "./supabase-session-verifier.ts";

const options = Object.freeze({
  projectUrl: "https://synthetic.supabase.co",
  publishableKey: "sb_publishable_synthetic_only",
});

const validClaims = Object.freeze({
  sub: "00000000-0000-4000-8000-000000000601",
  iss: "https://synthetic.supabase.co/auth/v1",
  aud: "authenticated",
  role: "authenticated",
  session_id: "00000000-0000-4000-8000-000000000701",
  aal: "aal2",
  iat: 1_784_369_600,
  exp: 1_784_376_800,
});

test("maps verified Supabase claims to the provider-neutral session principal", async () => {
  const verifier = createSupabaseSessionVerifier(options, {
    readClaims: async () => validClaims,
  });

  const principal = await verifier.verify("synthetic-access-token");
  assert.equal(principal.provider, "supabase");
  assert.equal(principal.subject, validClaims.sub);
  assert.equal(principal.assurance, "aal2");
  assert.equal(principal.sessionId, validClaims.session_id);
});

test("rejects claims from another issuer or a non-user role", async () => {
  for (const claims of [
    { ...validClaims, iss: "https://other.supabase.co/auth/v1" },
    { ...validClaims, role: "service_role" },
    { ...validClaims, aud: "service_role" },
  ]) {
    const verifier = createSupabaseSessionVerifier(options, {
      readClaims: async () => claims,
    });
    await assert.rejects(
      verifier.verify("synthetic-access-token"),
      (error: unknown) => error instanceof SessionVerificationError,
    );
  }
});

test("normalizes provider failures without exposing token or upstream details", async () => {
  const verifier = createSupabaseSessionVerifier(options, {
    readClaims: async () => {
      throw new Error("upstream-secret-canary");
    },
  });

  await assert.rejects(verifier.verify("access-token-canary"), (error: unknown) => {
    assert.ok(error instanceof SessionVerificationError);
    assert.equal(error.message.includes("canary"), false);
    return true;
  });
});

test("rejects non-HTTPS project configuration before creating a provider client", () => {
  assert.throws(
    () =>
      createSupabaseSessionVerifier(
        { ...options, projectUrl: "http://synthetic.supabase.co" },
        { readClaims: async () => validClaims },
      ),
    /HTTPS/,
  );
});
