import { createServiceClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

const OFFICIAL_VERSATILE_HERITAGES = [
  { name: "Aiuvarin", rarity: "Common", aonId: 69 },
  { name: "Dromaar", rarity: "Common", aonId: 70 },
  { name: "Aphorite", rarity: "Uncommon", aonId: 28 },
  { name: "Ardande", rarity: "Uncommon", aonId: 57 },
  { name: "Changeling", rarity: "Uncommon", aonId: 67 },
  { name: "Dhampir", rarity: "Uncommon", aonId: 85 },
  { name: "Dragonblood", rarity: "Uncommon", aonId: 86 },
  { name: "Duskwalker", rarity: "Uncommon", aonId: 87 },
  { name: "Ganzi", rarity: "Uncommon", aonId: 32 },
  { name: "Hungerseed", rarity: "Uncommon", aonId: 94 },
  { name: "Ifrit", rarity: "Uncommon", aonId: 33 },
  { name: "Nephilim", rarity: "Uncommon", aonId: 68 },
  { name: "Oread", rarity: "Uncommon", aonId: 34 },
  { name: "Suli", rarity: "Uncommon", aonId: 35 },
  { name: "Sylph", rarity: "Uncommon", aonId: 36 },
  { name: "Talos", rarity: "Uncommon", aonId: 58 },
  { name: "Undine", rarity: "Uncommon", aonId: 37 },
  { name: "Beastkin", rarity: "Rare", aonId: 29 },
  { name: "Reflection", rarity: "Rare", aonId: 97 },
] as const;

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = createServiceClient();

  const [ancestryResult, heritagesResult, allHeritagesResult] = await Promise.all([
    supabase.from("ancestries").select("*").eq("id", id).single(),
    supabase.from("heritages").select("*").eq("ancestry_id", id).order("name"),
    supabase.from("heritages").select("*").order("name"),
  ]);

  if (ancestryResult.error || !ancestryResult.data) {
    return NextResponse.json({ error: "Ancestry not found" }, { status: 404 });
  }

  const allHeritages = allHeritagesResult.data ?? [];
  const existingNames = new Set(allHeritages.map((h) => String(h.name).toLowerCase()));
  const fallbackVersatileHeritages = OFFICIAL_VERSATILE_HERITAGES.filter(
    (heritage) => !existingNames.has(heritage.name.toLowerCase())
  ).map((heritage) => ({
    id: `aon-versatile-${heritage.aonId}`,
    ancestry_id: id,
    name: heritage.name,
    description: `Official ${heritage.rarity.toLowerCase()} versatile heritage from Archives of Nethys.`,
    traits: ["versatile", heritage.name.toLowerCase()],
    benefits: {
      rarity: heritage.rarity,
      aon_id: heritage.aonId,
      aon_url: `https://2e.aonprd.com/Ancestries.aspx?ID=${heritage.aonId}`,
    },
    is_versatile: true,
    is_official: true,
    source: "Archives of Nethys",
    created_at: new Date(0).toISOString(),
  }));

  return NextResponse.json({
    ...ancestryResult.data,
    heritages: heritagesResult.data ?? [],
    allHeritages: [...allHeritages, ...fallbackVersatileHeritages].sort((a, b) =>
      a.name.localeCompare(b.name)
    ),
  });
}
