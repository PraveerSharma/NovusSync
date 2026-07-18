import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";

import { getAuthAccessMode } from "../../../lib/auth/runtime";
import { safeAuthDestination, signInLocation } from "../../../lib/auth/redirect";
import { createClient } from "../../../lib/supabase/server";

const ALLOWED_EMAIL_OTP_TYPES = new Set<EmailOtpType>(["email", "invite", "magiclink"]);

function isAllowedOtpType(value: string | null): value is EmailOtpType {
  return Boolean(value && ALLOWED_EMAIL_OTP_TYPES.has(value as EmailOtpType));
}

export async function GET(request: NextRequest) {
  const next = safeAuthDestination(request.nextUrl.searchParams.get("next"));
  const tokenHash = request.nextUrl.searchParams.get("token_hash");
  const type = request.nextUrl.searchParams.get("type");

  if (getAuthAccessMode() === "invite_only" && tokenHash && isAllowedOtpType(type)) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
    if (!error) {
      return NextResponse.redirect(new URL(next, request.url), 303);
    }
  }

  return NextResponse.redirect(new URL(signInLocation(next, "link-error"), request.url), 303);
}
