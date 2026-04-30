import { createServiceClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q        = searchParams.get("q") ?? "";
  const itemType = searchParams.get("item_type");
  const level    = searchParams.get("level");
  const page     = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const limit    = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "25")));
  const offset   = (page - 1) * limit;

  const supabase = createServiceClient();
  let query = supabase
    .from("items")
    .select("*", { count: "exact" })
    .eq("is_official", true)
    .order("level", { ascending: true })
    .order("name",  { ascending: true })
    .range(offset, offset + limit - 1);

  // `name` = case-insensitive exact match (for modal lookups from character sheets)
  // `q`    = substring search (for browse/search UI)
  const nameExact = searchParams.get("name");
  if (nameExact) {
    query = query.ilike("name", nameExact);
  } else if (q) {
    query = query.ilike("name", `%${q}%`);
  }

  if (itemType) query = query.eq("item_type", itemType);
  if (level)    query = query.eq("level", parseInt(level));

  const { data, count, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data, total: count, page, limit });
}
