export const BUSINESS_PROFILE_SECTIONS = [
  "business",
  "offer",
  "audience",
  "voice",
  "faqs",
  "claims",
  "restrictions",
  "booking",
] as const;

export const BUSINESS_PROFILE_FIELD_KINDS = ["short_text", "long_text", "list", "url"] as const;

export type BusinessProfileSection = (typeof BUSINESS_PROFILE_SECTIONS)[number];
export type BusinessProfileFieldKind = (typeof BUSINESS_PROFILE_FIELD_KINDS)[number];
export type BusinessProfileValue = string | readonly string[];

export type BusinessProfileFieldDefinition = Readonly<{
  key: string;
  section: BusinessProfileSection;
  label: string;
  description: string;
  kind: BusinessProfileFieldKind;
  required: boolean;
  maxLength?: number;
  maxItems?: number;
  itemMaxLength?: number;
}>;

export type BusinessProfilePlaybook = Readonly<{
  id: string;
  version: number;
  businessType: string;
  locale: string;
  fields: readonly BusinessProfileFieldDefinition[];
}>;

export type BusinessProfileTenant = Readonly<{
  organizationId: string;
  workspaceId: string;
}>;

export type BusinessProfileDraft = Readonly<{
  profileId: string;
  tenant: BusinessProfileTenant;
  playbook: Readonly<{
    id: string;
    version: number;
  }>;
  values: Readonly<Record<string, BusinessProfileValue>>;
  version: number;
  createdAt: string;
  updatedAt: string;
}>;

export const BUSINESS_PROFILE_VALIDATION_CODES = [
  "REQUIRED_FIELD_MISSING",
  "VALUE_TOO_LONG",
  "TOO_MANY_ITEMS",
  "EMPTY_LIST_ITEM",
  "INVALID_URL",
] as const;

export type BusinessProfileValidationCode = (typeof BUSINESS_PROFILE_VALIDATION_CODES)[number];

export type BusinessProfileValidationIssue = Readonly<{
  code: BusinessProfileValidationCode;
  fieldKey: string;
  message: string;
}>;

export const BUSINESS_PROFILE_ERROR_CODES = [
  "INVALID_PLAYBOOK",
  "INVALID_DRAFT",
  "UNKNOWN_FIELD",
  "PLAYBOOK_MISMATCH",
  "VERSION_CONFLICT",
  "TIMESTAMP_REGRESSION",
] as const;

export type BusinessProfileErrorCode = (typeof BUSINESS_PROFILE_ERROR_CODES)[number];

export class BusinessProfileError extends Error {
  override readonly name = "BusinessProfileError";
  readonly code: BusinessProfileErrorCode;

  constructor(code: BusinessProfileErrorCode, message: string) {
    super(message);
    this.code = code;
  }
}

type CreateBusinessProfileDraftInput = Readonly<{
  profileId: string;
  tenant: BusinessProfileTenant;
  playbook: BusinessProfilePlaybook;
  values?: Readonly<Record<string, BusinessProfileValue>>;
  now: string;
}>;

type ReviseBusinessProfileDraftInput = Readonly<{
  expectedVersion: number;
  playbook: BusinessProfilePlaybook;
  changes: Readonly<Record<string, BusinessProfileValue | null>>;
  now: string;
}>;

const IDENTIFIER_PATTERN = /^[a-zA-Z0-9][a-zA-Z0-9._:-]{0,127}$/;
const FIELD_KEY_PATTERN = /^[a-z][a-z0-9_]{2,63}$/;

