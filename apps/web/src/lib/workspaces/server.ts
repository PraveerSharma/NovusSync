import { randomUUID } from "node:crypto";

import { queryWorkspaceDirectory } from "@novussync/application";
import { createWorkspaceDirectoryRepository } from "@novussync/db";
import { createSupabaseSessionVerifier } from "@novussync/integrations";

import { getWebDatabase } from "../database/server";
import { getSupabasePublicConfig } from "../supabase/config";
import { createClient } from "../supabase/server";
import {
  createUnavailableWorkspaceDirectoryPageData,
  toWorkspaceDirectoryPageData,
  type WorkspaceDirectoryPageData,
} from "./page-data";

export async function loadVerifiedWorkspaceDirectoryPageData(): Promise<WorkspaceDirectoryPageData> {
  const supabase = await createClient();
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error || !session?.access_token) {
    return createUnavailableWorkspaceDirectoryPageData();
  }

  const database = getWebDatabase();
  const result = await queryWorkspaceDirectory(
    {
      accessToken: session.access_token,
      requestId: randomUUID(),
      now: new Date().toISOString(),
    },
    {
      sessionVerifier: createSupabaseSessionVerifier(getSupabasePublicConfig()),
      repository: createWorkspaceDirectoryRepository(database),
    },
  );

  return toWorkspaceDirectoryPageData(result);
}
