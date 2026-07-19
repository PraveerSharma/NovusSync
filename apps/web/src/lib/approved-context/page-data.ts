import type { ApprovedContextSnapshot } from "@novussync/application";
import type { BusinessProfileSection } from "@novussync/domain";
import { YOGA_STUDIO_PLAYBOOK_V1 } from "@novussync/vertical-yoga";

export type ApprovedContextUiUseCase = "campaign" | "concierge";
export type ApprovedContextViewState = "usable" | "blocked" | "review";

export type ApprovedContextScope = Readonly<{
  organizationId: string;
  workspaceId: string;
  profileId: string;
}>;

export type ApprovedContextSearchParams = Readonly<
  Record<string, string | readonly string[] | undefined>
>;

export interface ApprovedContextFactView {
  readonly id: string;
  readonly fieldKey: string;
  readonly label: string;
  readonly group: string;
  readonly state: ApprovedContextViewState;
  readonly note: string;
  readonly reason?: string;
  readonly value?: string;
  readonly version?: number;
  readonly source?: string;
  readonly verifiedAt?: string;
  readonly expiresAt?: string;
}

export interface ApprovedContextReadyPageData {
  readonly status: "ready";
  readonly sourceMode: "synthetic" | "verified";
  readonly useCase: ApprovedContextUiUseCase;
  readonly eyebrow: string;
  readonly snapshotId: string;
  readonly asOf: string;
  readonly facts: readonly ApprovedContextFactView[];
  readonly switchUrls: Readonly<Record<ApprovedContextUiUseCase, string>>;
  readonly notice: string;
}

export interface ApprovedContextUnavailablePageData {
  readonly status: "unavailable";
  readonly sourceMode: "verified";
  readonly useCase: ApprovedContextUiUseCase;
  readonly reason: "scope_required" | "temporarily_unavailable";
}

export type ApprovedContextPageData =
  ApprovedContextReadyPageData | ApprovedContextUnavailablePageData;

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const PROFILE_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/;

const SECTION_LABELS: Record<BusinessProfileSection, string> = {
  business: "Business",
  offer: "Offer",
  audience: "Audience",
  voice: "Voice",
  faqs: "FAQs",
  claims: "Claims",
  restrictions: "Restrictions",
  booking: "Booking",
};

const FIELD_DEFINITIONS: ReadonlyMap<string, Readonly<{ label: string; group: string }>> = new Map(
  YOGA_STUDIO_PLAYBOOK_V1.fields.map((field) => [
    field.key,
    Object.freeze({ label: field.label, group: SECTION_LABELS[field.section] }),
  ]),
);

export const APPROVED_CONTEXT_FIELD_KEYS = Object.freeze(
  YOGA_STUDIO_PLAYBOOK_V1.fields.map((field) => field.key),
);

type SyntheticFact = Omit<ApprovedContextFactView, "state" | "note" | "reason"> &
  Readonly<{
    states: Readonly<
      Record<
        ApprovedContextUiUseCase,
        Readonly<{ state: ApprovedContextViewState; reason?: string; note: string }>
      >
    >;
  }>;

