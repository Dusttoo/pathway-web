import { createClient, createServiceClient } from "@/lib/supabase/server";
import type { Json, Tables, TablesInsert } from "@/lib/types/database.types";
import type { NativeBuildInput } from "@/lib/types/character";
import { NextResponse } from "next/server";

// ── Types ────────────────────────────────────────────────────────────────────

type AncestryRow = Tables<"ancestries">;
type ClassRow = Tables<"character_classes">;

// ── Helpers ──────────────────────────────────────────────────────────────────

const ANCESTRY_SIZE_MAP: Record<string, number> = {
  tiny: 1,
  small: 1,
  medium: 2,
  large: 3,
  huge: 4,
  gargantuan: 5,
};

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
  "piloting",
  "computers",
];

function synthesizeBuild(
  input: NativeBuildInput,
  ancestry: AncestryRow,
  charClass: ClassRow
): object {
  const classProfs = (charClass.initial_proficiencies ?? {}) as Record<string, number>;
  const baseSkills = Object.fromEntries(ALL_SKILLS.map((s) => [s, 0]));

  // Background-granted skill (rank 2, does not consume a free pick slot)
  const bgSkillProfs: Record<string, number> = {};
  if (input.background_trained_skill) {
    const sk = input.background_trained_skill.toLowerCase();
    bgSkillProfs[sk] = Math.max(classProfs[sk] ?? 0, 2);
  }

  const trainedSkillProfs = Object.fromEntries(
    (input.trained_skills ?? []).map((skill) => [skill, Math.max(classProfs[skill] ?? 0, 2)])
  );

  const additionalSkillProfs = Object.fromEntries(
    (input.additional_skills ?? [])
      .filter((skill) => skill.name.trim())
      .map((skill) => [
        skill.name
          .trim()
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "_")
          .replace(/^_|_$/g, ""),
        Math.max(2, Math.min(5, Math.round(skill.rank || 2))),
      ])
  );

  const customFeats = (input.custom_feats ?? [])
    .filter((feat) => feat.name.trim())
    .map((feat) => [
      feat.name.trim(),
      null,
      feat.featType || "Other",
      feat.level ? `Level ${feat.level}` : null,
    ]);
  const customSpecials = (input.custom_specials ?? [])
    .map((special) => special.trim())
    .filter(Boolean);
  const customAttacks = (input.custom_attacks ?? [])
    .filter((attack) => attack.name.trim())
    .map((attack) => ({
      name: attack.name.trim(),
      bonus: attack.bonus.trim(),
      damage: attack.damage.trim(),
      traits: attack.traits.trim(),
    }));

  const mergedProfs: Record<string, number> = {
    ...baseSkills,
    ...classProfs,
    ...bgSkillProfs,
    ...trainedSkillProfs,
    ...additionalSkillProfs,
  };

  // All characters are at least Trained (rank 2) in Perception
  if ((mergedProfs.perception ?? 0) < 2) mergedProfs.perception = 2;

  const dexMod = Math.floor((input.abilities.dex - 10) / 2);
  const unarmoredRank = mergedProfs.unarmored ?? 2;
  const acProfBonus = unarmoredRank > 0 ? unarmoredRank * 2 + input.level : 0;
  const sizeStr = (ancestry.size ?? "medium").toLowerCase();
  const sizeNum = ANCESTRY_SIZE_MAP[sizeStr] ?? 2;

  return {
    success: true,
    build: {
      name: input.name,
      class: input.class,
      dualClass: null,
      level: input.level,
      xp: 0,
      ancestry: input.ancestry,
      heritage: input.heritage,
      background: input.background,
      alignment: input.alignment,
      gender: input.gender || "Not set",
      age: input.age || "Not set",
      deity: input.deity || "Not set",
      size: sizeNum,
      sizeName: ancestry.size ?? "Medium",
      keyability: input.keyability,
      languages: input.languages.length ? input.languages : ["None selected"],
      rituals: [],
      resistances: [],
      inventorMods: [],
      abilities: {
        ...input.abilities,
        breakdown: {
          ancestryFree: [],
          ancestryBoosts: [],
          ancestryFlaws: [],
          backgroundBoosts: [],
          classBoosts: [],
          mapLevelledBoosts: {},
        },
      },
      attributes: {
        ancestryhp: ancestry.ancestry_hp ?? 8,
        classhp: charClass.class_hp ?? 8,
        bonushp: 0,
        bonushpPerLevel: 0,
        speed: ancestry.speed ?? 25,
        speedBonus: 0,
      },
      proficiencies: mergedProfs,
      mods: {},
      feats: customFeats,
      specials: customSpecials,
      custom_attacks: customAttacks,
      lores: [
        ...(input.lore ? [[input.lore, 2]] : []),
        ...(input.additional_skills ?? [])
          .filter((skill) => /lore$/i.test(skill.name.trim()))
          .map((skill) => [
            skill.name.trim().replace(/\s+lore$/i, ""),
            Math.max(2, Math.min(5, Math.round(skill.rank || 2))),
          ]),
      ],
      equipmentContainers: {},
      equipment: (input.equipment_refs ?? [])
        .filter((e) => e.name.trim())
        .map((e) => [e.name.trim(), Math.max(1, e.quantity)] as [string, number]),
      specificProficiencies: { trained: [], expert: [], master: [], legendary: [] },
      weapons: [],
      armor: [],
      money: input.money,
      spellCasters: [],
      focusPoints: 0,
      focus: {},
      formula: [],
      acTotal: {
        acProfBonus,
        acAbilityBonus: dexMod,
        acItemBonus: 0,
        acTotal: 10 + acProfBonus + dexMod,
        shieldBonus: null,
      },
      pets: input.companion?.type
        ? [
            {
              type: input.companion.type,
              name: input.companion.name,
              subtype: input.companion.subtype,
            },
          ]
        : [],
      familiars: [],
      // Builder-v2 narrative fields — read by the sheet, ignored by the bot.
      description: input.description ?? {},
      personality: input.personality ?? {},
    },
  };
}

