import type { Metadata } from "next";

import { FactReviewWorkbench } from "./fact-review-workbench";

export const metadata: Metadata = {
  title: "Fact review | NovusSync",
  description: "Review provisional business facts before they become approved truth.",
};

export default function FactReviewPage() {
  return <FactReviewWorkbench />;
}
