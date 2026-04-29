import { createServiceClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") ?? "";
  const tradition = searchParams.get("tradition");
  const level = searchParams.get("level");
  const isFocus = searchParams.get("is_focus");
  const isRitual = searchParams.get("is_ritual");
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "25")));
  const offset = (page - 1) * limit;

  const supabase = createServiceClient();
  let query = supabase
    .from("spells")
    .select("*", { count: "exact" })
    .eq("is_official", true)
    .order("level", { ascending: true })
    .order("name", { ascending: true })
    .range(offset, offset + limit - 1);

  if (q) query = query.ilike("name", `%${q}%`);
  if (tradition) query = query.contains("traditions", [tradition]);
  if (level) query = query.eq("level", parseInt(level));
  if (isFocus === "true") query = query.eq("is_focus_spell", true);
  if (isRitual === "true") query = query.eq("is_ritual", true);

  const { data, count, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data, total: count, page, limit });
}