const SYNTHETIC_FACTS: readonly SyntheticFact[] = [
  {
    id: "business-name",
    fieldKey: "business.name",
    label: "Business name",
    group: "Identity",
    value: "Northstar Yoga Studio",
    version: 3,
    source: "Owner review / INT-002",
    verifiedAt: "18 Jul 2026, 2:30 PM",
    expiresAt: "No scheduled expiry",
    states: {
      campaign: {
        state: "usable",
        note: "Approved for campaign planning and customer-facing copy.",
      },
      concierge: { state: "usable", note: "Approved for direct replies and booking guidance." },
    },
  },
  {
    id: "trial-policy",
    fieldKey: "offer.trialPolicy",
    label: "Introductory trial",
    group: "Offer",
    value: "One complimentary beginner group class",
    version: 2,
    source: "Offer sheet / owner confirmed",
    verifiedAt: "02 Jun 2026, 10:15 AM",
    expiresAt: "Expired 16 Jul 2026",
    states: {
      campaign: {
        state: "blocked",
        reason: "APPROVED_CONTEXT_EXPIRED",
        note: "The offer must be reviewed before it appears in a campaign.",
      },
      concierge: {
        state: "blocked",
        reason: "APPROVED_CONTEXT_EXPIRED",
        note: "Do not promise this trial until an owner approves a new version.",
      },
    },
  },
  {
    id: "booking-route",
    fieldKey: "booking.routeLabel",
    label: "Booking route",
    group: "Operations",
    value: "Share the approved external booking link",
    version: 5,
    source: "Operating guide / owner confirmed",
    verifiedAt: "19 Jul 2026, 9:05 AM",
    expiresAt: "Review due 19 Aug 2026",
    states: {
      campaign: {
        state: "blocked",
        reason: "APPROVED_CONTEXT_RESTRICTED",
        note: "This instruction is operational and cannot be published in campaign copy.",
      },
      concierge: {
        state: "usable",
        note: "Approved for one-to-one booking guidance after qualification.",
      },
    },
  },
  {
    id: "therapy-claim",
    fieldKey: "claims.therapy",
    label: "Therapeutic claim",
    group: "Safety",
    value: "Supports injury recovery",
    version: 1,
    source: "Draft intake note",
    verifiedAt: "17 Jul 2026, 4:40 PM",
    expiresAt: "Under active review",
    states: {
      campaign: {
        state: "blocked",
        reason: "APPROVED_CONTEXT_DISPUTED",
        note: "Health and therapeutic claims require explicit qualified review.",
      },
      concierge: {
        state: "blocked",
        reason: "APPROVED_CONTEXT_DISPUTED",
        note: "Escalate health questions to the studio; no assertion is allowed.",
      },
    },
  },
  {
    id: "primary-audience",
    fieldKey: "audience.primary",
    label: "Primary audience",
    group: "Audience",
    states: {
      campaign: {
        state: "review",
        reason: "APPROVED_CONTEXT_MISSING",
        note: "No approved audience fact exists for this campaign brief.",
      },
      concierge: {
        state: "review",
        reason: "APPROVED_CONTEXT_MISSING",
        note: "Ask a qualifying question instead of assuming customer intent.",
      },
    },
  },
];

export function parseApprovedContextUiUseCase(
  value: string | readonly string[] | undefined,
): ApprovedContextUiUseCase {
  return value === "concierge" ? "concierge" : "campaign";
}

export function parseApprovedContextScope(
  parameters: ApprovedContextSearchParams,
): ApprovedContextScope | null {
  const organizationId = readSingle(parameters.organizationId);
  const workspaceId = readSingle(parameters.workspaceId);
  const profileId = readSingle(parameters.profileId);
  if (
    !organizationId ||
    !workspaceId ||
    !profileId ||
    !UUID_PATTERN.test(organizationId) ||
    !UUID_PATTERN.test(workspaceId) ||
    !PROFILE_ID_PATTERN.test(profileId)
  ) {
    return null;
  }
  return Object.freeze({ organizationId, workspaceId, profileId });
}

export function toDomainApprovedContextUseCase(useCase: ApprovedContextUiUseCase) {
  return useCase === "campaign" ? ("campaign_planning" as const) : ("concierge_response" as const);
}

export function createSyntheticApprovedContextPageData(
  useCase: ApprovedContextUiUseCase,
): ApprovedContextReadyPageData {
  const facts = SYNTHETIC_FACTS.map((fact) => {
    const decision = fact.states[useCase];
    const base = {
      id: fact.id,
      fieldKey: fact.fieldKey,
      label: fact.label,
      group: fact.group,
      state: decision.state,
      note: decision.note,
      ...(decision.reason ? { reason: decision.reason } : {}),
    };
    return Object.freeze(
      decision.state === "usable"
        ? {
            ...base,
            value: fact.value,
            version: fact.version,
            source: fact.source,
            verifiedAt: fact.verifiedAt,
            expiresAt: fact.expiresAt,
          }
        : base,
    );
  });
  const snapshotId =
    "verified-context:sha256:7f2a520a5e1b06f27603f9b46694264e2e52efb15fbe2c77963ba3dbcb0c91c4";
  return Object.freeze({
    status: "ready",
    sourceMode: "synthetic",
    useCase,
    eyebrow: "Verified context / Synthetic workspace",
    snapshotId,
    asOf: "2026-07-19T09:05:00.000Z",
    facts: Object.freeze(facts),
    switchUrls: createSwitchUrls(),
    notice:
      "This protected Preview uses minimized synthetic records. Invite-only mode replaces them with tenant-scoped PostgreSQL retrieval.",
  });
}