// ── Auth helper ───────────────────────────────────────────────────────────────

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
    .single();

  return dbUser ? { authUser, appUserId: dbUser.id, service } : null;
}

// ── GET — list characters ─────────────────────────────────────────────────────

export async function GET(request: Request) {
  const ctx = await resolveUser();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const guildId = searchParams.get("guild_id");
  const status = searchParams.get("status") ?? "active";

  let query = ctx.service
    .from("characters")
    .select("*")
    .eq("user_id", ctx.appUserId)
    .eq("status", status)
    .order("updated_at", { ascending: false });

  if (guildId) query = query.eq("discord_guild_id", guildId);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data);
}

// ── POST — create character ───────────────────────────────────────────────────

export async function POST(request: Request) {
  const ctx = await resolveUser();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const { source = "pathbuilder", discord_guild_id } = body;

  // ── Native build path ────────────────────────────────────────────────────

  if (source === "native") {
    const nb: NativeBuildInput = body.native_build;
    // Builder-v2 sends variant_rules + art at top level (not on native_build)
    // so the synthesizer doesn't have to know about them.
    const variantRules = (body.variant_rules ?? null) as Record<string, unknown> | null;
    const art = nb.description?.portrait_url || null;

    if (!nb?.name || !nb.ancestry_id || !nb.class_id || !nb.background || !nb.abilities) {
      return NextResponse.json(
        { error: "native_build requires name, ancestry_id, class_id, background, and abilities" },
        { status: 400 }
      );
    }

    const [ancestryResult, classResult] = await Promise.all([
      ctx.service.from("ancestries").select("*").eq("id", nb.ancestry_id).single(),
      ctx.service.from("character_classes").select("*").eq("id", nb.class_id).single(),
    ]);

    if (ancestryResult.error || !ancestryResult.data) {
      return NextResponse.json({ error: "Ancestry not found" }, { status: 400 });
    }
    if (classResult.error || !classResult.data) {
      return NextResponse.json({ error: "Class not found" }, { status: 400 });
    }

    const pathbuilderData = synthesizeBuild(nb, ancestryResult.data, classResult.data);

    // variant_rules + art columns may not be in the generated types yet
    // (migrations 20260512100000 / 20260514000000). Cast at the insert site
    // and retry without them if Postgres reports undefined_column (42703).
    const baseRow: TablesInsert<"characters"> = {
      user_id: ctx.appUserId,
      discord_guild_id: discord_guild_id ?? null,
      source: "native",
      name: nb.name,
      char_key: nb.name.toLowerCase().replace(/\s+/g, "-"),
      ancestry_name: nb.ancestry,
      heritage_name: nb.heritage || null,
      class_name: nb.class,
      background_name: nb.background,
      level: nb.level ?? 1,
      pathbuilder_data: pathbuilderData as Json,
      currency: (nb.money ?? { cp: 0, sp: 0, gp: 15, pp: 0 }) as Json,
    };
    const fullRow = {
      ...baseRow,
      ...(variantRules ? { variant_rules: variantRules } : {}),
      ...(art ? { art } : {}),
    };

    let { data, error } = await ctx.service
      .from("characters")
      .insert(fullRow as unknown as TablesInsert<"characters">)
      .select()
      .single();

    if (error && error.code === "42703" && (variantRules || art)) {
      const retry = await ctx.service.from("characters").insert(baseRow).select().single();
      data = retry.data;
      error = retry.error;
    }

    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json(data, { status: 201 });
  }

  // ── Pathbuilder import path (existing) ───────────────────────────────────

  if (!discord_guild_id) {
    return NextResponse.json({ error: "discord_guild_id is required" }, { status: 400 });
  }

  const { pathbuilder_data, pathbuilder_id } = body;

  if (!pathbuilder_data) {
    return NextResponse.json({ error: "pathbuilder_data is required" }, { status: 400 });
  }

  const build = pathbuilder_data?.build ?? pathbuilder_data;
  if (!build?.name) {
    return NextResponse.json({ error: "Invalid Pathbuilder data" }, { status: 400 });
  }

  const { data, error } = await ctx.service
    .from("characters")
    .insert({
      user_id: ctx.appUserId,
      discord_guild_id,
      source: "pathbuilder",
      name: build.name,
      char_key: build.name.toLowerCase().replace(/\s+/g, "-"),
      ancestry_name: build.ancestry ?? null,
      heritage_name: build.heritage ?? null,
      class_name: build.class ?? null,
      background_name: build.background ?? null,
      level: build.level ?? 1,
      pathbuilder_id: pathbuilder_id ?? null,
      pathbuilder_data,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data, { status: 201 });
}
