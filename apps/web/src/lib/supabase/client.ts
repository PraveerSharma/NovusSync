"use client";

import { createBrowserClient } from "@supabase/ssr";

import { getSupabasePublicConfig } from "./config";

export function createClient() {
  const config = getSupabasePublicConfig();
  return createBrowserClient(config.projectUrl, config.publishableKey);
}
