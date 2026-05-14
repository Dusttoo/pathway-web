"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MainLayout } from "@/components/layout";
import { useCreateHomebrew } from "@/lib/hooks/use-homebrew";
import { HomebrewImageUpload } from "@/components/homebrew/HomebrewImageUpload";
import { ArrowLeft, Swords, FileCode, LayoutList, Plus, X } from "lucide-react";
import { ItemSearchCombobox } from "@/components/ui/ItemSearchCombobox";

// ── Types ─────────────────────────────────────────────────────────────────────

type Rarity = "Common" | "Uncommon" | "Rare" | "Unique";
type Size = "Tiny" | "Small" | "Medium" | "Large" | "Huge" | "Gargantuan";
type Mode = "form" | "json";

type SkillRow = { name: string; bonus: string };
type AttackRow = {
  kind: "Melee" | "Ranged";
  name: string;
  bonus: string;
  traits: string;
  damage: string;
};
type DefenseRow = { type: string; value: string };
type AbilityRow = { name: string; cost: string; traits: string; description: string };

const PF2E_SKILLS = [
  "Acrobatics",
  "Arcana",
  "Athletics",
  "Crafting",
  "Deception",
  "Diplomacy",
  "Intimidation",
  "Medicine",
  "Nature",
  "Occultism",
  "Performance",
  "Religion",
  "Society",
  "Stealth",
  "Survival",
  "Thievery",
  "Lore (custom)",
] as const;

const ABILITY_COSTS = [
  "Passive",
  "Free Action",
  "Reaction",
  "1 Action",
  "2 Actions",
  "3 Actions",
] as const;

// ── Helpers ───────────────────────────────────────────────────────────────────

