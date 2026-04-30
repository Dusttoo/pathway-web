import { createClient, createServiceClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  // Verify the caller is an authenticated admin user.
  // We check the users table (not just the JWT) so a revoked admin flag
  // takes effect immediately without requiring a new session.
  const supabase = await createClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();
  if (!authUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const discordId =
    authUser.identities?.find((i) => i.provider === "discord")
      ?.identity_data?.provider_id ?? authUser.id;

  const service = createServiceClient();
  const { data: callerRow } = await service
    .from("users")
    .select("is_admin")
    .eq("discord_id", discordId)
    .single();

  if (!callerRow?.is_admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // encounters is not yet in the generated types — cast to bypass type checking
  // for those two queries until types are regenerated.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const enc = service as unknown as { from: (t: string) => any };

  // Fetch aggregate stats in parallel — all use service client to bypass RLS.
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
    enc.from("encounters").select("*", { count: "exact", head: true }),
    enc.from("encounters").select("*", { count: "exact", head: true }).eq("status", "active"),
    service.from("homebrew_entries").select("*", { count: "exact", head: true }),
    service
      .from("users")
      .select("id, discord_username, discord_id, is_admin, created_at")
      .order("created_at", { ascending: false })
      .limit(10),
  ]);

  return NextResponse.json({
    stats: {
      totalUsers: totalUsers ?? 0,
      totalCharacters: totalCharacters ?? 0,
      totalEncounters: totalEncounters ?? 0,
      activeEncounters: activeEncounters ?? 0,
      totalHomebrewEntries: totalHomebrewEntries ?? 0,
    },
    recentUsers: recentUsers ?? [],
  });
}
