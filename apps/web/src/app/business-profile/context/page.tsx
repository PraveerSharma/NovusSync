import type { Metadata } from "next";

import { getAuthAccessMode } from "../../../lib/auth/runtime";
import {
  createSyntheticApprovedContextPageData,
  createUnavailableApprovedContextPageData,
  parseApprovedContextScope,
  parseApprovedContextUiUseCase,
  type ApprovedContextSearchParams,
} from "../../../lib/approved-context/page-data";
import { loadVerifiedApprovedContextPageData } from "../../../lib/approved-context/server";
import { ApprovedContextWorkbench } from "./approved-context-workbench";

export const metadata: Metadata = {
  title: "Approved context | NovusSync",
  description:
    "Review cited, current business facts before they are used in campaigns or customer replies.",
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

interface ApprovedContextPageProps {
  readonly searchParams: Promise<ApprovedContextSearchParams>;
}

export default async function ApprovedContextPage({ searchParams }: ApprovedContextPageProps) {
  const parameters = await searchParams;
  const useCase = parseApprovedContextUiUseCase(parameters.useCase);

  if (getAuthAccessMode() === "disabled") {
    return <ApprovedContextWorkbench data={createSyntheticApprovedContextPageData(useCase)} />;
  }

  const scope = parseApprovedContextScope(parameters);
  if (!scope) {
    return (
      <ApprovedContextWorkbench
        data={createUnavailableApprovedContextPageData(useCase, "scope_required")}
      />
    );
  }

  let data;
  try {
    data = await loadVerifiedApprovedContextPageData(scope, useCase);
  } catch {
    data = createUnavailableApprovedContextPageData(useCase, "temporarily_unavailable");
  }
  return <ApprovedContextWorkbench data={data} />;
}
