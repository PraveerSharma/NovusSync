import { sql } from "drizzle-orm";

import type {
  WorkspaceDirectoryIdentityQuery,
  WorkspaceDirectoryProfile,
  WorkspaceDirectoryRecord,
  WorkspaceDirectoryRepositoryPort,
  WorkspaceDirectoryRole,
} from "@novussync/application";

import type { DatabaseHandle } from "./client.ts";

type WorkspaceDirectoryRow = {
  organization_id: string;
  organization_name: string;
  workspace_id: string;
  workspace_name: string;
  membership_role: string;
  profile_id: string | null;
  profile_display_name: string | null;
  playbook_id: string | null;
  playbook_version: number | null;
  draft_version: number | null;
  profile_updated_at: Date | string | null;
  approved_fact_count: number | string;
  last_verified_at: Date | string | null;
};

type MutableDirectoryRecord = {
  organizationId: string;
  organizationName: string;
  workspaceId: string;
  workspaceName: string;
  role: WorkspaceDirectoryRole;
  profiles: WorkspaceDirectoryProfile[];
};

export type WorkspaceDirectoryPersistenceErrorCode =
  "DIRECTORY_QUERY_INVALID" | "DIRECTORY_READ_FAILED" | "DIRECTORY_ROW_INVALID";

export class WorkspaceDirectoryPersistenceError extends Error {
  readonly code: WorkspaceDirectoryPersistenceErrorCode;

  constructor(code: WorkspaceDirectoryPersistenceErrorCode, message: string) {
    super(message);
    this.name = "WorkspaceDirectoryPersistenceError";
    this.code = code;
  }
}

export type WorkspaceDirectoryRepository = WorkspaceDirectoryRepositoryPort;

export function createWorkspaceDirectoryRepository(
  database: DatabaseHandle["db"],
): WorkspaceDirectoryRepository {
  return Object.freeze({
    async listAccessibleWorkspaces(
      query: WorkspaceDirectoryIdentityQuery,
    ): Promise<readonly WorkspaceDirectoryRecord[]> {
      validateQuery(query);

      let rows: WorkspaceDirectoryRow[];
      try {
        const result = await database.execute<WorkspaceDirectoryRow>(sql`
          select
            organization_id,
            organization_name,
            workspace_id,
            workspace_name,
            membership_role,
            profile_id,
            profile_display_name,
            playbook_id,
            playbook_version,
            draft_version,
            profile_updated_at,
            approved_fact_count,
            last_verified_at
          from app_private.list_workspace_directory(
            ${query.identityProvider},
            ${query.providerSubject},
            ${query.assurance}
          )
        `);
        rows = result.rows;
      } catch {
        throw new WorkspaceDirectoryPersistenceError(
          "DIRECTORY_READ_FAILED",
          "The workspace directory could not be loaded.",
        );
      }

      return mapRows(rows);
    },
  });
}

function mapRows(rows: readonly WorkspaceDirectoryRow[]): readonly WorkspaceDirectoryRecord[] {
  const records = new Map<string, MutableDirectoryRecord>();

  for (const row of rows) {
    const role = parseRole(row.membership_role);
    if (
      !row.organization_id ||
      !row.organization_name ||
      !row.workspace_id ||
      !row.workspace_name
    ) {
      throw invalidRow();
    }

    const key = row.organization_id + ":" + row.workspace_id;
    const existing = records.get(key);
    const record =
      existing ??
      ({
        organizationId: row.organization_id,
        organizationName: row.organization_name,
        workspaceId: row.workspace_id,
        workspaceName: row.workspace_name,
        role,
        profiles: [],
      } satisfies MutableDirectoryRecord);

    if (
      existing &&
      (existing.organizationName !== row.organization_name ||
        existing.workspaceName !== row.workspace_name ||
        existing.role !== role)
    ) {
      throw invalidRow();
    }

    if (!existing) {
      records.set(key, record);
    }

    if (row.profile_id === null) {
      continue;
    }

    if (
      row.profile_display_name === null ||
      row.playbook_id === null ||
      row.playbook_version === null ||
      row.draft_version === null ||
      row.profile_updated_at === null
    ) {
      throw invalidRow();
    }

    const approvedFactCount = Number(row.approved_fact_count);
    if (!Number.isSafeInteger(approvedFactCount) || approvedFactCount < 0) {
      throw invalidRow();
    }

    record.profiles.push(
      Object.freeze({
        profileId: row.profile_id,
        displayName: row.profile_display_name,
        playbookId: row.playbook_id,
        playbookVersion: Number(row.playbook_version),
        draftVersion: Number(row.draft_version),
        updatedAt: toIsoString(row.profile_updated_at),
        approvedFactCount,
        lastVerifiedAt: row.last_verified_at === null ? null : toIsoString(row.last_verified_at),
      }),
    );
  }

  return Object.freeze(
    Array.from(records.values(), (record) =>
      Object.freeze({
        organizationId: record.organizationId,
        organizationName: record.organizationName,
        workspaceId: record.workspaceId,
        workspaceName: record.workspaceName,
        role: record.role,
        profiles: Object.freeze(record.profiles),
      }),
    ),
  );
}

function validateQuery(query: WorkspaceDirectoryIdentityQuery): void {
  if (
    query.identityProvider !== "supabase" ||
    !query.providerSubject.trim() ||
    query.providerSubject.length > 255 ||
    (query.assurance !== "aal1" && query.assurance !== "aal2")
  ) {
    throw new WorkspaceDirectoryPersistenceError(
      "DIRECTORY_QUERY_INVALID",
      "The workspace directory query was invalid.",
    );
  }
}

function parseRole(value: string): WorkspaceDirectoryRole {
  if (value !== "owner" && value !== "staff") {
    throw invalidRow();
  }
  return value;
}

function toIsoString(value: Date | string): string {
  const parsed = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw invalidRow();
  }
  return parsed.toISOString();
}

function invalidRow(): WorkspaceDirectoryPersistenceError {
  return new WorkspaceDirectoryPersistenceError(
    "DIRECTORY_ROW_INVALID",
    "The workspace directory returned an invalid row.",
  );
}
