/**
 * Transformers: Nethys ES doc -> Supabase row shape.
 *
 * Every transformer:
 *   - returns an object keyed exactly like the target table's columns
 *   - includes `aon_id` (= ES _id) for idempotent upsert
 *   - stuffs unknown / display-only fields into the table's *_metadata jsonb
 *   - never throws on missing fields — Nethys schemas drift
 */

import type { NethysDoc } from "./fetch";
import { aonUrl } from "./fetch";

// ── shared helpers ────────────────────────────────────────────

function s(v: unknown, fallback = ""): string {
  return typeof v === "string" ? v : fallback;
}

function n(v: unknown, fallback = 0): number {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string") {
    const m = v.match(/-?\d+/);
    if (m) return parseInt(m[0], 10);
  }
  return fallback;
}

function arr(v: unknown): string[] {
  if (Array.isArray(v)) return v.filter((x) => typeof x === "string");
  if (typeof v === "string" && v.trim()) return [v];
  return [];
}

function bool(v: unknown): boolean {
  return v === true || v === "true";
}

function rarity(v: unknown): string {
  const r = s(v, "common").toLowerCase();
  if (r === "uncommon") return "Uncommon";
  if (r === "rare") return "Rare";
  if (r === "unique") return "Unique";
  return "Common";
}

const ACTION_SYMBOL: Record<string, string> = {
  "Single Action": "[one-action]",
  "Two Actions": "[two-actions]",
  "Three Actions": "[three-actions]",
  "Free Action": "[free-action]",
  Reaction: "[reaction]",
};

function actionCost(raw: unknown): string | null {
  if (typeof raw !== "string" || !raw) return null;
  return ACTION_SYMBOL[raw] ?? raw;
}

// ── feats ─────────────────────────────────────────────────────

const FEAT_TYPE_MAP: Record<string, string> = {
  ancestry: "ancestry",
  class: "class_feat",
  general: "general",
  skill: "skill",
  archetype: "archetype",
  bonus: "bonus",
};

export function transformFeat(doc: NethysDoc): Record<string, unknown> {
  const src = doc._source as Record<string, unknown>;
  const traits = arr(src.trait);
  const rawType = s(src.feat_type ?? src.type, "").toLowerCase();
  const featType =
    FEAT_TYPE_MAP[rawType] ??
    (traits.map((t) => t.toLowerCase()).includes("archetype") ? "archetype" : "general");

  return {
    aon_id: doc._id,
    aon_url: aonUrl(doc),
    name: s(src.name).trim(),
    description: s(src.text ?? src.summary),
    feat_type: featType,
    level: n(src.level, 1),
    traits,
    prerequisites: s(src.prerequisite ?? src.prerequisites) || null,
    action_cost: actionCost(src.actions),
    trigger: s(src.trigger) || null,
    rarity: rarity(src.rarity),
    source: arr(src.source).join(", ") || s(src.source) || null,
    is_official: true,
    feat_metadata: {
      pfs: src.pfs ?? null,
      classes: arr(src.class),
      ancestry: arr(src.ancestry),
      archetype: arr(src.archetype),
      skills: arr(src.skill),
      frequency: s(src.frequency) || null,
      requirements: s(src.requirement) || null,
      summary: s(src.summary) || null,
    },
  };
}

// ── spells ────────────────────────────────────────────────────

export function transformSpell(doc: NethysDoc): Record<string, unknown> {
  const src = doc._source as Record<string, unknown>;
  const traits = arr(src.trait);
  const traditions = arr(src.tradition).map((t) => t.toLowerCase());
  const traitLower = traits.map((t) => t.toLowerCase());

  return {
    aon_id: doc._id,
    aon_url: aonUrl(doc),
    name: s(src.name).trim(),
    level: n(src.level, 1),
    traditions,
    traits,
    cast_actions: actionCost(src.actions) ?? s(src.cast) ?? null,
    defense: s(src.defense ?? src.saving_throw) || null,
    area: s(src.area) || null,
    range_text: s(src.range),
    duration: s(src.duration),
    description: s(src.text ?? src.summary),
    is_focus_spell: traitLower.includes("focus") || doc._source.category === "focus",
    is_ritual: doc._source.category === "ritual" || traitLower.includes("ritual"),
    heightening: src.heighten ?? src.heightened ?? null,
    classes: arr(src.spell_list ?? src.class),
    rarity: rarity(src.rarity),
    source: arr(src.source).join(", ") || s(src.source) || "",
    is_official: true,
    spell_metadata: {
      pfs: src.pfs ?? null,
      bloodline: arr(src.bloodline),
      domain: arr(src.domain),
      mystery: arr(src.mystery),
      patron: arr(src.patron_theme),
      target: s(src.target) || null,
      trigger: s(src.trigger) || null,
      requirements: s(src.requirement) || null,
      cost: s(src.cost) || null,
      summary: s(src.summary) || null,
    },
  };
}

// ── items ─────────────────────────────────────────────────────

const ITEM_TYPE_MAP: Record<string, string> = {
  weapon: "weapon",
  armor: "armor",
  shield: "shield",
  consumable: "consumable",
  "alchemical-item": "alchemical",
  "held-item": "held_item",
  "worn-item": "worn_item",
  rune: "rune",
  material: "material",
  treasure: "treasure",
  vehicle: "vehicle",
};

const PRICE_RE = /(\d+(?:,\d+)*)\s*(pp|gp|sp|cp)?/i;

