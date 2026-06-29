import type { SupabaseClient, User } from "@supabase/supabase-js";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/types/database.types";

/**
 * Centralized auth/identity resolution for Route Handlers.
 *
 * Background: Supabase auth identifies a user by their auth UUID, but every
 * user-scoped table is keyed by `users.id`, which is looked up via the Discord
 * snowflake (`users.discord_id`). That two-step resolution was copy-pasted into
 * every handler. Centralizing it removes drift and gives us one place to harden.
 */

export type AppUserContext = {
  /** The raw Supabase auth user. */
  authUser: User;
  /** The application-level `users.id` (UUID) used as the FK on user data. */
  appUserId: string;
  /** Service-role client for cross-table reads/writes that RLS can't express. */
  service: SupabaseClient<Database>;
};

/**
 * Extract the Discord snowflake from a Supabase auth user, falling back to the
 * Supabase auth id when no Discord identity is linked. Pure and unit-testable.
 */
export function extractDiscordId(
  authUser: Pick<User, "id" | "identities">,
): string {
  return (
    authUser.identities?.find((i) => i.provider === "discord")?.identity_data
      ?.provider_id ?? authUser.id
  );
}

/**
 * Resolve the logged-in user to their app `users.id` and return a service
 * client for cross-table work. Returns `null` when the request is
 * unauthenticated or the user row does not exist yet — callers should respond
 * with `unauthorized()` in that case.
 */
export async function resolveAppUser(): Promise<AppUserContext | null> {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  if (!authUser) return null;

  const service = createServiceClient();
  const discordId = extractDiscordId(authUser);

  const { data: dbUser } = await service
    .from("users")
    .select("id")
    .eq("discord_id", discordId)
    .single();

  return dbUser ? { authUser, appUserId: dbUser.id, service } : null;
}
