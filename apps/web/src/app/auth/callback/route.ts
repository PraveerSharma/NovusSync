import { NextResponse, type NextRequest } from "next/server";

import { getAuthAccessMode } from "../../../lib/auth/runtime";
import { safeAuthDestination, signInLocation } from "../../../lib/auth/redirect";
import { createClient } from "../../../lib/supabase/server";

export async function GET(request: NextRequest) {
  const next = safeAuthDestination(request.nextUrl.searchParams.get("next"));
  const code = request.nextUrl.searchParams.get("code");

  if (getAuthAccessMode() === "invite_only" && code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(new URL(next, request.url), 303);
    }
  }

  return NextResponse.redirect(new URL(signInLocation(next, "link-error"), request.url), 303);
}