export function createVerifiedApprovedContextPageData(
  snapshot: ApprovedContextSnapshot,
  scope: ApprovedContextScope,
  useCase: ApprovedContextUiUseCase,
): ApprovedContextReadyPageData {
  if (
    snapshot.organizationId !== scope.organizationId ||
    snapshot.workspaceId !== scope.workspaceId ||
    snapshot.profileId !== scope.profileId ||
    snapshot.useCase !== toDomainApprovedContextUseCase(useCase)
  ) {
    throw new Error("Verified context snapshot scope does not match the requested workspace.");
  }
  const seen = new Set<string>();
  const facts = snapshot.items.map((item) => {
    if (seen.has(item.fieldKey))
      throw new Error("Verified context snapshot contains duplicate fields.");
    seen.add(item.fieldKey);
    const definition = FIELD_DEFINITIONS.get(item.fieldKey);
    const identity = {
      id: identifierForField(item.fieldKey),
      fieldKey: item.fieldKey,
      label: definition?.label ?? humanizeFieldKey(item.fieldKey),
      group: definition?.group ?? "Business fact",
    };
    if (item.status === "usable") {
      return Object.freeze({
        ...identity,
        state: "usable" as const,
        value: formatFactValue(item.value),
        version: item.citation.version,
        source: item.citation.source.sourceReference,
        verifiedAt: formatInstant(item.citation.verifiedAt),
        expiresAt: item.freshness.expiresAt
          ? `Review due ${formatInstant(item.freshness.expiresAt)}`
          : "No scheduled expiry",
        note:
          useCase === "campaign"
            ? "Approved for campaign planning with this exact citation."
            : "Approved for customer guidance with this exact citation.",
      });
    }
    return Object.freeze({
      ...identity,
      state:
        item.reason.code === "APPROVED_CONTEXT_MISSING"
          ? ("review" as const)
          : ("blocked" as const),
      reason: item.reason.code,
      note: item.reason.detail,
    });
  });
  return Object.freeze({
    status: "ready",
    sourceMode: "verified",
    useCase,
    eyebrow: "Verified context / Tenant workspace",
    snapshotId: snapshot.snapshotId,
    asOf: snapshot.asOf,
    facts: Object.freeze(facts),
    switchUrls: createSwitchUrls(scope),
    notice:
      "Loaded through verified session, current workspace access, tenant RLS, and immutable PostgreSQL snapshot persistence.",
  });
}

export function createUnavailableApprovedContextPageData(
  useCase: ApprovedContextUiUseCase,
  reason: ApprovedContextUnavailablePageData["reason"],
): ApprovedContextUnavailablePageData {
  return Object.freeze({ status: "unavailable", sourceMode: "verified", useCase, reason });
}

function createSwitchUrls(
  scope?: ApprovedContextScope,
): Readonly<Record<ApprovedContextUiUseCase, string>> {
  return Object.freeze({
    campaign: createContextUrl("campaign", scope),
    concierge: createContextUrl("concierge", scope),
  });
}

function createContextUrl(useCase: ApprovedContextUiUseCase, scope?: ApprovedContextScope): string {
  const parameters = new URLSearchParams({ useCase });
  if (scope) {
    parameters.set("organizationId", scope.organizationId);
    parameters.set("workspaceId", scope.workspaceId);
    parameters.set("profileId", scope.profileId);
  }
  return `/business-profile/context?${parameters.toString()}`;
}

function readSingle(value: string | readonly string[] | undefined): string | null {
  return typeof value === "string" && value.trim() === value && value.length > 0 ? value : null;
}

function identifierForField(fieldKey: string): string {
  return fieldKey
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .replace(/[^A-Za-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();
}

function humanizeFieldKey(fieldKey: string): string {
  const label = fieldKey.replace(/[_\.]+/g, " ").trim();
  return label ? `${label.charAt(0).toUpperCase()}${label.slice(1)}` : "Business fact";
}

function formatFactValue(value: unknown): string {
  if (typeof value === "string") return value;
  if (Array.isArray(value) && value.every((item) => typeof item === "string")) {
    return value.join(" / ");
  }
  throw new Error("Approved context contains an unsupported display value.");
}

function formatInstant(value: string): string {
  const timestamp = Date.parse(value);
  if (Number.isNaN(timestamp)) throw new Error("Approved context contains an invalid timestamp.");
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Kolkata",
  }).format(new Date(timestamp));
}
