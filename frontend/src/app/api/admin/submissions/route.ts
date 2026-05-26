import { createClient, createServiceClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) return { error: "Unauthorized", status: 401 as const };

  const discordId =
    authUser.identities?.find((identity) => identity.provider === "discord")?.identity_data
      ?.provider_id ?? authUser.id;

  const service = createServiceClient();
  const { data: callerRow } = await service
    .from("users")
    .select("is_admin")
    .eq("discord_id", discordId)
    .single();

  if (!callerRow?.is_admin) return { error: "Forbidden", status: 403 as const };

  return { service };
}

export async function GET() {
  const auth = await requireAdmin();

  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const db = auth.service as unknown as { from: (table: string) => any };
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

  if (feedbackResult.error || contactResult.error) {
    console.error("[admin/submissions] failed to load", {
      feedback: feedbackResult.error,
      contact: contactResult.error,
    });
    return NextResponse.json({ error: "Failed to load submissions" }, { status: 500 });
  }

  return NextResponse.json({
    feedback: feedbackResult.data ?? [],
    contact: contactResult.data ?? [],
  });
}
