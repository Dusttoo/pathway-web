import { createServiceClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") ?? "";
  const featType = searchParams.get("feat_type");
  const level = searchParams.get("level");
  const levelMin = searchParams.get("level_min");
  const levelMax = searchParams.get("level_max");
  const rarity = searchParams.get("rarity");
  const traits = searchParams.getAll("trait");
  const className = searchParams.get("class");
  const ancestry = searchParams.get("ancestry");
  const archetype = searchParams.get("archetype");
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "25")));
  const offset = (page - 1) * limit;

  const supabase = createServiceClient();
  let query = supabase
    .from("feats")
    .select("*", { count: "exact" })
    .eq("is_official", true)
    .order("level", { ascending: true })
    .order("name", { ascending: true })
    .range(offset, offset + limit - 1);

  const nameExact = searchParams.get("name");
  if (nameExact) {
    query = query.ilike("name", nameExact);
  } else if (q) {
    query = query.ilike("name", `%${q}%`);
  }
  if (featType) query = query.eq("feat_type", featType);
  if (level) query = query.eq("level", parseInt(level));
  if (levelMin) query = query.gte("level", parseInt(levelMin));
  if (levelMax) query = query.lte("level", parseInt(levelMax));
  if (rarity) query = query.eq("rarity", rarity);
  if (traits.length > 0) query = query.contains("traits", traits);
  if (className) query = query.contains("feat_metadata->classes", [className]);
  if (ancestry) query = query.contains("feat_metadata->ancestry", [ancestry]);
  if (archetype) query = query.contains("feat_metadata->archetype", [archetype]);

  const { data, count, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data, total: count, page, limit });
}
