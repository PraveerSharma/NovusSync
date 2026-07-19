import type { Metadata } from "next";

import { ApprovedContextWorkbench } from "./approved-context-workbench";

export const metadata: Metadata = {
  title: "Approved context | NovusSync",
  description:
    "Review cited, current business facts before they are used in campaigns or customer replies.",
};

export default function ApprovedContextPage() {
  return <ApprovedContextWorkbench />;
}
