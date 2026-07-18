export const FOUNDATION_EXTERNAL_EFFECTS = [
  "social-publication",
  "business-message",
  "advertising-spend",
  "booking-write",
  "payment-charge",
] as const;

export type FoundationExternalEffect = (typeof FOUNDATION_EXTERNAL_EFFECTS)[number];

export type FoundationEffectRequest = Readonly<{
  effect: FoundationExternalEffect;
  workspaceId: string;
  correlationId: string;
}>;

export type FoundationEffectDecision = Readonly<{
  allowed: false;
  code: "FOUNDATION_EXTERNAL_EFFECTS_DENIED";
  effect: FoundationExternalEffect;
  workspaceId: string;
  correlationId: string;
}>;

export function decideFoundationExternalEffect(
  request: FoundationEffectRequest,
): FoundationEffectDecision {
  return Object.freeze({
    allowed: false,
    code: "FOUNDATION_EXTERNAL_EFFECTS_DENIED",
    effect: request.effect,
    workspaceId: request.workspaceId,
    correlationId: request.correlationId,
  });
}
