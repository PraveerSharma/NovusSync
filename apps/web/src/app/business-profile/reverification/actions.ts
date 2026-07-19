"use server";

import { randomUUID } from "node:crypto";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import {
  buildFactReverificationHref,
  parseFactReverificationScope,
} from "../../../lib/fact-reverification/page-data";
import { reverifyFact } from "../../../lib/fact-reverification/server";

export async function reverifyFactAction(formData: FormData): Promise<never> {
  const scope = parseFactReverificationScope({
    organizationId: readField(formData, "organizationId"),
    workspaceId: readField(formData, "workspaceId"),
    profileId: readField(formData, "profileId"),
  });
  if (!scope) redirect("/workspaces");

  const factVersionId = readField(formData, "factVersionId");
  const idempotencyKey = readField(formData, "idempotencyKey");
  const expectedVersion = Number(readField(formData, "expectedVersion"));
  let notice: "reverified" | "failed" = "reverified";
  try {
    if (
      !factVersionId ||
      !idempotencyKey ||
      !Number.isSafeInteger(expectedVersion) ||
      expectedVersion < 1
    ) {
      throw new Error("Invalid fact reverification form.");
    }
    await reverifyFact({
      scope,
      factVersionId,
      expectedVersion,
      newFactVersionId: "fact-version-" + randomUUID(),
      idempotencyKey,
    });
    revalidatePath("/business-profile/reverification");
  } catch {
    notice = "failed";
  }
  redirect(buildFactReverificationHref(scope) + "&notice=" + notice);
}

function readField(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}
