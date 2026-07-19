import {
  createSyntheticWorkspaceDirectoryPageData,
  createUnavailableWorkspaceDirectoryPageData,
} from "../../lib/workspaces/page-data";
import { loadVerifiedWorkspaceDirectoryPageData } from "../../lib/workspaces/server";
import { getAuthAccessMode } from "../../lib/auth/runtime";
import { WorkspaceDirectory } from "./workspace-directory";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function WorkspacesPage() {
  const data =
    getAuthAccessMode() === "disabled"
      ? createSyntheticWorkspaceDirectoryPageData()
      : await loadVerifiedWorkspaceDirectoryPageData().catch(() =>
          createUnavailableWorkspaceDirectoryPageData(),
        );

  return <WorkspaceDirectory data={data} />;
}
