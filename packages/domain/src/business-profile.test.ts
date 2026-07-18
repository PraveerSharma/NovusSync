import assert from "node:assert/strict";
import test from "node:test";

import {
  BusinessProfileError,
  BUSINESS_PROFILE_SECTIONS,
  createBusinessProfileDraft,
  getBusinessProfileCompletion,
  restoreBusinessProfileDraft,
  reviseBusinessProfileDraft,
  validateBusinessProfileDraft,
  type BusinessProfilePlaybook,
} from "./business-profile.ts";

const playbook: BusinessProfilePlaybook = {
  id: "test-business-v1",
  version: 1,
  businessType: "Test business",
  locale: "en",
  fields: BUSINESS_PROFILE_SECTIONS.map((section) => ({
    key: `${section}_field`,
    section,
    label: `${section} field`,
    description: `Required ${section} information.`,
    kind: section === "booking" ? "url" : section === "faqs" ? "list" : "short_text",
    required: true,
    ...(section === "faqs" ? { maxItems: 5, itemMaxLength: 200 } : { maxLength: 300 }),
  })),
};

const tenant = {
  organizationId: "org-test",
  workspaceId: "workspace-test",
} as const;

test("creates an immutable empty draft without inventing playbook defaults", () => {
  const draft = createBusinessProfileDraft({
    profileId: "profile-test",
    tenant,
    playbook,
    now: "2026-07-18T17:30:00.000Z",
  });

  assert.deepEqual(draft.values, {});
  assert.equal(draft.version, 1);
  assert.equal(Object.isFrozen(draft), true);
  assert.equal(Object.isFrozen(draft.values), true);
  assert.equal(validateBusinessProfileDraft(draft, playbook).length, 8);
  assert.deepEqual(getBusinessProfileCompletion(draft, playbook), {
    completedRequired: 0,
    totalRequired: 8,
    isComplete: false,
  });
});

test("revises known fields with optimistic versions and reports completion", () => {
  const initial = createBusinessProfileDraft({
    profileId: "profile-test",
    tenant,
    playbook,
    now: "2026-07-18T17:30:00.000Z",
  });
  const changes = Object.fromEntries(
    playbook.fields.map((field) => [
      field.key,
      field.kind === "list"
        ? ["Question | Answer"]
        : field.kind === "url"
          ? "https://example.test/book"
          : "Owner supplied value",
    ]),
  );

  const revised = reviseBusinessProfileDraft(initial, {
    expectedVersion: 1,
    playbook,
    changes,
    now: "2026-07-18T17:31:00.000Z",
  });

  assert.equal(revised.version, 2);
  assert.equal(validateBusinessProfileDraft(revised, playbook).length, 0);
  assert.equal(getBusinessProfileCompletion(revised, playbook).isComplete, true);
  assert.deepEqual(initial.values, {});
});

test("rejects unknown fields rather than silently extending the vertical contract", () => {
  assert.throws(
    () =>
      createBusinessProfileDraft({
        profileId: "profile-test",
        tenant,
        playbook,
        values: { invented_field: "not allowed" },
        now: "2026-07-18T17:30:00.000Z",
      }),
    (error: unknown) => error instanceof BusinessProfileError && error.code === "UNKNOWN_FIELD",
  );
});

test("keeps invalid owner input visible as validation issues", () => {
  const draft = createBusinessProfileDraft({
    profileId: "profile-test",
    tenant,
    playbook,
    values: {
      booking_field: "http://unsafe.example.test/book",
      faqs_field: [""],
    },
    now: "2026-07-18T17:30:00.000Z",
  });

  assert.deepEqual(
    validateBusinessProfileDraft(draft, playbook)
      .map((issue) => issue.code)
      .sort(),
    [
      "EMPTY_LIST_ITEM",
      "INVALID_URL",
      "REQUIRED_FIELD_MISSING",
      "REQUIRED_FIELD_MISSING",
      "REQUIRED_FIELD_MISSING",
      "REQUIRED_FIELD_MISSING",
      "REQUIRED_FIELD_MISSING",
      "REQUIRED_FIELD_MISSING",
    ].sort(),
  );
});

test("rejects stale revisions and timestamp regressions", () => {
  const draft = createBusinessProfileDraft({
    profileId: "profile-test",
    tenant,
    playbook,
    now: "2026-07-18T17:30:00.000Z",
  });

  assert.throws(
    () =>
      reviseBusinessProfileDraft(draft, {
        expectedVersion: 2,
        playbook,
        changes: {},
        now: "2026-07-18T17:31:00.000Z",
      }),
    (error: unknown) => error instanceof BusinessProfileError && error.code === "VERSION_CONFLICT",
  );
  assert.throws(
    () =>
      reviseBusinessProfileDraft(draft, {
        expectedVersion: 1,
        playbook,
        changes: {},
        now: "2026-07-18T17:29:00.000Z",
      }),
    (error: unknown) =>
      error instanceof BusinessProfileError && error.code === "TIMESTAMP_REGRESSION",
  );
});

test("restores a persisted draft without weakening playbook validation", () => {
  const restored = restoreBusinessProfileDraft({
    profileId: "profile-test",
    tenant,
    playbook,
    values: { business_field: "Stored owner value" },
    version: 7,
    createdAt: "2026-07-18T17:30:00.000Z",
    updatedAt: "2026-07-18T17:37:00.000Z",
  });

  assert.equal(restored.version, 7);
  assert.equal(restored.values.business_field, "Stored owner value");
  assert.throws(
    () =>
      restoreBusinessProfileDraft({
        ...restored,
        playbook,
        values: { unknown_field: "not allowed" },
      }),
    (error: unknown) => error instanceof BusinessProfileError && error.code === "UNKNOWN_FIELD",
  );
});
