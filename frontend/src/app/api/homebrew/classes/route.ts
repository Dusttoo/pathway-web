import { createClient, createServiceClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

function cleanLoreSkill(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const topic = value
    .trim()
    .replace(/\s+lore$/i, "")
    .replace(/\s+/g, " ");
  return topic ? `${topic} Lore` : null;
}

function loreKey(value: string): string {
  return `lore:${value
    .replace(/\s+lore$/i, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "")}`;
}

const CLASS_PROFICIENCY_KEYS = [
  "classDC",
  "perception",
  "fortitude",
  "reflex",
  "will",
  "heavy",
  "medium",
  "light",
  "unarmored",
  "advanced",
  "martial",
  "simple",
  "unarmed",
  "castingArcane",
  "castingDivine",
  "castingOccult",
  "castingPrimal",
];

const DEFAULT_CLASS_PROFICIENCIES: Record<string, number> = {
  classDC: 2,
  perception: 2,
  fortitude: 2,
  reflex: 2,
  will: 2,
  heavy: 0,
  medium: 0,
  light: 2,
  unarmored: 2,
  advanced: 0,
  martial: 0,
  simple: 2,
  unarmed: 2,
  castingArcane: 0,
  castingDivine: 0,
  castingOccult: 0,
  castingPrimal: 0,
};

function proficiencyRank(value: unknown, fallback: number): number {
  const n = typeof value === "number" ? value : parseInt(String(value ?? ""), 10);
  return [0, 2, 4, 6, 8].includes(n) ? n : fallback;
}

function cleanClassProficiencies(value: unknown): Record<string, number> {
  const input =
    value && typeof value === "object" && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : {};
  return Object.fromEntries(
    CLASS_PROFICIENCY_KEYS.map((key) => [
      key,
      proficiencyRank(input[key], DEFAULT_CLASS_PROFICIENCIES[key] ?? 0),
    ])
  );
}

const SPELL_TRADITIONS = new Set(["arcane", "divine", "occult", "primal"]);
const SPELLCASTING_TYPES = new Set(["prepared", "spontaneous"]);

function cleanSlotRow(value: unknown, max = 9): number[] {
  const row = Array.isArray(value) ? value : [];
  return Array.from({ length: 10 }, (_, i) => {
    const raw = row[i];
    const n = typeof raw === "number" ? raw : parseInt(String(raw ?? "0"), 10);
    return Number.isFinite(n) ? Math.max(0, Math.min(max, n)) : 0;
  });
}

function cleanSlotProgression(value: unknown, max = 9): Record<string, number[]> {
  const input =
    value && typeof value === "object" && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : {};
  return Object.fromEntries(
    Array.from({ length: 20 }, (_, i) => {
      const level = String(i + 1);
      return [level, cleanSlotRow(input[level], max)];
    })
  );
}

function cleanSmallNumber(value: unknown, fallback: number, max: number): number {
  const n = typeof value === "number" ? value : parseInt(String(value ?? ""), 10);
  return Number.isFinite(n) ? Math.max(0, Math.min(max, n)) : fallback;
}

async function resolveUser() {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  if (!authUser) return null;

  const service = createServiceClient();
  const discordId =
    authUser.identities?.find((i) => i.provider === "discord")?.identity_data?.provider_id ??
    authUser.id;

  const { data: dbUser } = await service
    .from("users")
    .select("id")
    .eq("discord_id", discordId)
    .maybeSingle();

  return dbUser ? { service, appUserId: dbUser.id } : null;
}

export async function GET() {
  const ctx = await resolveUser();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await ctx.service
    .from("character_classes")
    .select("*")
    .eq("is_official", false)
    .eq("created_by_user_id", ctx.appUserId)
    .order("name");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function POST(request: Request) {
  const ctx = await resolveUser();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const {
    name,
    class_hp,
    key_attribute,
    is_spellcaster,
    spellcasting_ability,
    spellcasting_type,
    spellcasting_tradition,
    cantrips_known,
    focus_points,
    spell_slot_progression,
    spells_known_progression,
    advancement_text,
    feature_details_text,
    class_feats_text,
    focus_spells_text,
    trained_skill_count,
    class_trained_skills,
    class_lore_skills,
    class_proficiencies,
    description,
  } = body;

  if (!name?.trim()) {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }
  if (!class_hp || class_hp < 4 || class_hp > 12) {
    return NextResponse.json({ error: "class_hp must be between 4 and 12" }, { status: 400 });
  }

  const keyAttrList: string[] = Array.isArray(key_attribute)
    ? key_attribute
    : key_attribute
      ? [key_attribute]
      : ["str"];

  // Build initial_proficiencies from class-trained skills
  const trainedSkills: string[] = Array.isArray(class_trained_skills) ? class_trained_skills : [];
  const loreSkills = Array.isArray(class_lore_skills)
    ? class_lore_skills.map(cleanLoreSkill).filter((skill): skill is string => !!skill)
    : [];
  const grantedProficiencies = cleanClassProficiencies(class_proficiencies);
  const spellType = SPELLCASTING_TYPES.has(spellcasting_type) ? spellcasting_type : "prepared";
  const spellTradition = SPELL_TRADITIONS.has(spellcasting_tradition)
    ? spellcasting_tradition
    : "arcane";
  const cantripsKnown = cleanSmallNumber(cantrips_known, 5, 10);
  const focusPoints = cleanSmallNumber(focus_points, 0, 3);
  const slotProgression = cleanSlotProgression(spell_slot_progression);
  const spellsKnownProgression = cleanSlotProgression(spells_known_progression, 20);
  const ALL_SKILLS = [
    "acrobatics",
    "arcana",
    "athletics",
    "crafting",
    "deception",
    "diplomacy",
    "intimidation",
    "medicine",
    "nature",
    "occultism",
    "performance",
    "religion",
    "society",
    "stealth",
    "survival",
    "thievery",
  ];
  const proficiencies: Record<string, number> = {
    ...grantedProficiencies,
    ...Object.fromEntries(ALL_SKILLS.map((s) => [s, 0])),
    ...Object.fromEntries(trainedSkills.map((s) => [s, 2])),
    ...Object.fromEntries(loreSkills.map((s) => [loreKey(s), 2])),
  };

  const { data, error } = await ctx.service
    .from("character_classes")
    .insert({
      name: name.trim(),
      class_hp,
      key_attribute: keyAttrList,
      is_spellcaster: !!is_spellcaster,
      spellcasting_ability: is_spellcaster ? (spellcasting_ability ?? null) : null,
      description: description ?? null,
      is_official: false,
      created_by_user_id: ctx.appUserId,
      source: "Homebrew",
      initial_proficiencies: proficiencies,
      class_features: {},
      class_metadata: {
        trained_skill_count: trained_skill_count ?? 3,
        class_lore_skills: loreSkills,
        spellcasting_type: is_spellcaster ? spellType : null,
        spellcasting_tradition: is_spellcaster ? spellTradition : null,
        cantrips_known: is_spellcaster ? cantripsKnown : 0,
        focus_points: is_spellcaster ? focusPoints : 0,
        spell_slot_progression: is_spellcaster ? slotProgression : {},
        spells_known_progression: is_spellcaster ? spellsKnownProgression : {},
        advancement_text: typeof advancement_text === "string" ? advancement_text.trim() : "",
        feature_details_text:
          typeof feature_details_text === "string" ? feature_details_text.trim() : "",
        class_feats_text: typeof class_feats_text === "string" ? class_feats_text.trim() : "",
        focus_spells_text: typeof focus_spells_text === "string" ? focus_spells_text.trim() : "",
      },
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data, { status: 201 });
}

export async function DELETE(request: Request) {
  const ctx = await resolveUser();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await request.json();
  if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

  const { data: existing } = await ctx.service
    .from("character_classes")
    .select("created_by_user_id, is_official")
    .eq("id", id)
    .single();

  if (!existing || existing.is_official || existing.created_by_user_id !== ctx.appUserId) {
    return NextResponse.json({ error: "Not found or not yours" }, { status: 403 });
  }

  const { error } = await ctx.service.from("character_classes").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ ok: true });
}
