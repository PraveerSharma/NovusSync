import { createCommandEnvelope } from "@novussync/application";
import { loadServerConfig } from "@novussync/config/server";

export const jobsRuntimeConfig = loadServerConfig(process.env);

type JobContext = {
  command: string;
  createdAt: string;
  releaseId: string;
};

export function createBootstrapJobContext(): JobContext {
  return {
    command: "foundation-bootstrap",
    createdAt: new Date().toISOString(),
    releaseId: jobsRuntimeConfig.runtime.releaseId,
  };
}

export function runFoundationJobs() {
  const context = createBootstrapJobContext();
  return createCommandEnvelope(
    context.command,
    {
      tenant: {
        organizationId: "00000000-0000-4000-8000-000000000001",
        workspaceId: "00000000-0000-4000-8000-000000000101",
      },
      actor: {
        id: "00000000-0000-4000-8000-000000000901",
        actorType: "system",
        role: "system",
        accessKind: "system",
      },
      correlationId: `foundation-bootstrap:${context.releaseId}`,
      origin: { type: "job", jobId: "foundation-bootstrap", attempt: 1 },
    },
    { releaseId: context.releaseId },
    context.createdAt,
  );
}
