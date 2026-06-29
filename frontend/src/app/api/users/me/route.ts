import { createClient, createServiceClient } from "@/lib/supabase/server";
import { apiError, apiOk, extractDiscordId, notFound, unauthorized } from "@/lib/api";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) return unauthorized();

  const service = createServiceClient();
  const { data, error } = await service
    .from("users")
    .select("*")
    .eq("discord_id", extractDiscordId(authUser))
    .single();

  if (error || !data) return notFound("User not found");

  return apiOk(data);
}

export async function PATCH(request: Request) {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) return unauthorized();

  const body = await request.json();
  const update: { email?: string } = {};
  if (typeof body.email === "string") update.email = body.email;

  const service = createServiceClient();
  const { data, error } = await service
    .from("users")
    .update(update)
    .eq("discord_id", extractDiscordId(authUser))
    .select()
    .single();

  if (error) return apiError(error.message, 400);

  return apiOk(data);
}
