import { getDiscordId } from "@/lib/api/auth";
import { apiError, apiOk } from "@/lib/api/responses";
import { withValidation } from "@/lib/api/validation";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { createFeedbackSubmission } from "@/modules/feedback/service";
import { feedbackSubmissionSchema } from "@/modules/feedback/schema";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const validation = await withValidation(request, feedbackSubmissionSchema);
  if (!validation.ok) {
    return validation.response;
  }

  const service = createServiceClient();
  let userId: string | null = null;

  if (user) {
    const { data } = await service
      .from("users")
      .select("id")
      .eq("discord_id", getDiscordId(user))
      .maybeSingle();
    userId = data?.id ?? null;
  }

  const { error } = await createFeedbackSubmission(service, validation.data, userId);

  if (error) {
    console.error("[feedback] failed to save submission", error);
    return apiError("failed to save feedback", 500);
  }

  return apiOk({ success: true }, { status: 201 });
}