export function validateBusinessProfilePlaybook(playbook: BusinessProfilePlaybook): void {
  if (
    !IDENTIFIER_PATTERN.test(playbook.id) ||
    !Number.isInteger(playbook.version) ||
    playbook.version < 1
  ) {
    throw new BusinessProfileError("INVALID_PLAYBOOK", "The playbook identity is invalid.");
  }

  if (!playbook.businessType.trim() || !playbook.locale.trim() || playbook.fields.length === 0) {
    throw new BusinessProfileError("INVALID_PLAYBOOK", "The playbook metadata is incomplete.");
  }

  const fieldKeys = new Set<string>();
  const coveredSections = new Set<BusinessProfileSection>();

  for (const field of playbook.fields) {
    if (
      !FIELD_KEY_PATTERN.test(field.key) ||
      !field.label.trim() ||
      !field.description.trim() ||
      fieldKeys.has(field.key)
    ) {
      throw new BusinessProfileError(
        "INVALID_PLAYBOOK",
        "A playbook field is invalid or duplicated.",
      );
    }

    if (
      (field.kind === "list" &&
        (!isPositiveInteger(field.maxItems) || !isPositiveInteger(field.itemMaxLength))) ||
      (field.kind !== "list" && !isPositiveInteger(field.maxLength))
    ) {
      throw new BusinessProfileError(
        "INVALID_PLAYBOOK",
        `The validation limits for ${field.key} are invalid.`,
      );
    }

    fieldKeys.add(field.key);
    coveredSections.add(field.section);
  }

  if (BUSINESS_PROFILE_SECTIONS.some((section) => !coveredSections.has(section))) {
    throw new BusinessProfileError(
      "INVALID_PLAYBOOK",
      "The playbook must cover every required profile section.",
    );
  }
}

export function createBusinessProfileDraft(
  input: CreateBusinessProfileDraftInput,
): BusinessProfileDraft {
  validateBusinessProfilePlaybook(input.playbook);
  assertIdentifier(input.profileId, "profileId");
  assertTenant(input.tenant);
  assertTimestamp(input.now);

  const values = cloneValues(input.values ?? {}, input.playbook);
  return freezeDraft({
    profileId: input.profileId,
    tenant: input.tenant,
    playbook: { id: input.playbook.id, version: input.playbook.version },
    values,
    version: 1,
    createdAt: input.now,
    updatedAt: input.now,
  });
}

export function reviseBusinessProfileDraft(
  current: BusinessProfileDraft,
  input: ReviseBusinessProfileDraftInput,
): BusinessProfileDraft {
  validateBusinessProfilePlaybook(input.playbook);
  assertDraftMatchesPlaybook(current, input.playbook);
  assertTimestamp(input.now);

  if (input.expectedVersion !== current.version) {
    throw new BusinessProfileError(
      "VERSION_CONFLICT",
      `Expected profile version ${input.expectedVersion}, found ${current.version}.`,
    );
  }

  if (Date.parse(input.now) < Date.parse(current.updatedAt)) {
    throw new BusinessProfileError(
      "TIMESTAMP_REGRESSION",
      "A profile revision cannot predate the current version.",
    );
  }

  const nextValues: Record<string, BusinessProfileValue> = { ...current.values };
  for (const [key, value] of Object.entries(input.changes)) {
    assertKnownField(key, input.playbook);
    if (value === null) {
      delete nextValues[key];
    } else {
      nextValues[key] = cloneValue(value, key);
    }
  }

  return freezeDraft({
    ...current,
    values: nextValues,
    version: current.version + 1,
    updatedAt: input.now,
  });
}

export function validateBusinessProfileDraft(
  draft: BusinessProfileDraft,
  playbook: BusinessProfilePlaybook,
): readonly BusinessProfileValidationIssue[] {
  validateBusinessProfilePlaybook(playbook);
  assertDraftMatchesPlaybook(draft, playbook);

  const issues: BusinessProfileValidationIssue[] = [];
  for (const field of playbook.fields) {
    const value = draft.values[field.key];

    if (isMissing(value)) {
      if (field.required) {
        issues.push({
          code: "REQUIRED_FIELD_MISSING",
          fieldKey: field.key,
          message: `${field.label} is required.`,
        });
      }
      continue;
    }

    if (field.kind === "list") {
      if (!Array.isArray(value)) {
        throw new BusinessProfileError("INVALID_DRAFT", `${field.key} must be a list.`);
      }
      if (value.length > (field.maxItems ?? 0)) {
        issues.push({
          code: "TOO_MANY_ITEMS",
          fieldKey: field.key,
          message: `${field.label} accepts at most ${field.maxItems} items.`,
        });
      }
      if (value.some((item) => !item.trim())) {
        issues.push({
          code: "EMPTY_LIST_ITEM",
          fieldKey: field.key,
          message: `${field.label} contains an empty item.`,
        });
      }
      if (value.some((item) => item.length > (field.itemMaxLength ?? 0))) {
        issues.push({
          code: "VALUE_TOO_LONG",
          fieldKey: field.key,
          message: `${field.label} contains an item that is too long.`,
        });
      }
      continue;
    }

    if (typeof value !== "string") {
      throw new BusinessProfileError("INVALID_DRAFT", `${field.key} must be text.`);
    }
    if (value.length > (field.maxLength ?? 0)) {
      issues.push({
        code: "VALUE_TOO_LONG",
        fieldKey: field.key,
        message: `${field.label} is too long.`,
      });
    }
    if (field.kind === "url" && !isSafeHttpUrl(value)) {
      issues.push({
        code: "INVALID_URL",
        fieldKey: field.key,
        message: `${field.label} must be a valid HTTPS URL.`,
      });
    }
  }

  return Object.freeze(issues.map((issue) => Object.freeze(issue)));
}

