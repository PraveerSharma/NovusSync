import type { ReactNode } from "react";

import { BusinessProfileTools } from "./business-profile-tools";

export default function BusinessProfileLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <>
      {children}
      <BusinessProfileTools />
    </>
  );
}
