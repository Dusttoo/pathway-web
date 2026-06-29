import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database.types";
import type { FeedbackSubmissionInput } from "./schema";

type UntypedClient = {
  from: (table: string) => {
    insert: (values: Record<string, unknown>) => Promise<{ error: { message: string } | null }>;
  };
};

export async function createFeedbackSubmission(
  service: SupabaseClient<Database>,
  input: FeedbackSubmissionInput,
  userId: string | null
) {
  const db = service as unknown as UntypedClient;

  return db.from("feedback_submissions").insert({
    user_id: userId,
    type: input.type,
    title: input.title,
    description: input.description,
    metadata: input.metadata,
  });
}
