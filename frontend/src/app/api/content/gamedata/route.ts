import { createServiceClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// Valid category values — acts as an allowlist so callers can't enumerate
// arbitrary table contents.
const VALID_CATEGORIES = new Set([
  "actions", "afflictions", "backgrounds", "class_features", "classes",
  "companions", "conditions", "creature_extras", "deities", "domains",
  "familiars", "hazards", "heritages", "kingdom", "languages", "planes",
  "relics", "rituals", "rules", "siege_weapons", "skills", "sources",
  "traits", "vehicles",
]);

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const category = searchParams.get("category") ?? "";
  const slug     = searchParams.get("slug") ?? "";
  const q        = searchParams.get("q") ?? "";
  const page     = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const limit    = Math.min(200, Math.max(1, parseInt(searchParams.get("limit") ?? "25")));
  const offset   = (page - 1) * limit;

  if (!category) {
    return NextResponse.json({ error: "category param required" }, { status: 400 });
  }
  if (!VALID_CATEGORIES.has(category)) {
    return NextResponse.json({ error: `unknown category: ${category}` }, { status: 400 });
  }

  const supabase = createServiceClient();

  // Single-entry lookup by slug — returns the full data object.
  if (slug) {
    const { data, error } = await supabase
      .from("gamedata")
      .select("slug, name, data, updated_at")
      .eq("category", category)
      .eq("slug", slug)
      .single();

    if (error) {
      const status = error.code === "PGRST116" ? 404 : 500;
      return NextResponse.json({ error: error.message }, { status });
    }
    return NextResponse.json({ data });
  }

  // Browse / search — paginated list with optional name filter.
  let query = supabase
    .from("gamedata")
    .select("slug, name, data, updated_at", { count: "exact" })
    .eq("category", category)
    .order("name", { ascending: true })
    .range(offset, offset + limit - 1);

  if (q) query = query.ilike("name", `%${q}%`);

  const { data, count, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data, total: count, page, limit, category });
}
