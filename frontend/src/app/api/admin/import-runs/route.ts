import { withAdmin } from "@/lib/api/auth";
import { apiError, apiOk } from "@/lib/api/responses";
import { withValidation } from "@/lib/api/validation";
import { queueImportRunSchema } from "@/modules/admin/imports-schema";
import { listImportRuns, queueImportRun } from "@/modules/admin/service";

export async function GET() {
  return withAdmin(async ({ service }) => {
    const { data, error } = await listImportRuns(service);

    if (error) {
      console.error("[admin/import-runs] failed to load", error);
      return apiError("Failed to load import runs", 500);
    }

    return apiOk({ importRuns: data ?? [] });
  });
}

export async function POST(request: Request) {
  const validation = await withValidation(request, queueImportRunSchema);

  if (!validation.ok) {
    return validation.response;
  }

  return withAdmin(async ({ service, dbUser }) => {
    const { data, error } = await queueImportRun(service, validation.data, dbUser.id);

    if (error) {
      console.error("[admin/import-runs] failed to queue", error);
      return apiError("Failed to queue import run", 500);
    }

    return apiOk({ importRun: data }, { status: 201 });
  });
}