function priceInCp(raw: unknown): number {
  if (typeof raw === "number") return raw;
  if (typeof raw !== "string" || !raw) return 0;
  const m = raw.match(PRICE_RE);
  if (!m) return 0;
  const amount = parseInt(m[1].replace(/,/g, ""), 10);
  const unit = (m[2] ?? "gp").toLowerCase();
  const mult: Record<string, number> = { cp: 1, sp: 10, gp: 100, pp: 1000 };
  return amount * (mult[unit] ?? 100);
}

export function transformItem(doc: NethysDoc): Record<string, unknown> {
  const src = doc._source as Record<string, unknown>;
  const traits = arr(src.trait);
  const traitLower = traits.map((t) => t.toLowerCase());
  const category = s(src.category, "").toLowerCase();
  const itemType =
    ITEM_TYPE_MAP[category] ??
    (category === "equipment" ? "adventuring_gear" : "adventuring_gear");

  return {
    aon_id: doc._id,
    aon_url: aonUrl(doc),
    name: s(src.name).trim(),
    item_type: itemType,
    item_subtype: s(src.item_category) || s(src.weapon_category) || null,
    level: n(src.level, 0),
    price_cp: priceInCp(src.price),
    bulk: s(src.bulk) || null,
    traits,
    rarity: rarity(src.rarity),
    description: s(src.text ?? src.summary),
    is_magical: traitLower.includes("magical"),
    usage: s(src.usage) || null,
    source: arr(src.source).join(", ") || s(src.source) || null,
    is_official: true,
    item_metadata: {
      pfs: src.pfs ?? null,
      hands: s(src.hands) || null,
      damage: s(src.damage) || null,
      weapon_group: s(src.weapon_group) || null,
      ac_bonus: s(src.ac_bonus) || null,
      dex_cap: s(src.dex_cap) || null,
      check_penalty: s(src.check_penalty) || null,
      speed_penalty: s(src.speed_penalty) || null,
      strength: s(src.strength) || null,
      armor_group: s(src.armor_group) || null,
      summary: s(src.summary) || null,
    },
  };
}

// ── ancestries ────────────────────────────────────────────────

export function transformAncestry(doc: NethysDoc): Record<string, unknown> {
  const src = doc._source as Record<string, unknown>;
  return {
    aon_id: doc._id,
    aon_url: aonUrl(doc),
    name: s(src.name).trim(),
    description: s(src.text ?? src.summary),
    ancestry_hp: n(src.hp, 8),
    size: s(src.size, "Medium"),
    speed: n(src.speed, 25),
    attribute_boosts: arr(src.attribute),
    attribute_flaws: arr(src.attribute_flaw),
    languages: arr(src.language),
    bonus_languages: 0,
    traits: arr(src.trait),
    senses: src.sense ?? {},
    rarity: rarity(src.rarity),
    source: arr(src.source).join(", ") || s(src.source) || null,
    is_official: true,
  };
}

// ── backgrounds ───────────────────────────────────────────────

export function transformBackground(doc: NethysDoc): Record<string, unknown> {
  const src = doc._source as Record<string, unknown>;
  return {
    aon_id: doc._id,
    aon_url: aonUrl(doc),
    name: s(src.name).trim(),
    description: s(src.text ?? src.summary),
    attribute_boosts: arr(src.attribute),
    skill_proficiencies: arr(src.skill),
    lore_skills: arr(src.lore),
    rarity: rarity(src.rarity),
    source: arr(src.source).join(", ") || s(src.source) || null,
    is_official: true,
    background_metadata: {
      grants_feat: s(src.feat) || null,
      pfs: src.pfs ?? null,
    },
  };
}

// ── archetypes ────────────────────────────────────────────────

export function transformArchetype(doc: NethysDoc): Record<string, unknown> {
  const src = doc._source as Record<string, unknown>;
  const traits = arr(src.trait);
  const traitLower = traits.map((t) => t.toLowerCase());
  const archetypeType = traitLower.includes("multiclass")
    ? "multiclass"
    : traitLower.includes("class")
      ? "class_archetype"
      : "other";
  return {
    aon_id: doc._id,
    aon_url: aonUrl(doc),
    name: s(src.name).trim(),
    description: s(src.text ?? src.summary),
    archetype_type: archetypeType,
    traits,
    rarity: rarity(src.rarity),
    source: arr(src.source).join(", ") || s(src.source) || null,
    is_official: true,
  };
}

// ── actions ───────────────────────────────────────────────────

export function transformAction(doc: NethysDoc): Record<string, unknown> {
  const src = doc._source as Record<string, unknown>;
  return {
    aon_id: doc._id,
    aon_url: aonUrl(doc),
    name: s(src.name).trim(),
    action_category: s(src.actions_category ?? src.action_category) || null,
    action_cost: actionCost(src.actions),
    traits: arr(src.trait),
    trigger: s(src.trigger) || null,
    requirements: s(src.requirement) || null,
    frequency: s(src.frequency) || null,
    description: s(src.text ?? src.summary),
    rarity: rarity(src.rarity),
    source: arr(src.source).join(", ") || s(src.source) || null,
    is_official: true,
    action_metadata: { summary: s(src.summary) || null },
  };
}

// ── conditions ────────────────────────────────────────────────

export function transformCondition(doc: NethysDoc): Record<string, unknown> {
  const src = doc._source as Record<string, unknown>;
  const name = s(src.name).trim();
  return {
    aon_id: doc._id,
    aon_url: aonUrl(doc),
    name,
    description: s(src.text ?? src.summary),
    has_value: /\d/.test(name) || /value/i.test(s(src.text)),
    source: arr(src.source).join(", ") || s(src.source) || null,
    is_official: true,
  };
}
