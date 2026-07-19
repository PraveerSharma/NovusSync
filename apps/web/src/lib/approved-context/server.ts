import { randomUUID } from "node:crypto";

import { queryApprovedContext, resolveAuthenticatedActor } from "@novussync/application";
import { createApprovedContextRepository, createWorkspaceAccessRepository } from "@novussync/db";
import { createSupabaseSessionVerifier } from "@novussync/integrations";

import { getWebDatabase } from "../database/server";
import { createClient } from "../supabase/server";
import { getSupabasePublicConfig } from "../supabase/config";
import {
  APPROVED_CONTEXT_FIELD_KEYS,
  createVerifiedApprovedContextPageData,
  toDomainApprovedContextUseCase,
  type ApprovedContextReadyPageData,
  type ApprovedContextScope,
  type ApprovedContextUiUseCase,
} from "./page-data";

export async function loadVerifiedApprovedContextPageData(
  scope: ApprovedContextScope,
  useCase: ApprovedContextUiUseCase,
): Promise<ApprovedContextReadyPageData> {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getSession();
  const accessToken = data.session?.access_token;
  if (error || !accessToken) throw new Error("An authenticated session is required.");

  const requestId = randomUUID();
  const now = new Date().toISOString();
  const database = getWebDatabase();
  const actorContext = await resolveAuthenticatedActor(
    {
      sessionVerifier: createSupabaseSessionVerifier(getSupabasePublicConfig()),
      workspaceAccess: createWorkspaceAccessRepository(database),
    },
    {
      accessToken,
      tenant: { organizationId: scope.organizationId, workspaceId: scope.workspaceId },
      correlationId: requestId,
      origin: { type: "request", requestId },
      now,
    },
  );
  const snapshot = await queryApprovedContext(
    {
      tenant: actorContext.tenant,
      actor: actorContext.actor,
      sessionExpiresAt: actorContext.session.expiresAt,
      requestId,
    },
    {
      tenant: actorContext.tenant,
      profileId: scope.profileId,
      useCase: toDomainApprovedContextUseCase(useCase),
      fieldKeys: APPROVED_CONTEXT_FIELD_KEYS,
    },
    { repository: createApprovedContextRepository(database) },
  );
  return createVerifiedApprovedContextPageData(snapshot, scope, useCase);
}
