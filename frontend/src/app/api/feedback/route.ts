import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const body = await request.json().catch(() => ({}));
  const { type, title, description } = body;

  if (!title || !description) {
    return NextResponse.json({ error: "title and description are required" }, { status: 400 });
  }

  // Log feedback to console for now — persisted to DB in v2
  console.log("[feedback]", { user: user?.id, type, title, description: description.slice(0, 200) });

  return NextResponse.json({ success: true }, { status: 201 });
}
