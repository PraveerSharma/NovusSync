import { randomUUID } from "node:crypto";

import {
  executeFactReverification,
  queryFactReverificationQueue,
  resolveAuthenticatedActor,
} from "@novussync/application";
import {
  createApprovedContextRepository,
  createFactReverificationRepository,
  createWorkspaceAccessRepository,
} from "@novussync/db";
import { createSupabaseSessionVerifier } from "@novussync/integrations";

import { getWebDatabase } from "../database/server";
import { createClient } from "../supabase/server";
import { getSupabasePublicConfig } from "../supabase/config";
import {
  toFactReverificationPageData,
  type FactReverificationPageData,
  type FactReverificationScope,
} from "./page-data";

export async function loadFactReverificationPageData(
  scope: FactReverificationScope,
  notice: "reverified" | "failed" | null,
): Promise<FactReverificationPageData> {
  const context = await resolveOwnerContext(scope);
  const queue = await queryFactReverificationQueue(
    context,
    { profileId: scope.profileId },
    { repository: createApprovedContextRepository(getWebDatabase()) },
  );
  return toFactReverificationPageData(queue, scope, "verified", notice);
}

export async function reverifyFact(
  input: Readonly<{
    scope: FactReverificationScope;
    factVersionId: string;
    expectedVersion: number;
    newFactVersionId: string;
    idempotencyKey: string;
  }>,
): Promise<void> {
  const context = await resolveOwnerContext(input.scope);
  const database = getWebDatabase();
  await executeFactReverification(
    context,
    {
      profileId: input.scope.profileId,
      factVersionId: input.factVersionId,
      expectedVersion: input.expectedVersion,
      newFactVersionId: input.newFactVersionId,
      idempotencyKey: input.idempotencyKey,
    },
    {
      readRepository: createApprovedContextRepository(database),
      writeRepository: createFactReverificationRepository(database),
    },
  );
}

async function resolveOwnerContext(scope: FactReverificationScope) {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getSession();
  const accessToken = data.session?.access_token;
  if (error || !accessToken) throw new Error("An authenticated session is required.");

  const requestId = randomUUID();
  const actorContext = await resolveAuthenticatedActor(
    {
      sessionVerifier: createSupabaseSessionVerifier(getSupabasePublicConfig()),
      workspaceAccess: createWorkspaceAccessRepository(getWebDatabase()),
    },
    {
      accessToken,
      tenant: { organizationId: scope.organizationId, workspaceId: scope.workspaceId },
      correlationId: requestId,
      origin: { type: "request", requestId },
      now: new Date().toISOString(),
    },
  );
  return Object.freeze({
    tenant: actorContext.tenant,
    actor: actorContext.actor,
    sessionExpiresAt: actorContext.session.expiresAt,
    requestId,
  });
}
