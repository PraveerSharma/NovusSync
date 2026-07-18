import { NextResponse, type NextRequest } from "next/server";

import { getAuthAccessMode } from "../../../lib/auth/runtime";
import { signInLocation } from "../../../lib/auth/redirect";
import { createClient } from "../../../lib/supabase/server";

export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (origin && origin !== request.nextUrl.origin) {
    return new NextResponse(null, { status: 403 });
  }

  if (getAuthAccessMode() === "invite_only") {
    const supabase = await createClient();
    await supabase.auth.signOut({ scope: "local" });
  }

  return NextResponse.redirect(new URL(signInLocation("/dashboard"), request.url), 303);
}

export function GET() {
  return new NextResponse(null, {
    status: 405,
    headers: { Allow: "POST" },
  });
}
