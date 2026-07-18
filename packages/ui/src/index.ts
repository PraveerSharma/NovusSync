import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function statusBadgeLabel(state: "ready" | "blocked" | "pending") {
  return {
    ready: "Ready",
    blocked: "Blocked",
    pending: "Pending",
  }[state];
}
