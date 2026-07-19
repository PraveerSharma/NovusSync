import type { Metadata } from "next";

import { getAuthAccessMode } from "../../../lib/auth/runtime";
import {
  createSyntheticFactReverificationPageData,
  createUnavailableFactReverificationPageData,
  parseFactReverificationNotice,
  parseFactReverificationScope,
  type FactReverificationSearchParams,
} from "../../../lib/fact-reverification/page-data";
import { loadFactReverificationPageData } from "../../../lib/fact-reverification/server";
import { FactReverificationWorkbench } from "./fact-reverification-workbench";

export const metadata: Metadata = {
  title: "Fact freshness | NovusSync",
  description: "Review expiring business facts before they can be used externally again.",
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function FactReverificationPage({
  searchParams,
}: Readonly<{ searchParams: Promise<FactReverificationSearchParams> }>) {
  const parameters = await searchParams;
  const notice = parseFactReverificationNotice(parameters.notice);
  if (getAuthAccessMode() === "disabled") {
    return <FactReverificationWorkbench data={createSyntheticFactReverificationPageData(notice)} />;
  }

  const scope = parseFactReverificationScope(parameters);
  if (!scope) {
    return (
      <FactReverificationWorkbench
        data={createUnavailableFactReverificationPageData("scope_required")}
      />
    );
  }

  let data;
  try {
    data = await loadFactReverificationPageData(scope, notice);
  } catch {
    data = createUnavailableFactReverificationPageData("temporarily_unavailable");
  }
  return <FactReverificationWorkbench data={data} />;
}
