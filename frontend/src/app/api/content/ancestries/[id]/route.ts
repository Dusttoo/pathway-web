import { createServiceClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = createServiceClient();

  const [ancestryResult, heritagesResult, versatileHeritagesResult] = await Promise.all([
    supabase.from("ancestries").select("*").eq("id", id).single(),
    supabase.from("heritages").select("*").eq("ancestry_id", id).order("name"),
    supabase.from("heritages").select("*").eq("is_versatile", true).order("name"),
  ]);

  if (ancestryResult.error || !ancestryResult.data) {
    return NextResponse.json({ error: "Ancestry not found" }, { status: 404 });
  }

  return NextResponse.json({
    ...ancestryResult.data,
    heritages: heritagesResult.data ?? [],
    versatileHeritages: versatileHeritagesResult.data ?? [],
  });
}
