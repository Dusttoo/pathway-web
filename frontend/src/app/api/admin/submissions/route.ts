import { withAdmin } from "@/lib/api/auth";
import { apiError, apiOk } from "@/lib/api/responses";
import { withValidation } from "@/lib/api/validation";
import { listSubmissions, updateSubmission } from "@/modules/admin/service";
import { updateSubmissionSchema } from "@/modules/admin/schema";

export async function GET() {
  return withAdmin(async ({ service }) => {
    const { feedbackResult, contactResult } = await listSubmissions(service);

    if (feedbackResult.error || contactResult.error) {
      console.error("[admin/submissions] failed to load", {
        feedback: feedbackResult.error,
        contact: contactResult.error,
      });
      return apiError("Failed to load submissions", 500);
    }

    return apiOk({
      feedback: feedbackResult.data ?? [],
      contact: contactResult.data ?? [],
    });
  });
}

export async function PATCH(request: Request) {
  const validation = await withValidation(request, updateSubmissionSchema);

  if (!validation.ok) {
    return validation.response;
  }

  return withAdmin(async ({ service }) => {
    const { data, error } = await updateSubmission(service, validation.data);

    if (error) {
      console.error("[admin/submissions] failed to update", {
        kind: validation.data.kind,
        id: validation.data.id,
        error,
      });
      return apiError("Failed to update submission", 500);
    }

    return apiOk({ submission: data });
  });
}