function toSlug(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function Field({
  label,
  hint,
  required,
  children,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1">
        {label}
        {required && <span className="text-destructive ml-0.5">*</span>}
      </label>
      {children}
      {hint && <p className="text-xs text-muted-foreground mt-1">{hint}</p>}
    </div>
  );
}

function parseMod(raw: string): number | null {
  const n = parseInt(raw);
  return isNaN(n) ? null : n;
}

function buildSkillsObject(rows: SkillRow[]): Record<string, number> {
  const result: Record<string, number> = {};
  for (const row of rows) {
    const key = row.name
      .replace(/\s*\(custom\)/i, "")
      .trim()
      .toLowerCase();
    const val = parseInt(row.bonus);
    if (key && !isNaN(val)) result[key] = val;
  }
  return result;
}

function buildMonsterData(fields: {
  name: string;
  level: string;
  size: Size;
  rarity: Rarity;
  traits: string;
  hp: string;
  ac: string;
  perception: string;
  fort: string;
  ref: string;
  will: string;
  speed: string;
  flySpeed: string;
  burrowSpeed: string;
  swimSpeed: string;
  climbSpeed: string;
  senses: string;
  languages: string;
  description: string;
  strMod: string;
  dexMod: string;
  conMod: string;
  intMod: string;
  wisMod: string;
  chaMod: string;
  skills: SkillRow[];
  immunities: string;
  hpNotes: string;
  weaknesses: DefenseRow[];
  resistances: DefenseRow[];
  items: string[];
  attacks: AttackRow[];
  abilities: AbilityRow[];
}) {
  const slug = toSlug(fields.name);
  const traitsList = fields.traits
    ? fields.traits
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean)
    : [];

  const speedObj: Record<string, number> = { land: parseInt(fields.speed) || 25 };
  if (fields.flySpeed.trim()) speedObj.fly = parseInt(fields.flySpeed) || 0;
  if (fields.burrowSpeed.trim()) speedObj.burrow = parseInt(fields.burrowSpeed) || 0;
  if (fields.swimSpeed.trim()) speedObj.swim = parseInt(fields.swimSpeed) || 0;
  if (fields.climbSpeed.trim()) speedObj.climb = parseInt(fields.climbSpeed) || 0;

  const core = {
    name: fields.name,
    level: parseInt(fields.level) || 0,
    size: fields.size,
    traits: traitsList,
    rarity: fields.rarity,
    hp: parseInt(fields.hp) || 0,
    ac: parseInt(fields.ac) || 0,
    perception: parseInt(fields.perception) || 0,
    saves: {
      fort: parseInt(fields.fort) || 0,
      ref: parseInt(fields.ref) || 0,
      will: parseInt(fields.will) || 0,
    },
    source: { summary_source: null },
    has_rich_data: true,
  };

  const rich = {
    name: fields.name,
    level: parseInt(fields.level) || 0,
    source_book: "Homebrew",
    pdf_page: null,
    size: fields.size,
    creature_traits: traitsList,
    perception: parseInt(fields.perception) || 0,
    senses: fields.senses ? fields.senses.split(",").map((s) => s.trim()) : [],
    languages: fields.languages ? fields.languages.split(",").map((l) => l.trim()) : [],
    skills: buildSkillsObject(fields.skills),
    ability_modifiers: {
      str: parseMod(fields.strMod),
      dex: parseMod(fields.dexMod),
      con: parseMod(fields.conMod),
      int: parseMod(fields.intMod),
      wis: parseMod(fields.wisMod),
      cha: parseMod(fields.chaMod),
    },
    items: fields.items,
    speed: speedObj,
    defenses: {
      ac: parseInt(fields.ac) || 0,
      saves: {
        Fort: parseInt(fields.fort) || 0,
        Ref: parseInt(fields.ref) || 0,
        Will: parseInt(fields.will) || 0,
      },
      save_notes: null,
      hp: parseInt(fields.hp) || 0,
      hp_notes: fields.hpNotes.trim() ? [fields.hpNotes.trim()] : [],
      immunities: fields.immunities
        ? fields.immunities
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
        : [],
      weaknesses: fields.weaknesses
        .filter((w) => w.type.trim())
        .map((w) => ({ type: w.type.trim(), value: parseInt(w.value) || 0 })),
      resistances: fields.resistances
        .filter((r) => r.type.trim())
        .map((r) => ({ type: r.type.trim(), value: parseInt(r.value) || 0 })),
    },
    attacks: fields.attacks
      .filter((a) => a.name.trim())
      .map((a) => ({
        type: a.kind,
        name: a.name.trim(),
        bonus: parseInt(a.bonus) || 0,
        traits: a.traits
          ? a.traits
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean)
          : [],
        damage: a.damage.trim(),
      })),
    spellcasting: [],
    abilities: {
      top: [],
      mid: fields.abilities
        .filter((a) => a.name.trim())
        .map((a) => ({
          name: a.name.trim(),
          cost: a.cost,
          traits: a.traits
            ? a.traits
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean)
            : [],
          description: a.description.trim(),
        })),
      bot: [],
    },
    description: fields.description || null,
    _source_bestiary: "User-added via web homebrew",
  };

  const summary = {
    name: fields.name,
    source: "Homebrew",
    rarity: fields.rarity,
    size: fields.size,
    traits: traitsList,
    summary: {
      level: parseInt(fields.level) || 0,
      hp: { value: parseInt(fields.hp) || 0, raw: fields.hp, notes: [] },
      ac: parseInt(fields.ac) || 0,
      perception: parseInt(fields.perception) || 0,
      fortitude: parseInt(fields.fort) || 0,
      reflex: parseInt(fields.ref) || 0,
      will: parseInt(fields.will) || 0,
      senses_raw: fields.senses || "",
      speed_raw: fields.speed ? `${fields.speed} feet` : "25 feet",
    },
  };

  return { slug, core, rich, summary };
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function NewMonsterPage() {
  const router = useRouter();
  const createHomebrew = useCreateHomebrew();
  const [formError, setFormError] = useState<string | null>(null);
  const [mode, setMode] = useState<Mode>("form");

  // Identity
  const [name, setName] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [level, setLevel] = useState("1");
  const [size, setSize] = useState<Size>("Medium");
  const [rarity, setRarity] = useState<Rarity>("Common");
  const [traits, setTraits] = useState("");

  // Defenses
  const [hp, setHp] = useState("");
  const [ac, setAc] = useState("");
  const [perception, setPerception] = useState("");
  const [fort, setFort] = useState("");
  const [ref, setRef] = useState("");
  const [will, setWill] = useState("");
  const [immunities, setImmunities] = useState("");
  const [hpNotes, setHpNotes] = useState("");
  const [weaknesses, setWeaknesses] = useState<DefenseRow[]>([]);
  const [resistances, setResistances] = useState<DefenseRow[]>([]);

  // Ability scores
  const [strMod, setStrMod] = useState("");
  const [dexMod, setDexMod] = useState("");
  const [conMod, setConMod] = useState("");
  const [intMod, setIntMod] = useState("");
  const [wisMod, setWisMod] = useState("");
  const [chaMod, setChaMod] = useState("");

  // Skills
  const [skills, setSkills] = useState<SkillRow[]>([]);

  // Movement
  const [speed, setSpeed] = useState("25");
  const [flySpeed, setFlySpeed] = useState("");
  const [burrowSpeed, setBurrowSpeed] = useState("");
  const [swimSpeed, setSwimSpeed] = useState("");
  const [climbSpeed, setClimbSpeed] = useState("");
  const [senses, setSenses] = useState("");
  const [languages, setLanguages] = useState("");

  // Items
  const [items, setItems] = useState<string[]>([]);
  const [itemDraft, setItemDraft] = useState("");

  // Attacks
  const [attacks, setAttacks] = useState<AttackRow[]>([]);

  // Abilities
  const [abilities, setAbilities] = useState<AbilityRow[]>([]);

  // Description
  const [description, setDescription] = useState("");

  // JSON mode
  const [jsonText, setJsonText] = useState("");

  // ── Helpers for dynamic rows ──────────────────────────────────────────────

  function addDefenseRow<T>(setter: React.Dispatch<React.SetStateAction<T[]>>, blank: T) {
    setter((prev) => [...prev, blank]);
  }
  function removeRow<T>(setter: React.Dispatch<React.SetStateAction<T[]>>, i: number) {
    setter((prev) => prev.filter((_, j) => j !== i));
  }
  function updateRow<T>(
    setter: React.Dispatch<React.SetStateAction<T[]>>,
    i: number,
    patch: Partial<T>
  ) {
    setter((prev) => prev.map((row, j) => (j === i ? { ...row, ...patch } : row)));
  }

  // ── Submit handlers ───────────────────────────────────────────────────────

  async function handleFormSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    if (!name.trim()) {
      setFormError("Monster name is required.");
      return;
    }
    if (!hp || !ac) {
      setFormError("HP and AC are required.");
      return;
    }

    const built = buildMonsterData({
      name: name.trim(),
      level,
      size,
      rarity,
      traits,
      hp,
      ac,
      perception,
      fort,
      ref,
      will,
      speed,
      flySpeed,
      burrowSpeed,
      swimSpeed,
      climbSpeed,
      senses,
      languages,
      description,
      strMod,
      dexMod,
      conMod,
      intMod,
      wisMod,
      chaMod,
      skills,
      immunities,
      hpNotes,
      weaknesses,
      resistances,
      items,
      attacks,
      abilities,
    });

    try {
      await createHomebrew.mutateAsync({
        type: "monster",
        name: name.trim(),
        data: {
          name: built.core.name,
          core: built.core,
          rich: built.rich,
          summary: built.summary,
          image_url: imageUrl,
        },
      });
      router.push("/homebrew?tab=monster");
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to create monster.");
    }
  }

  async function handleJsonSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(jsonText);
    } catch {
      setFormError("Invalid JSON — please fix the syntax and try again.");
      return;
    }
    const entryName =
      (parsed.name as string) ?? ((parsed.core as Record<string, unknown>)?.name as string);
    if (!entryName) {
      setFormError('JSON must have a top-level "name" field (or core.name).');
      return;
    }
    try {
      await createHomebrew.mutateAsync({ type: "monster", name: entryName, data: parsed });
      router.push("/homebrew?tab=monster");
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to create monster.");
    }
  }

  const levels = Array.from({ length: 32 }, (_, i) => String(i - 1)); // -1 to 30

  return (
    <MainLayout>
      <div className="max-w-3xl space-y-6">
        {/* Back */}
        <Link
          href="/homebrew?tab=monster"
          className="inline-flex items-center gap-2 text-primary hover:text-primary/80 text-sm"
        >
          <ArrowLeft size={14} />
          Back to Homebrew
        </Link>

        {/* Header */}
        <div>
          <h1 className="font-heading text-3xl font-bold mb-1 flex items-center gap-2">
            <Swords className="text-primary" size={28} />
            New Homebrew Monster
          </h1>
          <p className="text-muted-foreground text-sm">
            Creates a creature the Pathway bot can look up in any Discord server.
          </p>
        </div>

        {/* Mode toggle */}
        <div className="flex gap-1 p-1 bg-muted/40 rounded-lg border border-border w-fit">
          {(
            [
              ["form", LayoutList, "Form Builder"],
              ["json", FileCode, "JSON Import"],
            ] as const
          ).map(([m, Icon, label]) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                mode === m
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon size={15} />
              {label}
            </button>
          ))}
        </div>

        {/* ── FORM MODE ───────────────────────────────────────────────────── */}
        {mode === "form" && (
          <form onSubmit={handleFormSubmit} className="space-y-6">
            {/* Identity */}
            <div className="card p-6 space-y-4">
              <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Identity
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-6 items-start">
                <Field label="Name" required>
                  <input
                    type="text"
                    className="input"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Ember Drake"
                    required
                  />
                </Field>
                <HomebrewImageUpload
                  value={imageUrl}
                  onChange={setImageUrl}
                  label="Portrait"
                  recommendedSize="512×512 px"
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <Field label="Level">
                  <select
                    className="input"
                    value={level}
                    onChange={(e) => setLevel(e.target.value)}
                  >
                    {levels.map((l) => (
                      <option key={l}>{l}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Size">
                  <select
                    className="input"
                    value={size}
                    onChange={(e) => setSize(e.target.value as Size)}
                  >
                    {(["Tiny", "Small", "Medium", "Large", "Huge", "Gargantuan"] as const).map(
                      (s) => (
                        <option key={s}>{s}</option>
                      )
                    )}
                  </select>
                </Field>
                <Field label="Rarity">
                  <select
                    className="input"
                    value={rarity}
                    onChange={(e) => setRarity(e.target.value as Rarity)}
                  >
                    {(["Common", "Uncommon", "Rare", "Unique"] as const).map((r) => (
                      <option key={r}>{r}</option>
                    ))}
                  </select>
                </Field>
              </div>
              <Field label="Traits" hint="Comma-separated, e.g. dragon, fire, beast">
                <input
                  type="text"
                  className="input"
                  value={traits}
                  onChange={(e) => setTraits(e.target.value)}
                  placeholder="dragon, fire"
                />
              </Field>
            </div>

            {/* Defenses */}
            <div className="card p-6 space-y-4">
              <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Defenses
              </h2>
              <div className="grid grid-cols-3 gap-4">
                <Field label="HP" required>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9+-]*"
                    className="input"
                    value={hp}
                    onChange={(e) => setHp(e.target.value)}
                    placeholder="120"
                    min={0}
                    required
                  />
                </Field>
                <Field label="AC" required>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9+-]*"
                    className="input"
                    value={ac}
                    onChange={(e) => setAc(e.target.value)}
                    placeholder="22"
                    min={0}
                    required
                  />
                </Field>
                <Field label="Perception">
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9+-]*"
                    className="input"
                    value={perception}
                    onChange={(e) => setPerception(e.target.value)}
                    placeholder="+12"
                  />
                </Field>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <Field label="Fortitude">
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9+-]*"
                    className="input"
                    value={fort}
                    onChange={(e) => setFort(e.target.value)}
                    placeholder="+14"
                  />
                </Field>
                <Field label="Reflex">
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9+-]*"
                    className="input"
                    value={ref}
                    onChange={(e) => setRef(e.target.value)}
                    placeholder="+10"
                  />
                </Field>
                <Field label="Will">
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9+-]*"
                    className="input"
                    value={will}
                    onChange={(e) => setWill(e.target.value)}
                    placeholder="+9"
                  />
                </Field>
              </div>

              <Field label="HP Notes" hint="e.g. regeneration 10 (deactivated by cold)">
                <input
                  type="text"
                  className="input"
                  value={hpNotes}
                  onChange={(e) => setHpNotes(e.target.value)}
                  placeholder="regeneration 10 (deactivated by cold)"
                />
              </Field>
              <Field label="Immunities" hint="Comma-separated, e.g. fire, paralyzed, sleep">
                <input
                  type="text"
                  className="input"
                  value={immunities}
                  onChange={(e) => setImmunities(e.target.value)}
                  placeholder="fire, paralyzed, sleep"
                />
              </Field>

              {/* Weaknesses */}
              <div className="space-y-2">
                <label className="block text-sm font-medium">Weaknesses</label>
                {weaknesses.length === 0 && (
                  <p className="text-sm text-muted-foreground">None added.</p>
                )}
                {weaknesses.map((row, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="flex-1 min-w-0">
                      <input
                        type="text"
                        className="input"
                        placeholder="e.g. cold iron"
                        value={row.type}
                        onChange={(e) => updateRow(setWeaknesses, i, { type: e.target.value })}
                      />
                    </div>
                    <div className="w-20 shrink-0">
                      <input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9+-]*"
                        className="input text-center"
                        placeholder="5"
                        value={row.value}
                        onChange={(e) => updateRow(setWeaknesses, i, { value: e.target.value })}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeRow(setWeaknesses, i)}
                      className="p-1.5 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors shrink-0"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => addDefenseRow(setWeaknesses, { type: "", value: "" })}
                  className="btn-outline text-sm flex items-center gap-1.5"
                >
                  <Plus size={13} />
                  Add Weakness
                </button>
              </div>

              {/* Resistances */}
              <div className="space-y-2">
                <label className="block text-sm font-medium">Resistances</label>
                {resistances.length === 0 && (
                  <p className="text-sm text-muted-foreground">None added.</p>
                )}
                {resistances.map((row, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="flex-1 min-w-0">
                      <input
                        type="text"
                        className="input"
                        placeholder="e.g. fire"
                        value={row.type}
                        onChange={(e) => updateRow(setResistances, i, { type: e.target.value })}
                      />
                    </div>
                    <div className="w-20 shrink-0">
                      <input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9+-]*"
                        className="input text-center"
                        placeholder="10"
                        value={row.value}
                        onChange={(e) => updateRow(setResistances, i, { value: e.target.value })}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeRow(setResistances, i)}
                      className="p-1.5 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors shrink-0"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => addDefenseRow(setResistances, { type: "", value: "" })}
                  className="btn-outline text-sm flex items-center gap-1.5"
                >
                  <Plus size={13} />
                  Add Resistance
                </button>
              </div>
            </div>

            {/* Ability scores */}
            <div className="card p-6 space-y-4">
              <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Ability Modifiers
              </h2>
              <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                {(
                  [
                    ["STR", strMod, setStrMod],
                    ["DEX", dexMod, setDexMod],
                    ["CON", conMod, setConMod],
                    ["INT", intMod, setIntMod],
                    ["WIS", wisMod, setWisMod],
                    ["CHA", chaMod, setChaMod],
                  ] as [string, string, (v: string) => void][]
                ).map(([label, val, setter]) => (
                  <div key={label}>
                    <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1 text-center">
                      {label}
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9+-]*"
                      className="input text-center"
                      value={val}
                      onChange={(e) => setter(e.target.value)}
                      placeholder="+0"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Skills */}
            <div className="card p-6 space-y-4">
              <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Skills
              </h2>
              {skills.length === 0 && (
                <p className="text-sm text-muted-foreground">No skills added yet.</p>
              )}
              <datalist id="pf2e-skills">
                {PF2E_SKILLS.filter((s) => s !== "Lore (custom)").map((s) => (
                  <option key={s} value={s} />
                ))}
                <option value="Lore (Underworld)" />
                <option value="Lore (Warfare)" />
                <option value="Lore (Sailing)" />
              </datalist>
              <div className="space-y-2">
                {skills.map((row, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input
                      type="text"
                      list="pf2e-skills"
                      className="input flex-1"
                      placeholder="e.g. Stealth"
                      value={row.name}
                      onChange={(e) => {
                        const n = [...skills];
                        n[i] = { ...n[i], name: e.target.value };
                        setSkills(n);
                      }}
                    />
                    <div className="flex items-center gap-1 shrink-0">
                      <span className="text-muted-foreground text-sm">+</span>
                      <input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9+-]*"
                        className="input w-20 text-center"
                        placeholder="0"
                        value={row.bonus}
                        onChange={(e) => {
                          const n = [...skills];
                          n[i] = { ...n[i], bonus: e.target.value };
                          setSkills(n);
                        }}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => setSkills(skills.filter((_, j) => j !== i))}
                      className="p-1.5 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors shrink-0"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={() => setSkills([...skills, { name: PF2E_SKILLS[0], bonus: "" }])}
                className="btn-outline text-sm flex items-center gap-1.5"
              >
                <Plus size={13} />
                Add Skill
              </button>
            </div>

            {/* Movement */}
            <div className="card p-6 space-y-4">
              <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Movement, Senses &amp; Languages
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <Field label="Land Speed (ft)">
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9+-]*"
                    className="input"
                    value={speed}
                    onChange={(e) => setSpeed(e.target.value)}
                    placeholder="25"
                    min={0}
                  />
                </Field>
                <Field label="Fly Speed (ft)">
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9+-]*"
                    className="input"
                    value={flySpeed}
                    onChange={(e) => setFlySpeed(e.target.value)}
                    placeholder="—"
                    min={0}
                  />
                </Field>
                <Field label="Burrow Speed (ft)">
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9+-]*"
                    className="input"
                    value={burrowSpeed}
                    onChange={(e) => setBurrowSpeed(e.target.value)}
                    placeholder="—"
                    min={0}
                  />
                </Field>
                <Field label="Swim Speed (ft)">
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9+-]*"
                    className="input"
                    value={swimSpeed}
                    onChange={(e) => setSwimSpeed(e.target.value)}
                    placeholder="—"
                    min={0}
                  />
                </Field>
                <Field label="Climb Speed (ft)">
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9+-]*"
                    className="input"
                    value={climbSpeed}
                    onChange={(e) => setClimbSpeed(e.target.value)}
                    placeholder="—"
                    min={0}
                  />
                </Field>
              </div>
              <Field
                label="Senses"
                hint="Comma-separated, e.g. darkvision, scent (imprecise) 30 feet"
              >
                <input
                  type="text"
                  className="input"
                  value={senses}
                  onChange={(e) => setSenses(e.target.value)}
                  placeholder="darkvision"
                />
              </Field>
              <Field label="Languages" hint="Comma-separated, e.g. Draconic, Common">
                <input
                  type="text"
                  className="input"
                  value={languages}
                  onChange={(e) => setLanguages(e.target.value)}
                  placeholder="Draconic"
                />
              </Field>
            </div>

            {/* Items */}
            <div className="card p-6 space-y-4">
              <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Items
              </h2>
              {/* Existing item chips */}
              {items.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {items.map((item, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1.5 bg-muted text-sm px-2.5 py-1 rounded-full"
                    >
                      {item}
                      <button
                        type="button"
                        onClick={() => setItems((prev) => prev.filter((_, idx) => idx !== i))}
                        className="text-muted-foreground hover:text-destructive transition-colors"
                        aria-label={`Remove ${item}`}
                      >
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                </div>
              )}
              {/* Add item combobox */}
              <ItemSearchCombobox
                value={itemDraft}
                onChange={setItemDraft}
                placeholder="Search or type an item name, then press Enter…"
                onSelect={(name) => {
                  if (name && !items.includes(name)) setItems((prev) => [...prev, name]);
                  setItemDraft("");
                }}
              />
              <p className="text-xs text-muted-foreground">
                Select from the dropdown or press Enter to add a custom item.
              </p>
            </div>

            {/* Attacks */}
            <div className="card p-6 space-y-4">
              <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Attacks
              </h2>
              {attacks.length === 0 && (
                <p className="text-sm text-muted-foreground">No attacks added yet.</p>
              )}
              <div className="space-y-3">
                {attacks.map((row, i) => (
                  <div key={i} className="border border-border rounded-lg p-3 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        Attack {i + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeRow(setAttacks, i)}
                        className="p-1 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                      >
                        <X size={14} />
                      </button>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <Field label="Type">
                        <select
                          className="input"
                          value={row.kind}
                          onChange={(e) =>
                            updateRow(setAttacks, i, { kind: e.target.value as "Melee" | "Ranged" })
                          }
                        >
                          <option value="Melee">Melee</option>
                          <option value="Ranged">Ranged</option>
                        </select>
                      </Field>
                      <Field label="Name">
                        <input
                          type="text"
                          className="input"
                          placeholder="e.g. Jaws"
                          value={row.name}
                          onChange={(e) => updateRow(setAttacks, i, { name: e.target.value })}
                        />
                      </Field>
                      <Field label="Attack Bonus">
                        <input
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9+-]*"
                          className="input"
                          placeholder="+18"
                          value={row.bonus}
                          onChange={(e) => updateRow(setAttacks, i, { bonus: e.target.value })}
                        />
                      </Field>
                    </div>
                    <Field label="Traits" hint="Comma-separated">
                      <input
                        type="text"
                        className="input"
                        placeholder="fire, magical, reach 10 feet"
                        value={row.traits}
                        onChange={(e) => updateRow(setAttacks, i, { traits: e.target.value })}
                      />
                    </Field>
                    <Field label="Damage">
                      <input
                        type="text"
                        className="input"
                        placeholder="2d12+10 piercing plus 1d6 fire"
                        value={row.damage}
                        onChange={(e) => updateRow(setAttacks, i, { damage: e.target.value })}
                      />
                    </Field>
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={() =>
                  addDefenseRow(setAttacks, {
                    kind: "Melee",
                    name: "",
                    bonus: "",
                    traits: "",
                    damage: "",
                  })
                }
                className="btn-outline text-sm flex items-center gap-1.5"
              >
                <Plus size={13} />
                Add Attack
              </button>
            </div>

            {/* Abilities */}
            <div className="card p-6 space-y-4">
              <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Special Abilities
              </h2>
              {abilities.length === 0 && (
                <p className="text-sm text-muted-foreground">No abilities added yet.</p>
              )}
              <div className="space-y-3">
                {abilities.map((row, i) => (
                  <div key={i} className="border border-border rounded-lg p-3 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                        Ability {i + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeRow(setAbilities, i)}
                        className="p-1 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                      >
                        <X size={14} />
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <Field label="Name">
                        <input
                          type="text"
                          className="input"
                          placeholder="e.g. Breath Weapon"
                          value={row.name}
                          onChange={(e) => updateRow(setAbilities, i, { name: e.target.value })}
                        />
                      </Field>
                      <Field label="Action Cost">
                        <select
                          className="input"
                          value={row.cost}
                          onChange={(e) => updateRow(setAbilities, i, { cost: e.target.value })}
                        >
                          {ABILITY_COSTS.map((c) => (
                            <option key={c}>{c}</option>
                          ))}
                        </select>
                      </Field>
                    </div>
                    <Field label="Traits" hint="Comma-separated">
                      <input
                        type="text"
                        className="input"
                        placeholder="fire, evocation"
                        value={row.traits}
                        onChange={(e) => updateRow(setAbilities, i, { traits: e.target.value })}
                      />
                    </Field>
                    <Field label="Description">
                      <textarea
                        className="input min-h-[80px] resize-y"
                        placeholder="The dragon exhales a 60-foot cone of fire…"
                        value={row.description}
                        onChange={(e) =>
                          updateRow(setAbilities, i, { description: e.target.value })
                        }
                      />
                    </Field>
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={() =>
                  addDefenseRow(setAbilities, {
                    name: "",
                    cost: "2 Actions",
                    traits: "",
                    description: "",
                  })
                }
                className="btn-outline text-sm flex items-center gap-1.5"
              >
                <Plus size={13} />
                Add Ability
              </button>
            </div>

            {/* Description */}
            <div className="card p-6 space-y-4">
              <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Description
              </h2>
              <Field label="Creature Description" hint="Lore, flavour text, or GM notes.">
                <textarea
                  className="input min-h-[120px] resize-y"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="A fierce drake wreathed in smoldering embers…"
                />
              </Field>
            </div>

            {formError && <p className="text-sm text-destructive font-medium">{formError}</p>}

            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={createHomebrew.isPending}
                className="btn-primary flex items-center gap-2"
              >
                {createHomebrew.isPending ? (
                  <>
                    <div className="spinner w-4 h-4" />
                    Saving…
                  </>
                ) : (
                  <>
                    <Swords size={16} />
                    Create Monster
                  </>
                )}
              </button>
              <Link href="/homebrew?tab=monster" className="btn-outline">
                Cancel
              </Link>
            </div>
          </form>
        )}

        {/* ── JSON MODE ──────────────────────────────────────────────────── */}
        {mode === "json" && (
          <form onSubmit={handleJsonSubmit} className="space-y-6">
            <div className="card p-6 space-y-4">
              <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                JSON Import
              </h2>
              <p className="text-sm text-muted-foreground">
                Paste a complete monster JSON object. Must include a top-level{" "}
                <code className="text-xs bg-muted px-1 py-0.5 rounded">name</code> field. Ideally
                includes <code className="text-xs bg-muted px-1 py-0.5 rounded">core</code>,{" "}
                <code className="text-xs bg-muted px-1 py-0.5 rounded">rich</code>, and{" "}
                <code className="text-xs bg-muted px-1 py-0.5 rounded">summary</code> sub-objects
                matching the Pathway bot schema.
              </p>
              <textarea
                className="input min-h-[320px] resize-y font-mono text-xs"
                value={jsonText}
                onChange={(e) => setJsonText(e.target.value)}
                placeholder={
                  '{\n  "name": "Ember Drake",\n  "core": { ... },\n  "rich": { ... },\n  "summary": { ... }\n}'
                }
                spellCheck={false}
                required
              />
            </div>

            {formError && <p className="text-sm text-destructive font-medium">{formError}</p>}

            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={createHomebrew.isPending}
                className="btn-primary flex items-center gap-2"
              >
                {createHomebrew.isPending ? (
                  <>
                    <div className="spinner w-4 h-4" />
                    Saving…
                  </>
                ) : (
                  <>
                    <FileCode size={16} />
                    Import Monster
                  </>
                )}
              </button>
              <Link href="/homebrew?tab=monster" className="btn-outline">
                Cancel
              </Link>
            </div>
          </form>
        )}
      </div>
    </MainLayout>
  );
}
