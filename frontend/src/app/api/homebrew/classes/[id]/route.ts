import { createClient, createServiceClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import type { Json } from "@/lib/types/database.types";

const ALL_SKILLS = [
  "acrobatics", "arcana", "athletics", "crafting", "deception", "diplomacy",
  "intimidation", "medicine", "nature", "occultism", "performance", "religion",
  "society", "stealth", "survival", "thievery",
];

async function resolveOwnership(id: string) {
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  if (!authUser) return { error: "Unauthorized", status: 401 } as const;

  const service = createServiceClient();
  const discordId =
    authUser.identities?.find((i) => i.provider === "discord")
      ?.identity_data?.provider_id ?? authUser.id;

  const { data: dbUser } = await service
    .from("users")
    .select("id")
    .eq("discord_id", discordId)
    .maybeSingle();

  if (!dbUser) return { error: "User not found", status: 404 } as const;

  const { data: cls } = await service
    .from("character_classes")
    .select("id, created_by_user_id, is_official")
    .eq("id", id)
    .maybeSingle();

  if (!cls || cls.is_official || cls.created_by_user_id !== dbUser.id) {
    return { error: "Not found or not yours", status: 403 } as const;
  }

  return { service, appUserId: dbUser.id } as const;
}

// ── PATCH /api/homebrew/classes/[id] ─────────────────────────────────────────
// Body: { name?, class_hp?, key_attribute?, is_spellcaster?, spellcasting_ability?,
//         trained_skill_count?, class_trained_skills?, description? }

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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
    trained_skill_count?: number;
    class_trained_skills?: string[];
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
    trained_skill_count,
    class_trained_skills,
    description,
  } = body;

  if (class_hp !== undefined && (class_hp < 4 || class_hp > 12)) {
    return NextResponse.json({ error: "class_hp must be between 4 and 12" }, { status: 400 });
  }

  // Rebuild initial_proficiencies from trained skills
  const trainedSkills: string[] = Array.isArray(class_trained_skills)
    ? class_trained_skills
    : [];
  const proficiencies: Record<string, number> = {
    classDC: 2, perception: 2,
    fortitude: 2, reflex: 2, will: 2,
    heavy: 0, medium: 0, light: 2, unarmored: 2,
    advanced: 0, martial: 0, simple: 2, unarmed: 2,
    castingArcane: 0, castingDivine: 0, castingOccult: 0, castingPrimal: 0,
    ...Object.fromEntries(ALL_SKILLS.map((s) => [s, 0])),
    ...Object.fromEntries(trainedSkills.map((s) => [s, 2])),
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
  if (class_trained_skills !== undefined) updates.initial_proficiencies = proficiencies as Json;
  if (trained_skill_count !== undefined) {
    updates.class_metadata = { trained_skill_count } as Json;
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
