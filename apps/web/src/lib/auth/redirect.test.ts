import assert from "node:assert/strict";
import { test } from "node:test";

import { safeAuthDestination, signInLocation } from "./redirect.ts";

test("allows the dashboard and preserves its local query and fragment", () => {
  assert.equal(
    safeAuthDestination("/dashboard?view=approvals#queue"),
    "/dashboard?view=approvals#queue",
  );
});

test("allows the protected business profile destination", () => {
  assert.equal(safeAuthDestination("/business-profile"), "/business-profile");
});

test("rejects external, protocol-relative, backslash, and unknown destinations", () => {
  for (const destination of [
    "https://example.com/dashboard",
    "//example.com/dashboard",
    "/\\example.com/dashboard",
    "/settings",
    "javascript:alert(1)",
  ]) {
    assert.equal(safeAuthDestination(destination), "/dashboard");
  }
});

test("constructs a local sign-in location without reflecting unsafe input", () => {
  assert.equal(
    signInLocation("https://example.com/dashboard", "link-error"),
    "/sign-in?next=%2Fdashboard&state=link-error",
  );
});
