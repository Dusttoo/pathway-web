import { createServiceClient } from "@/lib/supabase/server";
import { dedupeItems, itemCompletenessScore, type DedupeItemRow } from "@/lib/items/dedupe";
import { NextResponse } from "next/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("items")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Item not found" }, { status: 404 });
  }

  const item = data as DedupeItemRow;
  if (item.name) {
    const { data: candidates } = await supabase
      .from("items")
      .select("*")
      .eq("name", item.name)
      .eq("level", item.level ?? 0);

    const canonical = dedupeItems((candidates ?? []) as DedupeItemRow[])[0];
    if (canonical && itemCompletenessScore(canonical) > itemCompletenessScore(item)) {
      return NextResponse.json(canonical);
    }
  }

  return NextResponse.json(item);
}
