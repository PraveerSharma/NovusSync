import { sql } from "drizzle-orm";

import type {
  WorkspaceAccessQuery,
  WorkspaceAccessRecord,
  WorkspaceAccessRepositoryPort,
} from "@novussync/application";

import type { Database } from "./client.js";

type WorkspaceAccessRow = {
  actor_id: string;
  actor_type: string;
  role: string;
  access_kind: string;
  support_grant_id: string | null;
};

export function createWorkspaceAccessRepository(database: Database): WorkspaceAccessRepositoryPort {
  return Object.freeze({
    async resolveWorkspaceAccess(query: WorkspaceAccessQuery) {
      assertQuery(query);
      const result = await database.execute<WorkspaceAccessRow>(sql`
        select actor_id, actor_type, role, access_kind, support_grant_id
        from app_private.resolve_workspace_access(
          ${query.identityProvider}::text,
          ${query.providerSubject}::text,
          ${query.organizationId}::uuid,
          ${query.workspaceId}::uuid,
          ${query.assurance}::text
        )
      `);
      const row = result.rows[0];
      if (!row) {
        return null;
      }
      return mapRow(row);
    },
  });
}

function assertQuery(query: WorkspaceAccessQuery): void {
  if (
    query.identityProvider !== "supabase" ||
    !query.providerSubject.trim() ||
    !UUID_PATTERN.test(query.organizationId) ||
    !UUID_PATTERN.test(query.workspaceId) ||
    (query.assurance !== "aal1" && query.assurance !== "aal2")
  ) {
    throw new Error("Workspace access query is invalid");
  }
}

function mapRow(row: WorkspaceAccessRow): WorkspaceAccessRecord {
  if (
    row.actor_type !== "human" ||
    !["owner", "staff", "internal_operator"].includes(row.role) ||
    !["membership", "support_grant"].includes(row.access_kind)
  ) {
    throw new Error("Workspace access resolver returned an invalid authorization shape");
  }

  return Object.freeze({
    actorId: row.actor_id,
    actorType: row.actor_type,
    role: row.role as WorkspaceAccessRecord["role"],
    accessKind: row.access_kind as WorkspaceAccessRecord["accessKind"],
    ...(row.support_grant_id ? { supportGrantId: row.support_grant_id } : {}),
  });
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