export function getBusinessProfileCompletion(
  draft: BusinessProfileDraft,
  playbook: BusinessProfilePlaybook,
): Readonly<{ completedRequired: number; totalRequired: number; isComplete: boolean }> {
  const requiredFields = playbook.fields.filter((field) => field.required);
  const completedRequired = requiredFields.filter(
    (field) => !isMissing(draft.values[field.key]),
  ).length;
  const issues = validateBusinessProfileDraft(draft, playbook);

  return Object.freeze({
    completedRequired,
    totalRequired: requiredFields.length,
    isComplete: completedRequired === requiredFields.length && issues.length === 0,
  });
}

function assertDraftMatchesPlaybook(
  draft: BusinessProfileDraft,
  playbook: BusinessProfilePlaybook,
): void {
  if (draft.playbook.id !== playbook.id || draft.playbook.version !== playbook.version) {
    throw new BusinessProfileError(
      "PLAYBOOK_MISMATCH",
      "The profile draft belongs to another playbook version.",
    );
  }

  for (const key of Object.keys(draft.values)) {
    assertKnownField(key, playbook);
  }
}

function cloneValues(
  values: Readonly<Record<string, BusinessProfileValue>>,
  playbook: BusinessProfilePlaybook,
): Readonly<Record<string, BusinessProfileValue>> {
  const result: Record<string, BusinessProfileValue> = {};
  for (const [key, value] of Object.entries(values)) {
    assertKnownField(key, playbook);
    result[key] = cloneValue(value, key);
  }
  return Object.freeze(result);
}

function cloneValue(value: BusinessProfileValue, key: string): BusinessProfileValue {
  if (typeof value === "string") {
    return value;
  }
  if (Array.isArray(value) && value.every((item) => typeof item === "string")) {
    return Object.freeze([...value]);
  }
  throw new BusinessProfileError("INVALID_DRAFT", `${key} has an unsupported value.`);
}

function freezeDraft(draft: BusinessProfileDraft): BusinessProfileDraft {
  const values = Object.freeze(
    Object.fromEntries(
      Object.entries(draft.values).map(([key, value]) => [key, cloneValue(value, key)]),
    ),
  );

  return Object.freeze({
    ...draft,
    tenant: Object.freeze({ ...draft.tenant }),
    playbook: Object.freeze({ ...draft.playbook }),
    values,
  });
}

function assertKnownField(key: string, playbook: BusinessProfilePlaybook): void {
  if (!playbook.fields.some((field) => field.key === key)) {
    throw new BusinessProfileError("UNKNOWN_FIELD", `Unknown business profile field: ${key}.`);
  }
}

function assertIdentifier(value: string, field: string): void {
  if (!IDENTIFIER_PATTERN.test(value)) {
    throw new BusinessProfileError("INVALID_DRAFT", `${field} is invalid.`);
  }
}

function assertTenant(tenant: BusinessProfileTenant): void {
  assertIdentifier(tenant.organizationId, "organizationId");
  assertIdentifier(tenant.workspaceId, "workspaceId");
}

function assertTimestamp(value: string): void {
  if (!value || Number.isNaN(Date.parse(value))) {
    throw new BusinessProfileError("INVALID_DRAFT", "The profile timestamp is invalid.");
  }
}

function isPositiveInteger(value: number | undefined): value is number {
  return Number.isInteger(value) && (value ?? 0) > 0;
}

function isMissing(value: BusinessProfileValue | undefined): boolean {
  return value === undefined || (typeof value === "string" ? !value.trim() : value.length === 0);
}

function isSafeHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && Boolean(url.hostname);
  } catch {
    return false;
  }
}
