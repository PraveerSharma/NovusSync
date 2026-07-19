import type { FactReverificationQueue, FactReverificationQueueItem } from "@novussync/application";

export type FactReverificationScope = Readonly<{
  organizationId: string;
  workspaceId: string;
  profileId: string;
}>;

export type FactReverificationSearchParams = Readonly<{
  organizationId?: string | string[];
  workspaceId?: string | string[];
  profileId?: string | string[];
  notice?: string | string[];
}>;

export type FactReverificationItemView = FactReverificationQueueItem &
  Readonly<{
    fieldLabel: string;
    categoryLabel: string;
    statusLabel: string;
    valueText: string;
    sourceLabel: string;
  }>;

export type FactReverificationPageData =
  | Readonly<{
      status: "ready";
      mode: "verified" | "synthetic";
      scope: FactReverificationScope;
      asOf: string;
      policyVersion: string;
      dueSoonDays: number;
      expiredCount: number;
      dueSoonCount: number;
      currentCount: number;
      items: readonly FactReverificationItemView[];
      notice: "reverified" | "failed" | null;
    }>
  | Readonly<{
      status: "unavailable";
      reason: "scope_required" | "temporarily_unavailable";
    }>;

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const PROFILE_ID_PATTERN = /^[a-zA-Z0-9][a-zA-Z0-9._:-]{0,127}$/;
const SYNTHETIC_SCOPE: FactReverificationScope = Object.freeze({
  organizationId: "10000000-0000-4000-8000-000000000001",
  workspaceId: "10000000-0000-4000-8000-000000000101",
  profileId: "northstar-yoga-primary",
});

export function parseFactReverificationScope(
  parameters: FactReverificationSearchParams,
): FactReverificationScope | null {
  const organizationId = scalar(parameters.organizationId);
  const workspaceId = scalar(parameters.workspaceId);
  const profileId = scalar(parameters.profileId);
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

export function parseFactReverificationNotice(
  value: string | string[] | undefined,
): "reverified" | "failed" | null {
  const notice = scalar(value);
  return notice === "reverified" || notice === "failed" ? notice : null;
}

export function toFactReverificationPageData(
  queue: FactReverificationQueue,
  scope: FactReverificationScope,
  mode: "verified" | "synthetic" = "verified",
  notice: "reverified" | "failed" | null = null,
): FactReverificationPageData {
  return Object.freeze({
    status: "ready",
    mode,
    scope,
    asOf: queue.asOf,
    policyVersion: queue.policyVersion,
    dueSoonDays: queue.dueSoonDays,
    expiredCount: queue.expiredCount,
    dueSoonCount: queue.dueSoonCount,
    currentCount: queue.currentCount,
    items: Object.freeze(queue.items.map(toItemView)),
    notice,
  });
}

export function createSyntheticFactReverificationPageData(
  notice: "reverified" | "failed" | null = null,
): FactReverificationPageData {
  return toFactReverificationPageData(
    {
      profileId: SYNTHETIC_SCOPE.profileId,
      asOf: "2026-07-19T10:00:00.000Z",
      policyVersion: "fact-freshness@1",
      dueSoonDays: 7,
      expiredCount: 1,
      dueSoonCount: 1,
      currentCount: 1,
      items: [
        syntheticItem({
          factVersionId: "fact-price-v3",
          fieldKey: "offer.price",
          value: "INR 499 introductory class",
          category: "price",
          status: "expired",
          verifiedAt: "2026-06-17T09:20:00.000Z",
          expiresAt: "2026-07-17T09:20:00.000Z",
          version: 3,
          canReverify: true,
        }),
        syntheticItem({
          factVersionId: "fact-booking-v2",
          fieldKey: "booking.routeLabel",
          value: "Owner-assisted WhatsApp booking",
          category: "booking_route",
          status: "due_soon",
          verifiedAt: "2026-06-24T08:00:00.000Z",
          expiresAt: "2026-07-24T08:00:00.000Z",
          version: 2,
          canReverify: true,
        }),
        syntheticItem({
          factVersionId: "fact-claims-v4",
          fieldKey: "claims.boundary",
          value: "No medical or guaranteed outcome claims",
          category: "claim",
          status: "current",
          verifiedAt: "2026-07-11T11:10:00.000Z",
          expiresAt: "2026-08-10T11:10:00.000Z",
          version: 4,
          canReverify: false,
        }),
      ],
    },
    SYNTHETIC_SCOPE,
    "synthetic",
    notice,
  );
}

export function createUnavailableFactReverificationPageData(
  reason: "scope_required" | "temporarily_unavailable",
): FactReverificationPageData {
  return Object.freeze({ status: "unavailable", reason });
}

export function buildFactReverificationHref(scope: FactReverificationScope): string {
  const parameters = new URLSearchParams({
    organizationId: scope.organizationId,
    workspaceId: scope.workspaceId,
    profileId: scope.profileId,
  });
  return "/business-profile/reverification?" + parameters.toString();
}

function syntheticItem(
  input: Pick<
    FactReverificationQueueItem,
    | "factVersionId"
    | "fieldKey"
    | "value"
    | "category"
    | "status"
    | "verifiedAt"
    | "expiresAt"
    | "version"
    | "canReverify"
  >,
): FactReverificationQueueItem {
  return Object.freeze({
    ...input,
    profileId: SYNTHETIC_SCOPE.profileId,
    sourceLocation: "https://northstar.example/approved-profile",
    sourceReference: "Synthetic owner-approved fixture",
  });
}

function toItemView(item: FactReverificationQueueItem): FactReverificationItemView {
  return Object.freeze({
    ...item,
    fieldLabel: humanize(item.fieldKey),
    categoryLabel: humanize(item.category),
    statusLabel:
      item.status === "expired" ? "Expired" : item.status === "due_soon" ? "Due soon" : "Current",
    valueText: formatValue(item.value),
    sourceLabel: sourceLabel(item.sourceLocation),
  });
}

function formatValue(value: unknown): string {
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (Array.isArray(value)) return value.map(String).join(" · ");
  if (value && typeof value === "object") return JSON.stringify(value);
  return "No approved display value";
}

function sourceLabel(value: string): string {
  try {
    return new URL(value).hostname;
  } catch {
    return "Approved source";
  }
}

function humanize(value: string): string {
  return value
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .split(/[._-]+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function scalar(value: string | string[] | undefined): string | null {
  return typeof value === "string" ? value : null;
}
