import { createClient, createServiceClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

async function resolveUserId(authUser: {
  id: string;
  identities?: { provider: string; identity_data?: Record<string, string> }[];
}): Promise<string | null> {
  const discordId =
    authUser.identities?.find((identity) => identity.provider === "discord")?.identity_data
      ?.provider_id ?? authUser.id;

  const service = createServiceClient();
  const { data } = await service.from("users").select("id").eq("discord_id", discordId).single();

  return data?.id ?? null;
}

function shareUrl(request: Request, shareId: string) {
  const configured =
    process.env.NEXT_PUBLIC_SITE_URL ??
    process.env.NEXT_PUBLIC_APP_URL ??
    process.env.VERCEL_PROJECT_PRODUCTION_URL;
  const origin = configured
    ? configured.startsWith("http")
      ? configured
      : `https://${configured}`
    : new URL(request.url).origin;

  return `${origin.replace(/\/$/, "")}/share/characters/${shareId}`;
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = (await request.json().catch(() => ({}))) as { enabled?: boolean };
  const enabled = body.enabled !== false;

  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = await resolveUserId(authUser);
  if (!userId) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const service = createServiceClient();
  const { data, error } = await service
    .from("characters")
    .update({ is_public: enabled })
    .eq("id", id)
    .eq("user_id", userId)
    .select("is_public, public_share_id")
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Character not found" }, { status: 404 });
  }

  return NextResponse.json({
    is_public: data.is_public,
    public_share_id: data.public_share_id,
    share_url: shareUrl(request, data.public_share_id),
  });
}
