import type { SupabaseClient, User } from "@supabase/supabase-js";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/types/database.types";
import { apiError } from "./responses";

export type AuthContext = {
  authUser: User;
  dbUser: Database["public"]["Tables"]["users"]["Row"];
  discordId: string;
  service: SupabaseClient<Database>;
};

export type AuthResult =
  | { ok: true; context: AuthContext }
  | { ok: false; response: Response };

export type AdminResult =
  | { ok: true; context: AuthContext }
  | { ok: false; response: Response };

export function getDiscordId(authUser: Pick<User, "id" | "identities">) {
  return (
    authUser.identities?.find((identity) => identity.provider === "discord")?.identity_data
      ?.provider_id ?? authUser.id
  );
}

export async function requireAuth(): Promise<AuthResult> {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) {
    return { ok: false, response: apiError("Unauthorized", 401) };
  }

  const discordId = getDiscordId(authUser);
  const service = createServiceClient();
  const { data: dbUser, error } = await service
    .from("users")
    .select("*")
    .eq("discord_id", discordId)
    .single();

  if (error || !dbUser) {
    return { ok: false, response: apiError("User not found", 404) };
  }

  return {
    ok: true,
    context: {
      authUser,
      dbUser,
      discordId,
      service,
    },
  };
}

export async function requireAdmin(): Promise<AdminResult> {
  const auth = await requireAuth();

  if (!auth.ok) {
    return auth;
  }

  if (!auth.context.dbUser.is_admin) {
    return { ok: false, response: apiError("Forbidden", 403) };
  }

  return auth;
}

export async function withAuth(handler: (context: AuthContext) => Promise<Response> | Response) {
  const auth = await requireAuth();

  if (!auth.ok) {
    return auth.response;
  }

  return handler(auth.context);
}

export async function withAdmin(handler: (context: AuthContext) => Promise<Response> | Response) {
  const auth = await requireAdmin();

  if (!auth.ok) {
    return auth.response;
  }

  return handler(auth.context);
}
