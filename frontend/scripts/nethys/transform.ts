/**
 * Transformers: Nethys ES doc -> Supabase row shape.
 *
 * Every transformer:
 *   - returns an object keyed like the target table's columns
 *   - includes `aon_id` (= ES source id) for idempotent upsert
 *   - keeps display-only source fields in the table's metadata JSON when that
 *     target table has one
 *   - never throws on missing fields because Nethys schemas drift by category
 */

import type { NethysDoc } from "./fetch";
import { aonUrl } from "./fetch";

type Row = Record<string, unknown>;

// ── shared helpers ────────────────────────────────────────────

function source(doc: NethysDoc): Row {
  return doc._source as Row;
}

function s(v: unknown, fallback = ""): string {
  if (typeof v === "string") return v;
  if (typeof v === "number" && Number.isFinite(v)) return String(v);
  return fallback;
}

function n(v: unknown, fallback = 0): number {
  if (typeof v === "number" && Number.isFinite(v)) return Math.trunc(v);
  if (typeof v === "string") {
    const m = v.match(/-?\d+/);
    if (m) return parseInt(m[0], 10);
  }
  return fallback;
}

function arr(v: unknown): string[] {
  if (Array.isArray(v)) {
    return v.flatMap((x) => arr(x));
  }
  if (typeof v === "string" && v.trim()) {
    return v
      .split(",")
      .map((x) => x.trim())
      .filter(Boolean);
  }
  if (typeof v === "number" && Number.isFinite(v)) return [String(v)];
  return [];
}

function unique(values: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];

  for (const value of values) {
    const trimmed = value.trim();
    const key = trimmed.toLowerCase();
    if (!trimmed || seen.has(key)) continue;
    seen.add(key);
    out.push(trimmed);
  }

  return out;
}

function arrFields(src: Row, keys: string[]): string[] {
  return unique(keys.flatMap((key) => arr(src[key])));
}

function first(v: unknown, fallback = ""): string {
  return arr(v)[0] ?? fallback;
}

function object(v: unknown): Row {
  return v && typeof v === "object" && !Array.isArray(v) ? (v as Row) : {};
}

function compact<T extends Row>(input: T): Row {
  return Object.fromEntries(
    Object.entries(input).filter(([, value]) => {
      if (value === undefined || value === null) return false;
      if (typeof value === "string" && value.trim() === "") return false;
      if (Array.isArray(value) && value.length === 0) return false;
      if (
        value &&
        typeof value === "object" &&
        !Array.isArray(value) &&
        Object.keys(value).length === 0
      ) {
        return false;
      }
      return true;
    })
  );
}

function aonId(doc: NethysDoc): string {
  return s(doc._source.id) || doc._id;
}

function sourceText(src: Row): string | null {
  return (
    s(src.primary_source_raw) ||
    arr(src.source_raw).join(", ") ||
    s(src.primary_source) ||
    arr(src.source).join(", ") ||
    null
  );
}

function descriptionText(src: Row): string {
  return s(src.text) || s(src.summary) || s(src.summary_markdown);
}

function metadata(src: Row, extra: Row = {}): Row {
  return compact({
    pfs: src.pfs,
    primary_source: src.primary_source,
    primary_source_raw: src.primary_source_raw,
    primary_source_category: src.primary_source_category,
    source_raw: src.source_raw,
    source_category: src.source_category,
    release_date: src.release_date,
    remaster_id: src.remaster_id,
    summary: src.summary,
    summary_markdown: src.summary_markdown,
    markdown: src.markdown,
    search_markdown: src.search_markdown,
    exclude_from_search: src.exclude_from_search,
    ...extra,
  });
}

function rarity(value: unknown, traits: string[] = []): string {
  const candidates = [s(value), ...traits].map((x) => x.toLowerCase());
  if (candidates.includes("unique")) return "Unique";
  if (candidates.includes("rare")) return "Rare";
  if (candidates.includes("uncommon")) return "Uncommon";
  return "Common";
}

