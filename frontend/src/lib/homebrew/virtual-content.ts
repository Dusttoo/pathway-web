type SupabaseService = {
  from: (table: string) => any;
};

export type VirtualHomebrewRow = {
  id: string;
  name: string | null;
  type: string | null;
  data: Record<string, unknown> | null;
  added_by?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

const VIRTUAL_TYPES = new Set(["feat", "heritage", "ancestry", "class", "background"]);

function virtualType(row: VirtualHomebrewRow): string {
  const dataType = typeof row.data?._homebrew_type === "string" ? row.data._homebrew_type : null;
  return dataType || row.type || "item";
}

function text(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function numberValue(value: unknown, fallback: number): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number.parseInt(value, 10);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

function textList(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((item) => (typeof item === "string" ? item.trim() : "")).filter(Boolean);
  }
  if (typeof value === "string") {
    return value
      .split(/[,;\n]/)
      .map((item) => item.trim())
      .filter(Boolean);
  }
  if (value && typeof value === "object") {
    return Object.entries(value)
      .filter(([, rank]) => Number(rank) > 0 || rank === true)
      .map(([name]) => name);
  }
  return [];
}

function sourceText(data: Record<string, unknown>): string {
  const direct = text(data.source) ?? text(data.source_book);
  if (direct) return direct;

  if (data.source && typeof data.source === "object") {
    const source = data.source as Record<string, unknown>;
    const sourceName = text(source.source_text) ?? text(source.book);
    const page = text(source.page);
    if (sourceName && page) return `${sourceName} pg. ${page}`;
    if (sourceName) return sourceName;
  }

  return "Homebrew";
}

function normalized(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function proficiencyRank(value: unknown): number {
  const raw = text(value)?.toLowerCase() ?? "";
  if (raw.includes("legendary")) return 8;
  if (raw.includes("master")) return 6;
  if (raw.includes("expert")) return 4;
  if (raw.includes("trained")) return 2;
  return 0;
}

export async function fetchVirtualHomebrew(
  supabase: SupabaseService,
  type: "ancestry" | "class" | "background" | "heritage"
): Promise<VirtualHomebrewRow[]> {
  const storageTypes = VIRTUAL_TYPES.has(type) ? ["item", type] : [type];
  const { data, error } = await supabase
    .from("homebrew_entries")
    .select("*")
    .in("type", storageTypes)
    .order("name", { ascending: true });

  if (error || !Array.isArray(data)) return [];
  return (data as VirtualHomebrewRow[]).filter((row) => virtualType(row) === type);
}

export async function fetchVirtualHomebrewById(
  supabase: SupabaseService,
  id: string,
  type: "ancestry" | "class" | "background" | "heritage"
): Promise<VirtualHomebrewRow | null> {
  const { data, error } = await supabase
    .from("homebrew_entries")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error || !data) return null;
  const row = data as VirtualHomebrewRow;
  return virtualType(row) === type ? row : null;
}

export function virtualAncestry(row: VirtualHomebrewRow) {
  const data = row.data ?? {};
  const name = text(data.name) ?? text(row.name) ?? "Unnamed Ancestry";

  return {
    id: row.id,
    name,
    ancestry_hp: numberValue(data.hp ?? data.ancestry_hp, 8),
    attribute_boosts: textList(data.ability_boosts ?? data.attribute_boosts),
    attribute_flaws: textList(data.ability_flaw ?? data.attribute_flaws),
    bonus_languages: 0,
    created_at: row.created_at ?? null,
    created_by_user_id: row.added_by ?? null,
    description: text(data.description),
    discord_guild_id: null,
    is_official: false,
    languages: textList(data.languages),
    rarity: text(data.rarity) ?? "Common",
    senses: textList(data.senses),
    size: text(data.size) ?? "Medium",
    source: sourceText(data),
    special_abilities: textList(data.features ?? data.special_abilities),
    speed: numberValue(data.speed, 25),
    traits: textList(data.traits),
    updated_at: row.updated_at ?? null,
  };
}

export function virtualClass(row: VirtualHomebrewRow) {
  const data = row.data ?? {};
  const name = text(data.name) ?? text(row.name) ?? "Unnamed Class";
  const spellcastingTradition = text(data.spellcasting_tradition);

  return {
    id: row.id,
    name,
    class_features: textList(data.features ?? data.class_features),
    class_hp: numberValue(data.hp_per_level ?? data.class_hp, 8),
    class_metadata: {
      description: text(data.description),
      homebrew_entry_id: row.id,
      spellcasting_tradition: spellcastingTradition,
      source: sourceText(data),
    },
    created_at: row.created_at ?? new Date(0).toISOString(),
    created_by_user_id: row.added_by ?? null,
    description: text(data.description),
    discord_guild_id: null,
    initial_proficiencies: {
      attacks: textList(data.attacks),
      defenses: textList(data.defenses),
      perception: proficiencyRank(data.perception),
      saving_throws: data.saving_throws ?? {},
      skills: textList(data.skills),
      class_dc: proficiencyRank(data.class_dc),
    },
    is_official: false,
    is_spellcaster: Boolean(spellcastingTradition || data.is_spellcaster),
    key_attribute: textList(data.key_ability ?? data.key_attribute),
    source: sourceText(data),
    spellcasting_ability: spellcastingTradition,
    updated_at: row.updated_at ?? new Date(0).toISOString(),
  };
}

export function virtualBackground(row: VirtualHomebrewRow) {
  const data = row.data ?? {};
  const name = text(data.name) ?? text(row.name) ?? "Unnamed Background";

  return {
    id: row.id,
    name,
    attribute_boosts: textList(data.ability_boosts ?? data.attribute_boosts),
    background_metadata: {
      homebrew_entry_id: row.id,
      skill_feat: text(data.skill_feat),
      special: text(data.special),
    },
    created_at: row.created_at ?? null,
    created_by_user_id: row.added_by ?? null,
    description: text(data.description),
    discord_guild_id: null,
    is_official: false,
    lore_skills: textList(data.lore_skill ?? data.lore_skills),
    rarity: text(data.rarity) ?? "Common",
    skill_proficiencies: textList(data.trained_skill ?? data.skill_proficiencies),
    source: sourceText(data),
    updated_at: row.updated_at ?? null,
  };
}

export function virtualHeritage(row: VirtualHomebrewRow, ancestryId: string | null = null) {
  const data = row.data ?? {};
  const name = text(data.name) ?? text(row.name) ?? "Unnamed Heritage";
  const heritageType = text(data.heritage_type);
  const isVersatile = normalized(heritageType ?? "").includes("versatile");

  return {
    id: row.id,
    ancestry_id: ancestryId,
    name,
    description: text(data.description),
    traits: textList(data.traits),
    benefits: {
      ancestry: text(data.ancestry),
      homebrew_entry_id: row.id,
      heritage_type: heritageType,
      prerequisites: text(data.prerequisites),
      special: text(data.special),
    },
    is_versatile: isVersatile,
    is_official: false,
    source: sourceText(data),
    created_at: row.created_at ?? new Date(0).toISOString(),
  };
}

export function heritageMatchesAncestry(row: VirtualHomebrewRow, ancestryName: string): boolean {
  const data = row.data ?? {};
  const heritageType = normalized(text(data.heritage_type) ?? "");
  if (heritageType.includes("versatile")) return false;

  const ancestry = text(data.ancestry);
  return ancestry ? normalized(ancestry) === normalized(ancestryName) : false;
}
