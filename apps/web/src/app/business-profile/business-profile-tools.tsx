"use client";

import { usePathname } from "next/navigation";

import { SourceProposalPanel } from "./source-proposal-panel";

export function BusinessProfileTools() {
  const pathname = usePathname();

  if (
    pathname.startsWith("/business-profile/review") ||
    pathname.startsWith("/business-profile/context")
  ) {
    return null;
  }

  return <SourceProposalPanel />;
}
