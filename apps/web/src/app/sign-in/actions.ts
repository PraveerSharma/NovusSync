"use server";

import { loadServerConfig } from "@novussync/config/server";
import { redirect } from "next/navigation";

import { getAuthAccessMode } from "../../lib/auth/runtime";
import { safeAuthDestination, signInLocation } from "../../lib/auth/redirect";
import { createClient } from "../../lib/supabase/server";

function normalizeEmail(value: FormDataEntryValue | null): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const email = value.trim().toLowerCase();
  if (email.length < 3 || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return null;
  }

  return email;
}

export async function requestMagicLink(formData: FormData): Promise<never> {
  const next = safeAuthDestination(formData.get("next")?.toString());
  if (getAuthAccessMode() !== "invite_only") {
    redirect(signInLocation(next, "unavailable"));
  }

  const email = normalizeEmail(formData.get("email"));
  if (!email) {
    redirect(signInLocation(next, "invalid-email"));
  }

  const config = loadServerConfig(process.env);
  const callbackUrl = new URL("/auth/callback", config.runtime.appBaseUrl);
  callbackUrl.searchParams.set("next", next);

  const supabase = await createClient();
  await supabase.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: false,
      emailRedirectTo: callbackUrl.toString(),
    },
  });

  // Use one response for registered and unregistered addresses to resist account enumeration.
  redirect(signInLocation(next, "check-email"));
}
