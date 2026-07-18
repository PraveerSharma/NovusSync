import type { ReactNode } from "react";

import { SourceProposalPanel } from "./source-proposal-panel";

export default function BusinessProfileLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <>
      {children}
      <SourceProposalPanel />
    </>
  );
}
