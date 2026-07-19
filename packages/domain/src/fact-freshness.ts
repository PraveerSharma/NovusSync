export const FACT_FRESHNESS_POLICY_VERSION = "fact-freshness@1";
export const FACT_FRESHNESS_WINDOW_DAYS = 30;
export const FACT_FRESHNESS_DUE_SOON_DAYS = 7;

export const FACT_FRESHNESS_CATEGORIES = [
  "price",
  "offer",
  "booking_route",
  "policy",
  "claim",
] as const;

export type FactFreshnessCategory = (typeof FACT_FRESHNESS_CATEGORIES)[number];
export type FactFreshnessStatus = "expired" | "due_soon" | "current";

export type FactFreshnessRule = Readonly<{
  policyVersion: typeof FACT_FRESHNESS_POLICY_VERSION;
  category: FactFreshnessCategory;
  windowDays: typeof FACT_FRESHNESS_WINDOW_DAYS;
  expiresAt: string;
}>;

const DAY_MILLISECONDS = 24 * 60 * 60 * 1_000;
const PRICE_TOKENS = new Set(["price", "pricing", "fee", "fees", "cost"]);

export function resolveFactFreshness(
  fieldKey: string,
  verifiedAt: string,
): FactFreshnessRule | null {
  const tokens = tokenizeFieldKey(fieldKey);
  const category = resolveCategory(tokens);
  if (!category) return null;

  const verifiedTimestamp = parseTimestamp(verifiedAt, "verifiedAt");
  return Object.freeze({
    policyVersion: FACT_FRESHNESS_POLICY_VERSION,
    category,
    windowDays: FACT_FRESHNESS_WINDOW_DAYS,
    expiresAt: new Date(
      verifiedTimestamp + FACT_FRESHNESS_WINDOW_DAYS * DAY_MILLISECONDS,
    ).toISOString(),
  });
}

export function classifyFactFreshness(
  expiresAt: string,
  asOf: string,
  dueSoonDays: number = FACT_FRESHNESS_DUE_SOON_DAYS,
): FactFreshnessStatus {
  if (!Number.isSafeInteger(dueSoonDays) || dueSoonDays < 0 || dueSoonDays > 365) {
    throw new Error("Fact freshness requires a due-soon window between 0 and 365 days");
  }
  const expiryTimestamp = parseTimestamp(expiresAt, "expiresAt");
  const asOfTimestamp = parseTimestamp(asOf, "asOf");
  if (expiryTimestamp <= asOfTimestamp) return "expired";
  if (expiryTimestamp <= asOfTimestamp + dueSoonDays * DAY_MILLISECONDS) return "due_soon";
  return "current";
}

function resolveCategory(tokens: readonly string[]): FactFreshnessCategory | null {
  if (tokens.some((token) => PRICE_TOKENS.has(token))) return "price";
  if (tokens.includes("offer")) return "offer";
  if (tokens.includes("booking") && tokens.includes("route")) return "booking_route";
  if (tokens.includes("policy")) return "policy";
  if (tokens.includes("claim") || tokens.includes("claims")) return "claim";
  return null;
}

function tokenizeFieldKey(fieldKey: string): readonly string[] {
  if (!fieldKey.trim()) throw new Error("Fact freshness requires a field key");
  return fieldKey
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
}

function parseTimestamp(value: string, field: string): number {
  const timestamp = Date.parse(value);
  if (!value.trim() || Number.isNaN(timestamp)) {
    throw new Error("Fact freshness requires a valid " + field + " timestamp");
  }
  return timestamp;
}
