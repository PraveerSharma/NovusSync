import { isSensitiveValue, REDACTED_VALUE } from "./sensitive-value.ts";

const CIRCULAR_VALUE = "[CIRCULAR]";
const TRUNCATED_VALUE = "[TRUNCATED]";
const BINARY_VALUE = "[BINARY REDACTED]";

const SENSITIVE_KEY_FRAGMENTS = [
  "password",
  "secret",
  "token",
  "authorization",
  "cookie",
  "apikey",
  "privatekey",
  "servicerole",
  "credential",
  "databaseurl",
  "connectionstring",
  "email",
  "phone",
  "mobile",
  "firstname",
  "lastname",
  "fullname",
  "leadname",
  "customername",
  "prospectname",
  "health",
  "injury",
  "medical",
  "paymentreference",
  "rawmessage",
  "messagebody",
  "transcript",
] as const;

const PERSON_CONTEXT_KEYS = [
  "lead",
  "contact",
  "customer",
  "prospect",
  "person",
  "member",
] as const;

function normalizeKey(key: string): string {
  return key.replace(/[^a-z0-9]/gi, "").toLowerCase();
}

function isSensitiveKey(key: string, path: readonly string[]): boolean {
  const normalized = normalizeKey(key);

  if (SENSITIVE_KEY_FRAGMENTS.some((fragment) => normalized.includes(fragment))) {
    return true;
  }

  if (normalized !== "name") {
    return false;
  }

  return path.some((segment) => {
    const normalizedSegment = normalizeKey(segment);
    return PERSON_CONTEXT_KEYS.some((context) => normalizedSegment.includes(context));
  });
}

export function redactText(value: string): string {
  let redacted = value;

  redacted = redacted.replace(/\bBearer\s+[A-Za-z0-9._~+\/-]+/gi, `Bearer ${REDACTED_VALUE}`);
  redacted = redacted.replace(
    /\b(?:api[_-]?key|access[_-]?token|refresh[_-]?token|password|secret)\s*([:=])\s*(?:"[^"]*"|'[^']*'|[^\s,;]+)/gi,
    (match, separator: string) => {
      const label = match.slice(0, match.indexOf(separator)).trim();
      return `${label}${separator}${REDACTED_VALUE}`;
    },
  );
  redacted = redacted.replace(/\bsk-[A-Za-z0-9_-]{12,}\b/g, REDACTED_VALUE);
  redacted = redacted.replace(
    /\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/g,
    REDACTED_VALUE,
  );
  redacted = redacted.replace(
    /\b(postgres(?:ql)?|mysql|mongodb(?:\+srv)?):\/\/[^@\s]+@/gi,
    (_match, protocol: string) => `${protocol}://${REDACTED_VALUE}@`,
  );
  redacted = redacted.replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, REDACTED_VALUE);
  redacted = redacted.replace(/\+?\d[\d\s().-]{7,}\d/g, (candidate) => {
    const digitCount = candidate.replace(/\D/g, "").length;
    return digitCount >= 9 && digitCount <= 15 ? REDACTED_VALUE : candidate;
  });

  return redacted;
}

export function redactSensitiveData(value: unknown): unknown {
  const seen = new WeakSet<object>();

  function visit(input: unknown, path: readonly string[], depth: number): unknown {
    if (isSensitiveValue(input)) {
      return REDACTED_VALUE;
    }

    if (typeof input === "string") {
      return redactText(input);
    }

    if (input === null || typeof input === "number" || typeof input === "boolean") {
      return input;
    }

    if (typeof input === "bigint") {
      return input.toString();
    }

    if (input === undefined) {
      return undefined;
    }

    if (typeof input === "function" || typeof input === "symbol") {
      return `[${typeof input}]`;
    }

    if (depth > 12) {
      return TRUNCATED_VALUE;
    }

    if (input instanceof Date) {
      return input.toISOString();
    }

    if (input instanceof URL) {
      return redactText(input.toString());
    }

    if (ArrayBuffer.isView(input) || input instanceof ArrayBuffer) {
      return BINARY_VALUE;
    }

    if (input instanceof Error) {
      return {
        name: input.name,
        message: redactText(input.message),
        stack: input.stack ? redactText(input.stack) : undefined,
        cause: visit(input.cause, [...path, "cause"], depth + 1),
      };
    }

    if (typeof input !== "object") {
      return String(input);
    }

    if (seen.has(input)) {
      return CIRCULAR_VALUE;
    }
    seen.add(input);

    if (Array.isArray(input)) {
      return input.map((item, index) => visit(item, [...path, String(index)], depth + 1));
    }

    const output: Record<string, unknown> = {};
    const descriptors = Object.getOwnPropertyDescriptors(input);

    for (const [key, descriptor] of Object.entries(descriptors)) {
      if (!descriptor.enumerable) {
        continue;
      }

      if (isSensitiveKey(key, path)) {
        output[key] = REDACTED_VALUE;
        continue;
      }

      output[key] =
        "value" in descriptor ? visit(descriptor.value, [...path, key], depth + 1) : "[ACCESSOR]";
    }

    return output;
  }

  return visit(value, [], 0);
}

export function safeJsonStringify(value: unknown, space?: number): string | undefined {
  return JSON.stringify(redactSensitiveData(value), null, space);
}

export { REDACTED_VALUE } from "./sensitive-value.ts";
