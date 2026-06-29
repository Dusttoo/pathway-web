import { createClient, createServiceClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// Only allow same-origin, relative redirect targets. A raw `next` value like
// "//evil.com", "https://evil.com", or "@evil.com" would otherwise let
// `${origin}${next}` resolve to another site (open redirect). Require a single
// leading slash and reject protocol-relative ("//") or backslash tricks.
function safeNext(raw: string | null): string {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//") || raw.startsWith("/\\")) {
    return "/dashboard";
  }
  return raw;
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = safeNext(searchParams.get("next"));

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
      id: authUser.id,           // pin public.users.id = auth.users.id so RLS works
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
