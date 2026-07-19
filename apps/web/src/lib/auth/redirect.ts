const DEFAULT_AUTH_DESTINATION = "/dashboard";

const ALLOWED_AUTH_DESTINATIONS = new Set([
  DEFAULT_AUTH_DESTINATION,
  "/workspaces",
  "/business-profile",
]);

export function safeAuthDestination(value: string | null | undefined): string {
  if (!value || value.includes("\\")) {
    return DEFAULT_AUTH_DESTINATION;
  }

  try {
    const destination = new URL(value, "https://novussync.invalid");
    if (
      destination.origin !== "https://novussync.invalid" ||
      !ALLOWED_AUTH_DESTINATIONS.has(destination.pathname)
    ) {
      return DEFAULT_AUTH_DESTINATION;
    }

    return `${destination.pathname}${destination.search}${destination.hash}`;
  } catch {
    return DEFAULT_AUTH_DESTINATION;
  }
}

export function signInLocation(next: string, state?: string): string {
  const parameters = new URLSearchParams({ next: safeAuthDestination(next) });
  if (state) {
    parameters.set("state", state);
  }

  return `/sign-in?${parameters.toString()}`;
}
