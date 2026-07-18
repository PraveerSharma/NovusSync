export const REDACTED_VALUE = "[REDACTED]";

export class SensitiveValue {
  readonly #value: string;

  private constructor(value: string) {
    this.#value = value;
    Object.freeze(this);
  }

  static from(value: string): SensitiveValue {
    return new SensitiveValue(value);
  }

  revealForUse(reason: string): string {
    if (!reason.trim()) {
      throw new Error("A reason is required to reveal a sensitive value.");
    }

    return this.#value;
  }

  toJSON(): string {
    return REDACTED_VALUE;
  }

  toString(): string {
    return REDACTED_VALUE;
  }

  [Symbol.toPrimitive](): string {
    return REDACTED_VALUE;
  }
}

export function isSensitiveValue(value: unknown): value is SensitiveValue {
  return value instanceof SensitiveValue;
}
