import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database.types";
import type { UpdateCurrentUserInput } from "./schema";

type UserRow = Database["public"]["Tables"]["users"]["Row"];

export async function getCurrentUser(dbUser: UserRow) {
  return dbUser;
}

export async function updateCurrentUser(
  service: SupabaseClient<Database>,
  discordId: string,
  input: UpdateCurrentUserInput
) {
  const update: Database["public"]["Tables"]["users"]["Update"] = {};

  if (typeof input.email === "string") {
    update.email = input.email;
  }

  return service.from("users").update(update).eq("discord_id", discordId).select().single();
}
