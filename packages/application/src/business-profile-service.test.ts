import assert from "node:assert/strict";
import test from "node:test";

import {
  BUSINESS_PROFILE_SECTIONS,
  type BusinessProfileDraft,
  type BusinessProfilePlaybook,
} from "@novussync/domain";

import type { AuthenticatedActorContext } from "./authorization.ts";
import {
  BusinessProfileApplicationError,
  createBusinessProfileDraftService,
  type BusinessProfileAuthorizationPort,
  type BusinessProfileDraftRepositoryPort,
} from "./business-profile-service.ts";

const playbook: BusinessProfilePlaybook = {
  id: "service-test-v1",
  version: 1,
  businessType: "Test business",
  locale: "en",
  fields: BUSINESS_PROFILE_SECTIONS.map((section) => ({
    key: `${section}_field`,
    section,
    label: `${section} field`,
    description: `${section} information.`,
    kind: "short_text",
    required: true,
    maxLength: 200,
  })),
};
const tenant = { organizationId: "org-test", workspaceId: "workspace-test" } as const;
const context = {} as AuthenticatedActorContext;

function createHarness(options: { authorized?: boolean } = {}) {
  const records = new Map<string, BusinessProfileDraft>();
  const calls = { authorization: 0, create: 0, revise: 0 };
  const authorization: BusinessProfileAuthorizationPort = {
    async authorize() {
      calls.authorization += 1;
      if (options.authorized === false) throw new Error("denied");
    },
  };
  const repository: BusinessProfileDraftRepositoryPort = {
    async findById(_context, _tenant, profileId) {
      return records.get(profileId) ?? null;
    },
    async create(_context, draft) {
      calls.create += 1;
      records.set(draft.profileId, draft);
      return draft;
    },
    async revise(_context, draft) {
      calls.revise += 1;
      records.set(draft.profileId, draft);
      return draft;
    },
  };
  const service = createBusinessProfileDraftService({
    authorization,
    repository,
    clock: () => "2026-07-18T17:40:00.000Z",
  });
  return { calls, records, service };
}

test("authorizes before creating an idempotent profile draft", async () => {
  const { calls, service } = createHarness();

  const draft = await service.create({
    context,
    tenant,
    profileId: "profile-test",
    playbook,
    idempotencyKey: "profile-create-001",
  });

  assert.equal(draft.version, 1);
  assert.deepEqual(draft.values, {});
  assert.deepEqual(calls, { authorization: 1, create: 1, revise: 0 });
});

test("does not touch the repository when authorization fails", async () => {
  const { calls, service } = createHarness({ authorized: false });

  await assert.rejects(
    service.create({
      context,
      tenant,
      profileId: "profile-test",
      playbook,
      idempotencyKey: "profile-create-001",
    }),
    /denied/,
  );
  assert.deepEqual(calls, { authorization: 1, create: 0, revise: 0 });
});

test("loads and revises the current draft through the domain contract", async () => {
  const { calls, service } = createHarness();
  await service.create({
    context,
    tenant,
    profileId: "profile-test",
    playbook,
    idempotencyKey: "profile-create-001",
  });

  const revised = await service.revise({
    context,
    tenant,
    profileId: "profile-test",
    playbook,
    expectedVersion: 1,
    changes: { business_field: "Owner supplied business" },
    idempotencyKey: "profile-revise-001",
  });

  assert.equal(revised.version, 2);
  assert.equal(revised.values.business_field, "Owner supplied business");
  assert.deepEqual(calls, { authorization: 2, create: 1, revise: 1 });
});

test("fails clearly when a profile draft does not exist", async () => {
  const { service } = createHarness();

  await assert.rejects(
    service.revise({
      context,
      tenant,
      profileId: "missing-profile",
      playbook,
      expectedVersion: 1,
      changes: {},
      idempotencyKey: "profile-revise-001",
    }),
    (error: unknown) =>
      error instanceof BusinessProfileApplicationError && error.code === "PROFILE_NOT_FOUND",
  );
});

test("rejects malformed idempotency keys before authorization", async () => {
  const { calls, service } = createHarness();

  await assert.rejects(
    service.create({
      context,
      tenant,
      profileId: "profile-test",
      playbook,
      idempotencyKey: "short",
    }),
    (error: unknown) =>
      error instanceof BusinessProfileApplicationError && error.code === "INVALID_IDEMPOTENCY_KEY",
  );
  assert.deepEqual(calls, { authorization: 0, create: 0, revise: 0 });
});