function snake(value: unknown): string | null {
  const raw = first(value) || s(value);
  if (!raw) return null;
  return raw
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

const ACTION_SYMBOL: Record<string, string> = {
  "single action": "[one-action]",
  "one action": "[one-action]",
  "two actions": "[two-actions]",
  "three actions": "[three-actions]",
  "free action": "[free-action]",
  reaction: "[reaction]",
};

function actionCost(raw: unknown): string | null {
  const value = s(raw).trim();
  if (!value) return null;
  return ACTION_SYMBOL[value.toLowerCase()] ?? value;
}

function speedFeet(raw: unknown, fallback = 25): number {
  if (typeof raw === "number" && Number.isFinite(raw)) return Math.trunc(raw);
  if (typeof raw === "string") return n(raw, fallback);
  const obj = object(raw);
  return n(obj.land ?? obj.walk ?? obj.max, fallback);
}

function textField(raw: unknown): string | null {
  if (typeof raw === "string" && raw.trim()) return raw.trim();
  if (typeof raw === "number" && Number.isFinite(raw)) return String(raw);
  return null;
}

// ── feats ─────────────────────────────────────────────────────

const FEAT_TYPE_MAP: Record<string, string> = {
  ancestry: "ancestry",
  class: "class_feat",
  "class feat": "class_feat",
  general: "general",
  skill: "skill",
  archetype: "archetype",
  bonus: "bonus",
};

function featType(src: Row, traits: string[]): string {
  const rawType = s(src.feat_type ?? src.type).toLowerCase();
  const fromRaw = FEAT_TYPE_MAP[rawType];
  if (fromRaw && fromRaw !== "general") return fromRaw;

  const lower = traits.map((t) => t.toLowerCase());
  if (lower.includes("archetype")) return "archetype";
  if (lower.some((trait) => ANCESTRY_TRAITS.has(trait))) return "ancestry";
  if (lower.includes("ancestry")) return "ancestry";
  if (lower.some((trait) => CLASS_TRAITS.has(trait))) return "class_feat";
  if (lower.includes("class")) return "class_feat";
  if (lower.includes("skill")) return "skill";
  return fromRaw ?? "general";
}

const ANCESTRY_TRAITS = new Set([
  "aiuvarin",
  "anadi",
  "android",
  "aphorite",
  "ardande",
  "athamaru",
  "automaton",
  "awakened animal",
  "azarketi",
  "beastkin",
  "catfolk",
  "changeling",
  "conrasu",
  "dhampir",
  "dragonblood",
  "dromaar",
  "duskwalker",
  "dwarf",
  "elf",
  "fetchling",
  "fleshwarp",
  "ganzi",
  "gnoll",
  "gnome",
  "goblin",
  "goloma",
  "grippli",
  "halfling",
  "half-elf",
  "half-orc",
  "hobgoblin",
  "human",
  "hungerseed",
  "jotunborn",
  "kashrishi",
  "kholo",
  "kitsune",
  "kobold",
  "leshy",
  "lizardfolk",
  "merfolk",
  "minotaur",
  "nagaji",
  "nephilim",
  "orc",
  "oread",
  "poppet",
  "ratfolk",
  "samsaran",
  "sarangay",
  "shisk",
  "shoony",
  "sprite",
  "strix",
  "suli",
  "sylph",
  "talos",
  "tanuki",
  "tengu",
  "tiefling",
  "undine",
  "vanara",
  "vishkanya",
  "yaksha",
]);

const CLASS_TRAITS = new Set([
  "alchemist",
  "animist",
  "barbarian",
  "bard",
  "champion",
  "cleric",
  "commander",
  "druid",
  "exemplar",
  "fighter",
  "guardian",
  "gunslinger",
  "inventor",
  "investigator",
  "kineticist",
  "magus",
  "monk",
  "necromancer",
  "oracle",
  "psychic",
  "ranger",
  "rogue",
  "sorcerer",
  "summoner",
  "swashbuckler",
  "thaumaturge",
  "witch",
  "wizard",
]);

function titleCase(value: string): string {
  return value
    .split(/\s+/)
    .map((word) => (word ? word[0].toUpperCase() + word.slice(1).toLowerCase() : word))
    .join(" ");
}

export function transformFeat(doc: NethysDoc): Row {
  const src = source(doc);
  const id = aonId(doc);
  const url = aonUrl(doc);
  const name = s(src.name).trim();
  const traits = arr(src.trait);
  const description = descriptionText(src);
  const type = featType(src, traits);
  const level = n(src.level, 1);
  const prerequisites = s(src.prerequisite ?? src.prerequisites) || null;
  const action = actionCost(src.actions);
  const trigger = s(src.trigger) || null;
  const rarityLabel = rarity(src.rarity, traits);
  const sourceLabel = sourceText(src);
  const classes = arrFields(src, [
    "class",
    "classes",
    "class_name",
    "class_names",
    "class_raw",
    "class_slug",
  ]);
  const ancestry = arrFields(src, [
    "ancestry",
    "ancestries",
    "ancestry_name",
    "ancestry_names",
    "ancestry_raw",
  ]);
  const archetype = arrFields(src, [
    "archetype",
    "archetypes",
    "archetype_name",
    "archetype_names",
    "archetype_raw",
  ]);
  const skills = arrFields(src, ["skill", "skills", "skill_name", "skill_names", "skill_raw"]);
  const inferredClasses =
    type === "class_feat"
      ? traits
          .filter((trait) => CLASS_TRAITS.has(trait.toLowerCase()))
          .map((trait) => titleCase(trait))
      : [];
  const inferredAncestry =
    type === "ancestry"
      ? traits
          .filter((trait) => ANCESTRY_TRAITS.has(trait.toLowerCase()))
          .map((trait) => titleCase(trait))
      : [];
  const inferredArchetype =
    type === "archetype" && archetype.length === 0 && / dedication$/i.test(name)
      ? [name.replace(/ dedication$/i, "")]
      : [];

  return {
    aon_id: id,
    aon_url: url,
    name,
    description,
    feat_type: type,
    level,
    traits,
    prerequisites,
    action_cost: action,
    trigger,
    rarity: rarityLabel,
    source: sourceLabel,
    is_official: true,
    feat_metadata: metadata(src, {
      id,
      aon_id: id,
      aon_url: url,
      name,
      lookup_name: name.toLowerCase(),
      description,
      feat_type: type,
      level,
      traits,
      prerequisites,
      action_cost: action,
      trigger,
      rarity: rarityLabel,
      source: sourceLabel,
      classes: unique([...classes, ...inferredClasses]),
      ancestry: unique([...ancestry, ...inferredAncestry]),
      archetype: unique([...archetype, ...inferredArchetype]),
      skills,
      frequency: s(src.frequency) || null,
      requirements: s(src.requirement) || null,
      search_text: [name, traits.join(" "), prerequisites, sourceLabel, description]
        .filter(Boolean)
        .join(" "),
      remaster_id: src.remaster_id,
      resistance: src.resistance,
      weakness: src.weakness,
    }),
  };
}

// ── spells and rituals ────────────────────────────────────────

function heightening(src: Row): Row | null {
  const out = compact({
    text: src.heighten ?? src.heightened,
    groups: src.heighten_group,
    levels: src.heighten_level,
  });
  return Object.keys(out).length ? out : null;
}

function rangeText(src: Row): string {
  return s(src.range_raw) || s(src.range);
}

export function transformSpell(doc: NethysDoc): Row {
  const src = source(doc);
  const id = aonId(doc);
  const url = aonUrl(doc);
  const name = s(src.name).trim();
  const traits = arr(src.trait);
  const traitLower = traits.map((t) => t.toLowerCase());
  const category = s(src.category).toLowerCase();
  const spellType = s(src.spell_type ?? src.type).toLowerCase();
  const level = n(src.level, 1);
  const traditions = arr(src.tradition).map((t) => t.toLowerCase());
  const cast = actionCost(src.actions) ?? s(src.cast) ?? null;
  const defense = s(src.defense ?? src.saving_throw) || null;
  const area = s(src.area) || null;
  const range = rangeText(src);
  const duration = s(src.duration ?? src.duration_raw);
  const description = descriptionText(src);
  const isFocus =
    category === "focus" || spellType.includes("focus") || traitLower.includes("focus");
  const isRitual =
    category === "ritual" || spellType.includes("ritual") || traitLower.includes("ritual");
  const isCantrip = spellType.includes("cantrip") || traitLower.includes("cantrip");
  const displayType = isCantrip ? "Cantrip" : isFocus ? "Focus" : isRitual ? "Ritual" : "Spell";
  const heightened = heightening(src);
  const sourceLabel = sourceText(src) ?? "";

  return {
    aon_id: id,
    aon_url: url,
    name,
    level,
    traditions,
    traits,
    cast_actions: cast,
    defense,
    area,
    range_text: range,
    duration,
    description,
    is_focus_spell: isFocus,
    is_ritual: isRitual,
    heightening: heightened,
    classes: arr(src.spell_list ?? src.class),
    rarity: rarity(src.rarity, traits),
    source: sourceLabel,
    is_official: true,
    spell_metadata: metadata(src, {
      id,
      aon_id: id,
      aon_url: url,
      name,
      lookup_name: name.toLowerCase(),
      level,
      type: displayType,
      traditions,
      traits,
      cast,
      defense,
      savingThrow: defense,
      saveIsBasic: /basic/i.test(defense ?? ""),
      area,
      range,
      duration,
      description,
      rarity: rarity(src.rarity, traits),
      source: sourceLabel,
      heightened,
      spell_type: src.spell_type ?? src.type,
      bloodline: arr(src.bloodline),
      domain: arr(src.domain),
      mystery: arr(src.mystery),
      patron: arr(src.patron_theme),
      target: s(src.target ?? src.target_markdown) || null,
      trigger: s(src.trigger) || null,
      requirements: s(src.requirement) || null,
      cost: s(src.cost ?? src.cost_markdown) || null,
      components: arr(src.component),
      school: s(src.school) || null,
      primary_check: s(src.primary_check) || null,
      secondary_check: s(src.secondary_check) || null,
      secondary_casters: src.secondary_casters ?? null,
    }),
  };
}

// ── items ─────────────────────────────────────────────────────

const ITEM_CATEGORY_TYPE: Array<[RegExp, string]> = [
  [/weapon/i, "weapon"],
  [/armor/i, "armor"],
  [/shield/i, "shield"],
  [/alchemical/i, "alchemical"],
  [/consumable/i, "consumable"],
  [/held/i, "held_item"],
  [/worn/i, "worn_item"],
  [/rune/i, "rune"],
  [/material/i, "material"],
  [/treasure/i, "treasure"],
  [/vehicle/i, "vehicle"],
];

function itemType(src: Row): string {
  const category = s(src.category).toLowerCase();
  if (["weapon", "armor", "shield"].includes(category)) return category;

  const labels = [src.item_category, src.item_subcategory, src.type]
    .flatMap((v) => arr(v))
    .join(" ");
  for (const [re, mapped] of ITEM_CATEGORY_TYPE) {
    if (re.test(labels)) return mapped;
  }
  return "adventuring_gear";
}

const PRICE_RE = /(\d+(?:,\d+)*(?:\.\d+)?)\s*(pp|gp|sp|cp)?/i;

function priceInCp(src: Row): number {
  if (typeof src.price === "number" && Number.isFinite(src.price)) return Math.round(src.price);
  const raw = s(src.price_raw) || s(src.price);
  if (!raw) return 0;
  const m = raw.match(PRICE_RE);
  if (!m) return 0;
  const amount = Number(m[1].replace(/,/g, ""));
  if (!Number.isFinite(amount)) return 0;
  const unit = (m[2] ?? "gp").toLowerCase();
  const mult: Record<string, number> = { cp: 1, sp: 10, gp: 100, pp: 1000 };
  return Math.round(amount * (mult[unit] ?? 100));
}

function bulkText(src: Row): string | null {
  const raw = textField(src.bulk_raw);
  if (raw) return raw;
  if (typeof src.bulk === "number" && Number.isFinite(src.bulk)) {
    if (src.bulk === 0.1) return "L";
    return String(src.bulk);
  }
  return textField(src.bulk);
}

export function transformItem(doc: NethysDoc): Row {
  const src = source(doc);
  const id = aonId(doc);
  const url = aonUrl(doc);
  const name = s(src.name).trim();
  const traits = arr(src.trait);
  const traitLower = traits.map((t) => t.toLowerCase());
  const type = itemType(src);
  const subtype =
    first(src.item_subcategory) ||
    first(src.item_category) ||
    first(src.weapon_category) ||
    first(src.armor_category) ||
    null;
  const level = n(src.level, 0);
  const priceCp = priceInCp(src);
  const bulk = bulkText(src);
  const rarityLabel = rarity(src.rarity, traits);
  const description = descriptionText(src);
  const magical = traitLower.includes("magical") || Boolean(src.school);
  const usage = s(src.usage ?? src.usage_markdown) || null;
  const sourceLabel = sourceText(src);

  return {
    aon_id: id,
    aon_url: url,
    name,
    item_type: type,
    item_subtype: subtype,
    level,
    price_cp: priceCp,
    bulk,
    traits,
    rarity: rarityLabel,
    description,
    is_magical: magical,
    usage,
    source: sourceLabel,
    is_official: true,
    item_metadata: metadata(src, {
      id,
      aon_id: id,
      aon_url: url,
      name,
      lookup_name: name.toLowerCase(),
      category: type,
      subcategory: subtype,
      item_type: type,
      item_subtype: subtype,
      level,
      price_cp: priceCp,
      bulk,
      traits,
      rarity: rarityLabel,
      description,
      is_magical: magical,
      usage,
      source: sourceLabel,
      item_category: src.item_category,
      item_subcategory: src.item_subcategory,
      hands: textField(src.hands),
      damage: textField(src.damage),
      damage_die: src.damage_die,
      damage_type: src.damage_type,
      weapon_category: src.weapon_category,
      weapon_group: src.weapon_group,
      weapon_type: src.weapon_type,
      ac_bonus: src.ac ?? src.ac_bonus,
      dex_cap: src.dex_cap,
      check_penalty: src.check_penalty,
      speed_penalty: src.speed_penalty,
      strength: src.strength,
      armor_category: src.armor_category,
      armor_group: src.armor_group,
      hardness: src.hardness,
      hp: src.hp,
      price_raw: src.price_raw,
      bulk_raw: src.bulk_raw,
      school: src.school,
      child_ids: src.item_child_id,
    }),
  };
}

// ── ancestries and heritages ──────────────────────────────────

export function transformAncestry(doc: NethysDoc): Row {
  const src = source(doc);
  const traits = arr(src.trait);
  return {
    aon_id: aonId(doc),
    aon_url: aonUrl(doc),
    name: s(src.name).trim(),
    description: descriptionText(src),
    ancestry_hp: n(src.hp, 8),
    size: first(src.size, "Medium"),
    speed: speedFeet(src.speed ?? src.speed_raw),
    attribute_boosts: arr(src.attribute),
    attribute_flaws: arr(src.attribute_flaw),
    languages: arr(src.language),
    bonus_languages: 0,
    traits,
    senses: compact({ vision: arr(src.vision), raw: src.vision }),
    special_abilities: [],
    rarity: rarity(src.rarity, traits),
    source: sourceText(src),
    is_official: true,
  };
}

export function transformHeritage(doc: NethysDoc): Row {
  const src = source(doc);
  const traits = arr(src.trait);
  return {
    aon_id: aonId(doc),
    aon_url: aonUrl(doc),
    name: s(src.name).trim(),
    description: descriptionText(src),
    traits,
    benefits: metadata(src),
    is_versatile: false,
    is_official: true,
    source: sourceText(src),
  };
}

// ── backgrounds ───────────────────────────────────────────────

export function transformBackground(doc: NethysDoc): Row {
  const src = source(doc);
  return {
    aon_id: aonId(doc),
    aon_url: aonUrl(doc),
    name: s(src.name).trim(),
    description: descriptionText(src),
    attribute_boosts: arr(src.attribute),
    skill_proficiencies: arr(src.skill),
    lore_skills: arr(src.lore),
    rarity: rarity(src.rarity),
    source: sourceText(src),
    is_official: true,
    background_metadata: metadata(src, {
      grants_feat: first(src.feat) || s(src.feat) || null,
      is_general_background: src.is_general_background,
    }),
  };
}

// ── classes and class features ────────────────────────────────

function proficiencyBlock(src: Row): Row {
  return compact({
    perception: src.perception_proficiency,
    fortitude: src.fortitude_proficiency,
    reflex: src.reflex_proficiency,
    will: src.will_proficiency,
    attacks: src.attack_proficiency,
    defenses: src.defense_proficiency,
    skills: src.skill_proficiency,
  });
}

export function transformClass(doc: NethysDoc): Row {
  const src = source(doc);
  const text = descriptionText(src);
  const traditions = s(src.tradition_markdown);
  const isSpellcaster = /spellcasting|spellcaster|cantrip|tradition/i.test(`${text} ${traditions}`);

  return {
    aon_id: aonId(doc),
    aon_url: aonUrl(doc),
    name: s(src.name).trim(),
    description: text,
    class_hp: n(src.hp, 8),
    key_attribute: arr(src.attribute).map((x) => x.toLowerCase()),
    initial_proficiencies: proficiencyBlock(src),
    class_features: [],
    is_spellcaster: isSpellcaster,
    spellcasting_ability: null,
    source: sourceText(src),
    is_official: true,
    class_metadata: metadata(src, {
      image: src.image,
      icon_image: src.icon_image,
      navigation: src.navigation,
      hp_raw: src.hp_raw,
      proficiencies: proficiencyBlock(src),
      tradition_markdown: src.tradition_markdown,
    }),
  };
}

export function transformClassFeature(doc: NethysDoc): Row {
  const src = source(doc);
  const traits = arr(src.trait);
  const text = descriptionText(src);
  return {
    aon_id: aonId(doc),
    aon_url: aonUrl(doc),
    name: s(src.name).trim(),
    level: n(src.level, 1),
    description: text,
    traits,
    is_choice: /\bchoose\b|\bchoice\b|\bselect\b/i.test(text),
    rarity: rarity(src.rarity, traits),
    source: sourceText(src),
    is_official: true,
    class_feature_metadata: metadata(src, {
      class_name: s(src.class) || first(src.class) || null,
      type: src.type,
    }),
  };
}

// ── archetypes ────────────────────────────────────────────────

export function transformArchetype(doc: NethysDoc): Row {
  const src = source(doc);
  const traits = arr(src.trait);
  const category =
    `${s(src.archetype_category)} ${s(src.type)} ${descriptionText(src)}`.toLowerCase();
  const archetypeType = category.includes("multiclass")
    ? "multiclass"
    : category.includes("class archetype")
      ? "class_archetype"
      : "other";
  return {
    aon_id: aonId(doc),
    aon_url: aonUrl(doc),
    name: s(src.name).trim(),
    description: descriptionText(src),
    archetype_type: archetypeType,
    traits,
    rarity: rarity(src.rarity, traits),
    source: sourceText(src),
    is_official: true,
  };
}

// ── actions ───────────────────────────────────────────────────

export function transformAction(doc: NethysDoc): Row {
  const src = source(doc);
  const traits = arr(src.trait);
  return {
    aon_id: aonId(doc),
    aon_url: aonUrl(doc),
    name: s(src.name).trim(),
    action_category: snake(src.actions_category ?? src.action_category ?? src.type ?? src.category),
    action_cost: actionCost(src.actions),
    traits,
    trigger: s(src.trigger) || null,
    requirements: s(src.requirement) || null,
    frequency: s(src.frequency) || null,
    description: descriptionText(src),
    rarity: rarity(src.rarity, traits),
    source: sourceText(src),
    is_official: true,
    action_metadata: metadata(src, { type: src.type, actions_number: src.actions_number }),
  };
}

// ── conditions ────────────────────────────────────────────────

const VALUED_CONDITIONS = new Set([
  "clumsy",
  "doomed",
  "drained",
  "dying",
  "enfeebled",
  "frightened",
  "persistent damage",
  "sickened",
  "slowed",
  "stupefied",
  "wounded",
]);

export function transformCondition(doc: NethysDoc): Row {
  const src = source(doc);
  const name = s(src.name).trim();
  return {
    aon_id: aonId(doc),
    aon_url: aonUrl(doc),
    name,
    description: descriptionText(src),
    has_value: VALUED_CONDITIONS.has(name.toLowerCase()) || /condition value/i.test(s(src.text)),
    source: sourceText(src),
    is_official: true,
    condition_metadata: metadata(src, { type: src.type }),
  };
}
