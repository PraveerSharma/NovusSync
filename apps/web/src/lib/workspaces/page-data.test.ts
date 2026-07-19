import assert from "node:assert/strict";
import test from "node:test";

import {
  buildApprovedContextHref,
  createSyntheticWorkspaceDirectoryPageData,
  createUnavailableWorkspaceDirectoryPageData,
} from "./page-data.ts";

test("builds a scoped approved-context route without requiring a UUID profile ID", () => {
  const href = buildApprovedContextHref({
    organizationId: "10000000-0000-4000-8000-000000000001",
    workspaceId: "10000000-0000-4000-8000-000000000101",
    profileId: "northstar-yoga-primary",
  });
  const url = new URL(href, "https://novussync.example");

  assert.equal(url.pathname, "/business-profile/context");
  assert.equal(url.searchParams.get("profileId"), "northstar-yoga-primary");
  assert.equal(url.searchParams.get("useCase"), "campaign");
});

test("provides a visibly synthetic, minimized acceptance fixture", () => {
  const data = createSyntheticWorkspaceDirectoryPageData();
  assert.equal(data.status, "ready");

  if (data.status === "ready") {
    assert.equal(data.mode, "synthetic");
    assert.equal(data.workspaces.length, 1);
    assert.equal(data.workspaces[0]?.profiles.length, 1);
    assert.match(data.workspaces[0]?.profiles[0]?.contextHref ?? "", /useCase=campaign/);
  }
});

test("fails closed with no workspace identifiers when live retrieval is unavailable", () => {
  const data = createUnavailableWorkspaceDirectoryPageData();
  assert.deepEqual(data, {
    status: "unavailable",
    reason:
      "Your verified workspace directory is temporarily unavailable. No unverified workspace data was shown.",
  });
});
