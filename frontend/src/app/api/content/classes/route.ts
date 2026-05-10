import { createServiceClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") ?? "";
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "25")));
  const offset = (page - 1) * limit;

  const includeHomebrew = searchParams.get("include_homebrew") === "true";

  const supabase = createServiceClient();
  let query = supabase
    .from("character_classes")
    .select("*", { count: "exact" })
    .order("name", { ascending: true })
    .range(offset, offset + limit - 1);

  if (!includeHomebrew) {
    query = query.eq("is_official", true);
  }

  if (q) query = query.ilike("name", `%${q}%`);

  const { data, count, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data, total: count, page, limit });
}
