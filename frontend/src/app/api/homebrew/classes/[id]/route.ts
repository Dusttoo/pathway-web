import { createClient, createServiceClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import type { Json } from "@/lib/types/database.types";

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

function objectRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
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

async function resolveOwnership(id: string) {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  if (!authUser) return { error: "Unauthorized", status: 401 } as const;

  const service = createServiceClient();
  const discordId =
    authUser.identities?.find((i) => i.provider === "discord")?.identity_data?.provider_id ??
    authUser.id;

  const { data: dbUser } = await service
    .from("users")
    .select("id")
    .eq("discord_id", discordId)
    .maybeSingle();

  if (!dbUser) return { error: "User not found", status: 404 } as const;

  const { data: cls } = await service
    .from("character_classes")
    .select("id, created_by_user_id, is_official, class_metadata")
    .eq("id", id)
    .maybeSingle();

  if (!cls || cls.is_official || cls.created_by_user_id !== dbUser.id) {
    return { error: "Not found or not yours", status: 403 } as const;
  }

  return { service, appUserId: dbUser.id, classMetadata: cls.class_metadata } as const;
}

// ── PATCH /api/homebrew/classes/[id] ─────────────────────────────────────────
// Body: { name?, class_hp?, key_attribute?, is_spellcaster?, spellcasting_ability?,
//         trained_skill_count?, class_trained_skills?, description? }

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const resolved = await resolveOwnership(id);
  if ("error" in resolved) {
    return NextResponse.json({ error: resolved.error }, { status: resolved.status });
  }

  let body: {
    name?: string;
    class_hp?: number;
    key_attribute?: string | string[];
    is_spellcaster?: boolean;
    spellcasting_ability?: string;
    spellcasting_type?: string;
    spellcasting_tradition?: string;
    cantrips_known?: number;
    focus_points?: number;
    spell_slot_progression?: Record<string, number[]>;
    spells_known_progression?: Record<string, number[]>;
    advancement_text?: string;
    feature_details_text?: string;
    class_feats_text?: string;
    focus_spells_text?: string;
    trained_skill_count?: number;
    class_trained_skills?: string[];
    class_lore_skills?: string[];
    class_proficiencies?: Record<string, number>;
    description?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

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

  if (class_hp !== undefined && (class_hp < 4 || class_hp > 12)) {
    return NextResponse.json({ error: "class_hp must be between 4 and 12" }, { status: 400 });
  }

  // Rebuild initial_proficiencies from trained skills
  const trainedSkills: string[] = Array.isArray(class_trained_skills) ? class_trained_skills : [];
  const loreSkills = Array.isArray(class_lore_skills)
    ? class_lore_skills.map(cleanLoreSkill).filter((skill): skill is string => !!skill)
    : undefined;
  const grantedProficiencies = cleanClassProficiencies(class_proficiencies);
  const spellType = SPELLCASTING_TYPES.has(spellcasting_type ?? "")
    ? spellcasting_type
    : "prepared";
  const spellTradition = SPELL_TRADITIONS.has(spellcasting_tradition ?? "")
    ? spellcasting_tradition
    : "arcane";
  const cantripsKnown = cleanSmallNumber(cantrips_known, 5, 10);
  const focusPoints = cleanSmallNumber(focus_points, 0, 3);
  const slotProgression = cleanSlotProgression(spell_slot_progression);
  const spellsKnownProgression = cleanSlotProgression(spells_known_progression, 20);
  const proficiencies: Record<string, number> = {
    ...grantedProficiencies,
    ...Object.fromEntries(ALL_SKILLS.map((s) => [s, 0])),
    ...Object.fromEntries(trainedSkills.map((s) => [s, 2])),
    ...(loreSkills ? Object.fromEntries(loreSkills.map((s) => [loreKey(s), 2])) : {}),
  };

  const keyAttrList: string[] | undefined =
    key_attribute !== undefined
      ? Array.isArray(key_attribute)
        ? key_attribute
        : [key_attribute]
      : undefined;

  const updates: {
    name?: string;
    class_hp?: number;
    key_attribute?: string[];
    is_spellcaster?: boolean;
    spellcasting_ability?: string | null;
    description?: string | null;
    initial_proficiencies?: Json;
    class_metadata?: Json;
  } = {};

  if (name !== undefined) updates.name = name.trim();
  if (class_hp !== undefined) updates.class_hp = class_hp;
  if (keyAttrList !== undefined) updates.key_attribute = keyAttrList;
  if (is_spellcaster !== undefined) {
    updates.is_spellcaster = !!is_spellcaster;
    updates.spellcasting_ability = is_spellcaster ? (spellcasting_ability ?? null) : null;
  }
  if (description !== undefined) updates.description = description || null;
  if (
    class_trained_skills !== undefined ||
    class_lore_skills !== undefined ||
    class_proficiencies !== undefined
  ) {
    updates.initial_proficiencies = proficiencies as Json;
  }
  if (
    trained_skill_count !== undefined ||
    loreSkills !== undefined ||
    spellcasting_type !== undefined ||
    spellcasting_tradition !== undefined ||
    cantrips_known !== undefined ||
    focus_points !== undefined ||
    spell_slot_progression !== undefined ||
    spells_known_progression !== undefined ||
    advancement_text !== undefined ||
    feature_details_text !== undefined ||
    class_feats_text !== undefined ||
    focus_spells_text !== undefined ||
    is_spellcaster !== undefined
  ) {
    const spellcaster =
      is_spellcaster ?? Boolean(objectRecord(resolved.classMetadata).spellcasting_type);
    updates.class_metadata = {
      ...objectRecord(resolved.classMetadata),
      ...(trained_skill_count !== undefined ? { trained_skill_count } : {}),
      ...(loreSkills !== undefined ? { class_lore_skills: loreSkills } : {}),
      spellcasting_type: spellcaster ? spellType : null,
      spellcasting_tradition: spellcaster ? spellTradition : null,
      cantrips_known: spellcaster ? cantripsKnown : 0,
      focus_points: spellcaster ? focusPoints : 0,
      spell_slot_progression: spellcaster ? slotProgression : {},
      spells_known_progression: spellcaster ? spellsKnownProgression : {},
      ...(advancement_text !== undefined ? { advancement_text: advancement_text.trim() } : {}),
      ...(feature_details_text !== undefined
        ? { feature_details_text: feature_details_text.trim() }
        : {}),
      ...(class_feats_text !== undefined ? { class_feats_text: class_feats_text.trim() } : {}),
      ...(focus_spells_text !== undefined
        ? { focus_spells_text: focus_spells_text.trim() }
        : {}),
    } as Json;
  }

  const { data, error } = await resolved.service
    .from("character_classes")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data });
}
