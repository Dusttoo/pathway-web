import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export type DiscordGuild = {
  id: string;
  name: string;
  icon: string | null;
};

export async function GET() {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const providerToken = session.provider_token;
  if (!providerToken) {
    return NextResponse.json({ error: "No Discord token — please log out and log back in." }, { status: 401 });
  }

  const res = await fetch("https://discord.com/api/v10/users/@me/guilds", {
    headers: { Authorization: `Bearer ${providerToken}` },
  });

  if (!res.ok) {
    return NextResponse.json({ error: "Failed to fetch guilds from Discord" }, { status: 502 });
  }

  const guilds: DiscordGuild[] = await res.json();
  return NextResponse.json(guilds.map((g) => ({ id: g.id, name: g.name, icon: g.icon })));
}
