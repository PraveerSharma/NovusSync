import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  classifyFactFreshness,
  FACT_FRESHNESS_POLICY_VERSION,
  resolveFactFreshness,
} from "./fact-freshness.ts";

describe("fact freshness policy", () => {
  it("applies one conservative policy to the five time-sensitive fact families", () => {
    const cases = [
      ["offer.price", "price"],
      ["offer.introductoryOffer", "offer"],
      ["booking.routeLabel", "booking_route"],
      ["membership.refundPolicy", "policy"],
      ["claims.healthBoundary", "claim"],
    ] as const;

    for (const [fieldKey, category] of cases) {
      const rule = resolveFactFreshness(fieldKey, "2026-07-01T12:00:00.000Z");
      assert.equal(rule?.category, category);
      assert.equal(rule?.policyVersion, FACT_FRESHNESS_POLICY_VERSION);
      assert.equal(rule?.expiresAt, "2026-07-31T12:00:00.000Z");
    }
  });

  it("supports underscore playbook keys without making stable facts expire", () => {
    assert.equal(
      resolveFactFreshness("booking_route_url", "2026-07-01T12:00:00.000Z")?.category,
      "booking_route",
    );
    assert.equal(
      resolveFactFreshness("offer_price", "2026-07-01T12:00:00.000Z")?.category,
      "price",
    );
    assert.equal(resolveFactFreshness("business.name", "2026-07-01T12:00:00.000Z"), null);
    assert.equal(resolveFactFreshness("audience.primary", "2026-07-01T12:00:00.000Z"), null);
  });

  it("classifies exact expiry and the seven-day warning window deterministically", () => {
    assert.equal(
      classifyFactFreshness("2026-07-19T10:00:00.000Z", "2026-07-19T10:00:00.000Z"),
      "expired",
    );
    assert.equal(
      classifyFactFreshness("2026-07-25T10:00:00.000Z", "2026-07-19T10:00:00.000Z"),
      "due_soon",
    );
    assert.equal(
      classifyFactFreshness("2026-08-01T10:00:00.000Z", "2026-07-19T10:00:00.000Z"),
      "current",
    );
  });

  it("fails closed for malformed timestamps and warning windows", () => {
    assert.throws(() => resolveFactFreshness("offer.price", "not-a-date"));
    assert.throws(() => classifyFactFreshness("not-a-date", "2026-07-19T10:00:00.000Z"));
    assert.throws(() =>
      classifyFactFreshness("2026-07-20T10:00:00.000Z", "2026-07-19T10:00:00.000Z", -1),
    );
  });
});
