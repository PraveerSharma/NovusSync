import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  MAX_SOURCE_CAPTURE_BYTES,
  approveBookingRouteMetadataSource,
  approveBusinessWebsiteSource,
  type ApprovedBusinessSource,
} from "@novussync/domain";

import {
  SourceProposalAccessError,
  prepareSourceProposalBatch,
  type SourceExtractionResult,
  type SourceExtractorPort,
} from "./source-proposal-service.ts";

const approvedAt = "2026-07-18T08:00:00.000Z";
const requestedAt = "2026-07-18T08:05:00.000Z";
const actor = {
  actorId: "operator-1",
  tenantId: "tenant-1",
  role: "operator" as const,
  sessionExpiresAt: "2026-07-18T09:00:00.000Z",
};

const website = approveBusinessWebsiteSource({
  sourceId: "website-1",
  tenantId: "tenant-1",
  entryUrl: "https://studio.example.com/about",
  approval: { actorId: "owner-1", actorRole: "owner", approvedAt },
});

function successResult(
  source: ApprovedBusinessSource,
  overrides: Partial<SourceExtractionResult & { status: "success" }> = {},
): SourceExtractionResult {
  return {
    status: "success",
    batchId: "batch-1",
    captureId: "capture-1",
    sourceLocation:
      source.kind === "business_website"
        ? source.entryUrl
        : `booking-route:${source.bookingRouteId}`,
    sourceReference: source.kind === "business_website" ? "primary-domain" : source.sourceReference,
    resolvedUrl: source.kind === "business_website" ? source.entryUrl : null,
    capturedAt: requestedAt,
    extractor: { id: "fixture-extractor", version: "1.0.0" },
    contentDigest: "sha256:fixture",
    contentBytes: 1_024,
    proposals: [
      {
        candidateId: "candidate-1",
        fieldKey: "business.summary",
        factTemplateVersion: "business-summary@1",
        value: "A welcoming independent studio.",
        allowedUseCases: ["profile_review"],
        confidence: 0.9,
        conflict: { kind: "none", detail: null },
      },
    ],
    ...overrides,
  };
}

function extractor(result: SourceExtractionResult): SourceExtractorPort {
  return { extract: async () => result };
}

const command = {
  requestId: "request-1",
  profileId: "profile-1",
  playbookVersion: "yoga-studio@1",
  source: website,
  allowedFieldKeys: ["business.summary"],
  requestedAt,
};

