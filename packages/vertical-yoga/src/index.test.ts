import assert from "node:assert/strict";
import test from "node:test";

import {
  BUSINESS_PROFILE_SECTIONS,
  createBusinessProfileDraft,
  validateBusinessProfilePlaybook,
} from "@novussync/domain";

import { YOGA_STUDIO_PLAYBOOK_V1 } from "./index.ts";

test("provides a valid, versioned yoga profile playbook with complete section coverage", () => {
  assert.doesNotThrow(() => validateBusinessProfilePlaybook(YOGA_STUDIO_PLAYBOOK_V1));
  assert.deepEqual(
    [...new Set(YOGA_STUDIO_PLAYBOOK_V1.fields.map((field) => field.section))].sort(),
    [...BUSINESS_PROFILE_SECTIONS].sort(),
  );
  assert.equal(new Set(YOGA_STUDIO_PLAYBOOK_V1.fields.map((field) => field.key)).size, 15);
});

test("contains requirements but never supplies business values as defaults", () => {
  const draft = createBusinessProfileDraft({
    profileId: "profile-yoga-test",
    tenant: { organizationId: "org-test", workspaceId: "workspace-test" },
    playbook: YOGA_STUDIO_PLAYBOOK_V1,
    now: "2026-07-18T17:40:00.000Z",
  });

  assert.deepEqual(draft.values, {});
  for (const field of YOGA_STUDIO_PLAYBOOK_V1.fields) {
    assert.equal("defaultValue" in field, false);
  }
});

test("keeps booking availability and medical advice outside profile truth", () => {
  const keys = YOGA_STUDIO_PLAYBOOK_V1.fields.map((field) => field.key);
  assert.equal(
    keys.some((key) => /availability|capacity|waitlist|medical_advice/.test(key)),
    false,
  );
});
