import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { getAuthAccessMode } from "../auth/runtime";
import { safeAuthDestination, signInLocation } from "../auth/redirect";
import { getSupabasePublicConfig } from "./config";

function isProtectedWorkspacePath(pathname: string): boolean {
  return (
    pathname === "/dashboard" ||
    pathname.startsWith("/dashboard/") ||
    pathname === "/workspaces" ||
    pathname.startsWith("/workspaces/") ||
    pathname === "/business-profile" ||
    pathname.startsWith("/business-profile/")
  );
}

function redirectWithSessionCookies(
  request: NextRequest,
  sessionResponse: NextResponse,
  location: string,
): NextResponse {
  const destination = request.nextUrl.clone();
  const parsedLocation = new URL(location, destination.origin);
  destination.pathname = parsedLocation.pathname;
  destination.search = parsedLocation.search;
  destination.hash = parsedLocation.hash;

  const response = NextResponse.redirect(destination);
  sessionResponse.cookies.getAll().forEach((cookie) => response.cookies.set(cookie));

  for (const header of ["cache-control", "expires", "pragma"]) {
    const value = sessionResponse.headers.get(header);
    if (value) {
      response.headers.set(header, value);
    }
  }

  return response;
}

export async function updateSession(request: NextRequest): Promise<NextResponse> {
  if (getAuthAccessMode() === "disabled") {
    return NextResponse.next({ request });
  }

  let supabaseResponse = NextResponse.next({ request });
  const config = getSupabasePublicConfig();
  const supabase = createServerClient(config.projectUrl, config.publishableKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options),
        );
        Object.entries(headers).forEach(([key, value]) => supabaseResponse.headers.set(key, value));
      },
    },
  });

  const { data } = await supabase.auth.getClaims();
  const isAuthenticated = Boolean(data?.claims?.sub);
  const pathname = request.nextUrl.pathname;

  if (!isAuthenticated && isProtectedWorkspacePath(pathname)) {
    const next = safeAuthDestination(`${pathname}${request.nextUrl.search}`);
    return redirectWithSessionCookies(request, supabaseResponse, signInLocation(next));
  }

  if (isAuthenticated && pathname === "/sign-in") {
    return redirectWithSessionCookies(
      request,
      supabaseResponse,
      safeAuthDestination(request.nextUrl.searchParams.get("next")),
    );
  }

  return supabaseResponse;
}
