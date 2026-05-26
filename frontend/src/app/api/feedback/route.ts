import { createClient, createServiceClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const body = await request.json().catch(() => ({}));
  const { type = "feedback", title, description, metadata = {} } = body;

  if (!title || !description) {
    return NextResponse.json({ error: "title and description are required" }, { status: 400 });
  }

  if (!["bug", "feature", "feedback"].includes(type)) {
    return NextResponse.json({ error: "invalid feedback type" }, { status: 400 });
  }

  const service = createServiceClient();
  const db = service as unknown as { from: (table: string) => any };
  const { error } = await db.from("feedback_submissions").insert({
    user_id: user?.id ?? null,
    type,
    title: String(title).slice(0, 500),
    description: String(description).slice(0, 10_000),
    metadata: metadata && typeof metadata === "object" ? metadata : {},
  });

  if (error) {
    console.error("[feedback] failed to save submission", error);
    return NextResponse.json({ error: "failed to save feedback" }, { status: 500 });
  }

  return NextResponse.json({ success: true }, { status: 201 });
}
