import assert from "node:assert/strict";
import test from "node:test";

import {
  buildFactReverificationHref,
  createSyntheticFactReverificationPageData,
  parseFactReverificationScope,
} from "./page-data.ts";

test("parses only tenant-scoped, safe fact-reverification routes", () => {
  const scope = parseFactReverificationScope({
    organizationId: "10000000-0000-4000-8000-000000000001",
    workspaceId: "10000000-0000-4000-8000-000000000101",
    profileId: "northstar-yoga-primary",
  });
  assert.ok(scope);
  assert.equal(
    new URL(buildFactReverificationHref(scope), "https://novussync.example").pathname,
    "/business-profile/reverification",
  );
  assert.equal(
    parseFactReverificationScope({
      organizationId: "not-a-uuid",
      workspaceId: "10000000-0000-4000-8000-000000000101",
      profileId: "northstar-yoga-primary",
    }),
    null,
  );
});

test("provides a visibly synthetic queue with all freshness states", () => {
  const data = createSyntheticFactReverificationPageData();
  assert.equal(data.status, "ready");
  if (data.status !== "ready") return;
  assert.equal(data.mode, "synthetic");
  assert.equal(data.expiredCount, 1);
  assert.equal(data.dueSoonCount, 1);
  assert.deepEqual(
    data.items.map((item) => item.status),
    ["expired", "due_soon", "current"],
  );
});
