import { createClient, createServiceClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  // Supabase redirects here with ?error= params when the OAuth exchange fails
  const supabaseError = searchParams.get("error_description") ?? searchParams.get("error");
  if (supabaseError) {
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(supabaseError)}`
    );
  }

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=missing_code`);
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.session) {
    return NextResponse.redirect(`${origin}/login?error=auth_failed`);
  }

  // Upsert Discord user into our users table
  const authUser = data.session.user;
  const discordIdentity = authUser.identities?.find(
    (i) => i.provider === "discord"
  );
  const discordId =
    discordIdentity?.identity_data?.provider_id ?? authUser.id;

  const service = createServiceClient();
  await service.from("users").upsert(
    {
      discord_id: discordId,
      discord_username:
        authUser.user_metadata?.full_name ??
        authUser.user_metadata?.name ??
        authUser.user_metadata?.custom_claims?.global_name ??
        "Unknown",
      discord_avatar: authUser.user_metadata?.avatar_url ?? null,
      email: authUser.email ?? null,
    },
    { onConflict: "discord_id" }
  );

  return NextResponse.redirect(`${origin}${next}`);
}