describe("prepareSourceProposalBatch", () => {
  it("prepares owner-reviewable proposals without granting authority", async () => {
    const result = await prepareSourceProposalBatch(
      extractor(successResult(website)),
      actor,
      command,
    );

    assert.equal(result.status, "ready_for_owner_review");
    if (result.status === "ready_for_owner_review") {
      assert.equal(result.batch.candidates[0]?.authority, "provisional");
      assert.equal(result.batch.candidates[0]?.verificationStatus, "unverified");
      assert.equal(result.batch.capture.extractor.version, "1.0.0");
    }
  });

  it("fails before extraction when the source belongs to another tenant", async () => {
    let calls = 0;
    const port: SourceExtractorPort = {
      extract: async () => {
        calls += 1;
        return successResult(website);
      },
    };

    await assert.rejects(
      () => prepareSourceProposalBatch(port, { ...actor, tenantId: "tenant-other" }, command),
      (error: unknown) =>
        error instanceof SourceProposalAccessError && error.code === "TENANT_MISMATCH",
    );
    assert.equal(calls, 0);
  });

  it("returns safe failures for parser errors, redirects and oversized captures", async () => {
    const parser = await prepareSourceProposalBatch(
      { extract: async () => Promise.reject(new Error("raw parser detail")) },
      actor,
      command,
    );
    assert.equal(parser.status, "failed");
    if (parser.status === "failed") {
      assert.equal(parser.code, "PARSER_ERROR");
      assert.equal(parser.safeMessage.includes("raw parser detail"), false);
    }

    const redirect = await prepareSourceProposalBatch(
      extractor(
        successResult(website, {
          resolvedUrl: "https://unapproved.example.net/about",
          sourceLocation: "https://unapproved.example.net/about",
        }),
      ),
      actor,
      command,
    );
    assert.equal(redirect.status, "failed");
    if (redirect.status === "failed") {
      assert.equal(redirect.code, "REDIRECT_NOT_ALLOWED");
    }

    const oversized = await prepareSourceProposalBatch(
      extractor(
        successResult(website, {
          contentBytes: MAX_SOURCE_CAPTURE_BYTES + 1,
        }),
      ),
      actor,
      command,
    );
    assert.equal(oversized.status, "failed");
    if (oversized.status === "failed") {
      assert.equal(oversized.code, "CONTENT_TOO_LARGE");
    }
  });

  it("fails closed for duplicate and unapproved extractor fields", async () => {
    const initialOutput = successResult(website);
    assert.equal(initialOutput.status, "success");
    const initialProposals = initialOutput.status === "success" ? initialOutput.proposals : [];
    const duplicateOutput = successResult(website, {
      proposals: [
        ...initialProposals,
        {
          candidateId: "candidate-2",
          fieldKey: "business.summary",
          factTemplateVersion: "business-summary@1",
          value: "A duplicate summary.",
          allowedUseCases: ["profile_review"],
          confidence: 0.7,
          conflict: { kind: "source_disagreement", detail: "Two values found." },
        },
      ],
    });
    const duplicate = await prepareSourceProposalBatch(extractor(duplicateOutput), actor, command);
    assert.equal(duplicate.status, "failed");
    if (duplicate.status === "failed") {
      assert.equal(duplicate.code, "DUPLICATE_SOURCE_OUTPUT");
    }

    const unapproved = await prepareSourceProposalBatch(
      extractor(
        successResult(website, {
          proposals: [
            {
              candidateId: "candidate-private",
              fieldKey: "private.rawConversation",
              factTemplateVersion: "not-approved@1",
              value: "not permitted",
              allowedUseCases: ["profile_review"],
              confidence: 1,
              conflict: { kind: "none", detail: null },
            },
          ],
        }),
      ),
      actor,
      command,
    );
    assert.equal(unapproved.status, "failed");
    if (unapproved.status === "failed") {
      assert.equal(unapproved.code, "PARSER_ERROR");
    }
  });

  it("keeps stale labels visible but rejects provider-owned booking facts", async () => {
    const booking = approveBookingRouteMetadataSource({
      sourceId: "booking-source-1",
      tenantId: "tenant-1",
      bookingRouteId: "intro-route",
      routeLabel: "Intro class",
      sourceReference: "booking-route:intro-route",
      approval: { actorId: "owner-1", actorRole: "owner", approvedAt },
    });
    const bookingCommand = {
      ...command,
      source: booking,
      allowedFieldKeys: ["booking.routeLabel", "booking.capacity"],
    };
    const stale = await prepareSourceProposalBatch(
      extractor(
        successResult(booking, {
          proposals: [
            {
              candidateId: "candidate-route-label",
              fieldKey: "booking.routeLabel",
              factTemplateVersion: "booking-route-label@1",
              value: "First class request",
              allowedUseCases: ["profile_review"],
              confidence: 0.72,
              conflict: {
                kind: "stale_source_label",
                detail: "The current profile uses another label.",
              },
            },
          ],
        }),
      ),
      actor,
      bookingCommand,
    );
    assert.equal(stale.status, "ready_for_owner_review");
    if (stale.status === "ready_for_owner_review") {
      assert.equal(stale.batch.candidates[0]?.conflict.kind, "stale_source_label");
    }

    const providerConflict = await prepareSourceProposalBatch(
      extractor(
        successResult(booking, {
          proposals: [
            {
              candidateId: "candidate-capacity",
              fieldKey: "booking.capacity",
              factTemplateVersion: "booking-capacity@1",
              value: 12,
              allowedUseCases: ["profile_review"],
              confidence: 0.99,
              conflict: { kind: "provider_conflict", detail: "Provider-owned." },
            },
          ],
        }),
      ),
      actor,
      bookingCommand,
    );
    assert.equal(providerConflict.status, "failed");
    if (providerConflict.status === "failed") {
      assert.equal(providerConflict.code, "PROVIDER_CONFLICT");
    }
  });
});
