import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  MAX_SOURCE_CAPTURE_BYTES,
  SourceProposalError,
  approveBookingRouteMetadataSource,
  approveBusinessWebsiteSource,
  assertApprovedWebsiteRedirect,
  createFactCandidate,
  createSourceCapture,
  createSourceProposalBatch,
} from "./source-proposal.ts";

const approvedAt = "2026-07-18T08:00:00.000Z";
const capturedAt = "2026-07-18T08:05:00.000Z";

function websiteFixture() {
  const source = approveBusinessWebsiteSource({
    sourceId: "source-website-1",
    tenantId: "tenant-1",
    entryUrl: "https://studio.example.com/about#team",
    approval: { actorId: "owner-1", actorRole: "owner", approvedAt },
  });
  const capture = createSourceCapture({
    source,
    captureId: "capture-website-1",
    sourceLocation: "https://studio.example.com/about",
    sourceReference: "primary-domain",
    capturedAt,
    extractor: { id: "approved-html", version: "1.0.0" },
    contentDigest: "sha256:website-fixture",
    contentBytes: 2_048,
  });
  return { source, capture };
}

describe("approved business sources", () => {
  it("normalizes an owner-approved HTTPS origin", () => {
    const { source } = websiteFixture();
    assert.equal(source.approvedOrigin, "https://studio.example.com");
    assert.equal(source.entryUrl, "https://studio.example.com/about");
    assert.equal(source.approval.actorRole, "owner");
  });

  it("rejects unsafe URLs and cross-origin redirects", () => {
    assert.throws(
      () =>
        approveBusinessWebsiteSource({
          sourceId: "unsafe",
          tenantId: "tenant-1",
          entryUrl: "http://localhost:3000/private",
          approval: { actorId: "owner-1", actorRole: "owner", approvedAt },
        }),
      (error: unknown) => error instanceof SourceProposalError && error.code === "UNSAFE_URL",
    );

    const { source } = websiteFixture();
    assert.throws(
      () => assertApprovedWebsiteRedirect(source, "https://elsewhere.example.net"),
      (error: unknown) =>
        error instanceof SourceProposalError && error.code === "REDIRECT_NOT_ALLOWED",
    );
  });

  it("rejects captures above the bounded size", () => {
    const { source } = websiteFixture();
    assert.throws(
      () =>
        createSourceCapture({
          source,
          captureId: "oversize",
          sourceLocation: source.entryUrl,
          sourceReference: "primary-domain",
          capturedAt,
          extractor: { id: "approved-html", version: "1.0.0" },
          contentDigest: "sha256:oversize",
          contentBytes: MAX_SOURCE_CAPTURE_BYTES + 1,
        }),
      (error: unknown) =>
        error instanceof SourceProposalError && error.code === "CONTENT_TOO_LARGE",
    );
  });
});

describe("fact candidates", () => {
  it("keeps every extracted value provisional with complete provenance", () => {
    const { source, capture } = websiteFixture();
    const candidate = createFactCandidate({
      candidateId: "candidate-1",
      profileId: "profile-1",
      source,
      capture,
      fieldKey: "business.summary",
      factTemplateVersion: "business-summary@1",
      playbookVersion: "yoga-studio@1",
      value: "Beginner-friendly movement classes in Bengaluru.",
      allowedUseCases: ["profile_review"],
      confidence: 0.91,
      conflict: { kind: "none", detail: null },
      createdAt: capturedAt,
    });
    const batch = createSourceProposalBatch({
      batchId: "batch-1",
      profileId: "profile-1",
      source,
      capture,
      candidates: [candidate],
      createdAt: capturedAt,
    });

    assert.equal(candidate.authority, "provisional");
    assert.equal(candidate.verificationStatus, "unverified");
    assert.equal(candidate.provenance.captureId, capture.captureId);
    assert.equal(candidate.provenance.extractor.version, "1.0.0");
    assert.equal(batch.status, "requires_owner_review");
  });

  it("rejects duplicate fields from one source capture", () => {
    const { source, capture } = websiteFixture();
    const makeCandidate = (candidateId: string) =>
      createFactCandidate({
        candidateId,
        profileId: "profile-1",
        source,
        capture,
        fieldKey: "business.summary",
        factTemplateVersion: "business-summary@1",
        playbookVersion: "yoga-studio@1",
        value: "A summary",
        allowedUseCases: ["profile_review"],
        confidence: 0.8,
        conflict: { kind: "none", detail: null },
        createdAt: capturedAt,
      });

    assert.throws(
      () =>
        createSourceProposalBatch({
          batchId: "batch-duplicate",
          profileId: "profile-1",
          source,
          capture,
          candidates: [makeCandidate("candidate-1"), makeCandidate("candidate-2")],
          createdAt: capturedAt,
        }),
      (error: unknown) =>
        error instanceof SourceProposalError && error.code === "DUPLICATE_CANDIDATE",
    );
  });

  it("preserves stale booking labels as visible conflicts", () => {
    const source = approveBookingRouteMetadataSource({
      sourceId: "source-booking-1",
      tenantId: "tenant-1",
      bookingRouteId: "route-intro",
      routeLabel: "Intro class",
      sourceReference: "booking-route:route-intro",
      approval: { actorId: "owner-1", actorRole: "owner", approvedAt },
    });
    const capture = createSourceCapture({
      source,
      captureId: "capture-booking-1",
      sourceLocation: "booking-route:route-intro",
      sourceReference: source.sourceReference,
      capturedAt,
      extractor: { id: "booking-metadata", version: "1.0.0" },
      contentDigest: "sha256:booking-fixture",
      contentBytes: 512,
    });
    const candidate = createFactCandidate({
      candidateId: "candidate-booking-label",
      profileId: "profile-1",
      source,
      capture,
      fieldKey: "booking.routeLabel",
      factTemplateVersion: "booking-route-label@1",
      playbookVersion: "yoga-studio@1",
      value: "First class request",
      allowedUseCases: ["profile_review"],
      confidence: 0.72,
      conflict: {
        kind: "stale_source_label",
        detail: "The profile and provider labels differ.",
      },
      createdAt: capturedAt,
    });

    assert.equal(candidate.conflict.kind, "stale_source_label");
    assert.equal(candidate.authority, "provisional");
  });
});
