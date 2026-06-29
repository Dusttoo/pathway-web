import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database.types";
import type { UpdateSubmissionInput } from "./schema";

type UntypedResult = {
  data?: unknown;
  error?: { message: string } | null;
  count?: number | null;
};

type UntypedQuery = PromiseLike<UntypedResult> & {
  select: (columns?: string, options?: { count?: "exact"; head?: boolean }) => UntypedQuery;
  update: (values: Record<string, unknown>) => UntypedQuery;
  eq: (column: string, value: unknown) => UntypedQuery;
  order: (column: string, options?: { ascending?: boolean }) => UntypedQuery;
  limit: (count: number) => UntypedQuery;
  single: () => Promise<UntypedResult>;
};

type UntypedClient = {
  from: (table: string) => UntypedQuery;
};

export async function getAdminStats(service: SupabaseClient<Database>) {
  const db = service as unknown as UntypedClient;
  const [
    { count: totalUsers },
    { count: totalCharacters },
    { count: totalEncounters },
    { count: activeEncounters },
    { count: totalHomebrewEntries },
    { data: recentUsers },
  ] = await Promise.all([
    service.from("users").select("*", { count: "exact", head: true }),
    service.from("characters").select("*", { count: "exact", head: true }),
    db.from("encounters").select("*", { count: "exact", head: true }),
    db.from("encounters").select("*", { count: "exact", head: true }).eq("status", "active"),
    service.from("homebrew_entries").select("*", { count: "exact", head: true }),
    service
      .from("users")
      .select("id, discord_username, discord_id, is_admin, created_at")
      .order("created_at", { ascending: false })
      .limit(10),
  ]);

  return {
    stats: {
      totalUsers: totalUsers ?? 0,
      totalCharacters: totalCharacters ?? 0,
      totalEncounters: totalEncounters ?? 0,
      activeEncounters: activeEncounters ?? 0,
      totalHomebrewEntries: totalHomebrewEntries ?? 0,
    },
    recentUsers: recentUsers ?? [],
  };
}

export async function listSubmissions(service: SupabaseClient<Database>) {
  const db = service as unknown as UntypedClient;

  const [feedbackResult, contactResult] = await Promise.all([
    db
      .from("feedback_submissions")
      .select("id, user_id, type, title, description, metadata, status, created_at")
      .order("created_at", { ascending: false })
      .limit(100),
    db
      .from("contact_submissions")
      .select(
        "id, name, email, subject, message, discord_username, ip_address, user_agent, status, created_at"
      )
      .order("created_at", { ascending: false })
      .limit(100),
  ]);

  return { feedbackResult, contactResult };
}

export async function updateSubmission(
  service: SupabaseClient<Database>,
  input: UpdateSubmissionInput
) {
  const db = service as unknown as UntypedClient;
  const table = input.kind === "feedback" ? "feedback_submissions" : "contact_submissions";

  return db
    .from(table)
    .update({ status: input.addressed ? "resolved" : "new" })
    .eq("id", input.id)
    .select("id, status")
    .single();
}
