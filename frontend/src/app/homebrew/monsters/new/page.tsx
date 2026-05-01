"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MainLayout } from "@/components/layout";
import { useCreateHomebrew } from "@/lib/hooks/use-homebrew";
import { ArrowLeft, Swords, FileCode, LayoutList } from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

type Rarity = "Common" | "Uncommon" | "Rare" | "Unique";
type Size = "Tiny" | "Small" | "Medium" | "Large" | "Huge" | "Gargantuan";
type Mode = "form" | "json";

// ── Helpers ───────────────────────────────────────────────────────────────────

function toSlug(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
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

// ── Basic form builder ────────────────────────────────────────────────────────

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
  senses: string;
  languages: string;
  description: string;
  strMod: string;
  dexMod: string;
  conMod: string;
  intMod: string;
  wisMod: string;
  chaMod: string;
}) {
  const slug = toSlug(fields.name);
  const traitsList = fields.traits
    ? fields.traits.split(",").map((t) => t.trim()).filter(Boolean)
    : [];

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
    languages: fields.languages
      ? fields.languages.split(",").map((l) => l.trim())
      : [],
    skills: {},
    ability_modifiers: {
      str: parseMod(fields.strMod),
      dex: parseMod(fields.dexMod),
      con: parseMod(fields.conMod),
      int: parseMod(fields.intMod),
      wis: parseMod(fields.wisMod),
      cha: parseMod(fields.chaMod),
    },
    items: [],
    speed: {
      land: parseInt(fields.speed) || 25,
    },
    defenses: {
      ac: parseInt(fields.ac) || 0,
      saves: {
        Fort: parseInt(fields.fort) || 0,
        Ref: parseInt(fields.ref) || 0,
        Will: parseInt(fields.will) || 0,
      },
      save_notes: null,
      hp: parseInt(fields.hp) || 0,
      hp_notes: [],
      immunities: [],
      weaknesses: [],
      resistances: [],
    },
    attacks: [],
    spellcasting: [],
    abilities: { top: [], mid: [], bot: [] },
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
      hp: {
        value: parseInt(fields.hp) || 0,
        raw: fields.hp,
        notes: [],
      },
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

  // Basic form state
  const [name, setName] = useState("");
  const [level, setLevel] = useState("1");
  const [size, setSize] = useState<Size>("Medium");
  const [rarity, setRarity] = useState<Rarity>("Common");
  const [traits, setTraits] = useState("");
  const [hp, setHp] = useState("");
  const [ac, setAc] = useState("");
  const [perception, setPerception] = useState("");
  const [fort, setFort] = useState("");
  const [ref, setRef] = useState("");
  const [will, setWill] = useState("");
  const [speed, setSpeed] = useState("25");
  const [senses, setSenses] = useState("");
  const [languages, setLanguages] = useState("");
  const [description, setDescription] = useState("");
  const [strMod, setStrMod] = useState("");
  const [dexMod, setDexMod] = useState("");
  const [conMod, setConMod] = useState("");
  const [intMod, setIntMod] = useState("");
  const [wisMod, setWisMod] = useState("");
  const [chaMod, setChaMod] = useState("");

  // JSON mode state
  const [jsonText, setJsonText] = useState("");

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
      level, size, rarity, traits, hp, ac, perception,
      fort, ref, will, speed, senses, languages, description,
      strMod, dexMod, conMod, intMod, wisMod, chaMod,
    });

    const monsterData = {
      name: built.core.name,
      core: built.core,
      rich: built.rich,
      summary: built.summary,
    };

    try {
      await createHomebrew.mutateAsync({
        type: "monster",
        name: name.trim(),
        data: monsterData,
      });
      router.push("/homebrew?tab=monster");
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : "Failed to create monster."
      );
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
      (parsed.name as string) ??
      ((parsed.core as Record<string, unknown>)?.name as string);
    if (!entryName) {
      setFormError('JSON must have a top-level "name" field (or core.name).');
      return;
    }

    try {
      await createHomebrew.mutateAsync({
        type: "monster",
        name: entryName,
        data: parsed,
      });
      router.push("/homebrew?tab=monster");
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : "Failed to create monster."
      );
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
          <button
            type="button"
            onClick={() => setMode("form")}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              mode === "form"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <LayoutList size={15} />
            Form Builder
          </button>
          <button
            type="button"
            onClick={() => setMode("json")}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              mode === "json"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <FileCode size={15} />
            JSON Import
          </button>
        </div>

        {/* ── FORM MODE ─────────────────────────────────────────────── */}
        {mode === "form" && (
          <form onSubmit={handleFormSubmit} className="space-y-6">
            {/* Identity */}
            <div className="card p-6 space-y-4">
              <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Identity
              </h2>

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

              <div className="grid grid-cols-3 gap-4">
                <Field label="Level">
                  <select
                    className="input"
                    value={level}
                    onChange={(e) => setLevel(e.target.value)}
                  >
                    {levels.map((l) => (
                      <option key={l} value={l}>
                        {l}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Size">
                  <select
                    className="input"
                    value={size}
                    onChange={(e) => setSize(e.target.value as Size)}
                  >
                    {(
                      [
                        "Tiny",
                        "Small",
                        "Medium",
                        "Large",
                        "Huge",
                        "Gargantuan",
                      ] as const
                    ).map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Rarity">
                  <select
                    className="input"
                    value={rarity}
                    onChange={(e) => setRarity(e.target.value as Rarity)}
                  >
                    {(
                      [
                        "Common",
                        "Uncommon",
                        "Rare",
                        "Unique",
                      ] as const
                    ).map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>

              <Field
                label="Traits"
                hint="Comma-separated, e.g. dragon, fire, beast"
              >
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
                    type="number"
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
                    type="number"
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
                    type="number"
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
                    type="number"
                    className="input"
                    value={fort}
                    onChange={(e) => setFort(e.target.value)}
                    placeholder="+14"
                  />
                </Field>
                <Field label="Reflex">
                  <input
                    type="number"
                    className="input"
                    value={ref}
                    onChange={(e) => setRef(e.target.value)}
                    placeholder="+10"
                  />
                </Field>
                <Field label="Will">
                  <input
                    type="number"
                    className="input"
                    value={will}
                    onChange={(e) => setWill(e.target.value)}
                    placeholder="+9"
                  />
                </Field>
              </div>
            </div>

            {/* Ability scores */}
            <div className="card p-6 space-y-4">
              <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Ability Modifiers
              </h2>
              <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                {[
                  ["STR", strMod, setStrMod],
                  ["DEX", dexMod, setDexMod],
                  ["CON", conMod, setConMod],
                  ["INT", intMod, setIntMod],
                  ["WIS", wisMod, setWisMod],
                  ["CHA", chaMod, setChaMod],
                ].map(([label, val, setter]) => (
                  <div key={label as string}>
                    <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1 text-center">
                      {label as string}
                    </label>
                    <input
                      type="number"
                      className="input text-center"
                      value={val as string}
                      onChange={(e) => (setter as (v: string) => void)(e.target.value)}
                      placeholder="+0"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Movement & senses */}
            <div className="card p-6 space-y-4">
              <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Movement, Senses &amp; Languages
              </h2>

              <div className="grid grid-cols-2 gap-4">
                <Field label="Land Speed (feet)">
                  <input
                    type="number"
                    className="input"
                    value={speed}
                    onChange={(e) => setSpeed(e.target.value)}
                    placeholder="25"
                    min={0}
                  />
                </Field>
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
              </div>

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

            {/* Description */}
            <div className="card p-6 space-y-4">
              <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Description
              </h2>
              <Field
                label="Creature Description"
                hint="Lore, flavour text, or GM notes. Attacks and special abilities can be added via /monsteredit in Discord."
              >
                <textarea
                  className="input min-h-[120px] resize-y"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="A fierce drake wreathed in smoldering embers…"
                />
              </Field>
            </div>

            {formError && (
              <p className="text-sm text-destructive font-medium">{formError}</p>
            )}

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

        {/* ── JSON MODE ─────────────────────────────────────────────── */}
        {mode === "json" && (
          <form onSubmit={handleJsonSubmit} className="space-y-6">
            <div className="card p-6 space-y-4">
              <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                JSON Import
              </h2>
              <p className="text-sm text-muted-foreground">
                Paste a complete monster JSON object. Must include a top-level{" "}
                <code className="text-xs bg-muted px-1 py-0.5 rounded">name</code>{" "}
                field. Ideally includes{" "}
                <code className="text-xs bg-muted px-1 py-0.5 rounded">core</code>,{" "}
                <code className="text-xs bg-muted px-1 py-0.5 rounded">rich</code>,
                and{" "}
                <code className="text-xs bg-muted px-1 py-0.5 rounded">summary</code>{" "}
                sub-objects matching the Pathway bot schema.
              </p>

              <textarea
                className="input min-h-[320px] resize-y font-mono text-xs"
                value={jsonText}
                onChange={(e) => setJsonText(e.target.value)}
                placeholder={'{\n  "name": "Ember Drake",\n  "core": { ... },\n  "rich": { ... },\n  "summary": { ... }\n}'}
                spellCheck={false}
                required
              />
            </div>

            {formError && (
              <p className="text-sm text-destructive font-medium">{formError}</p>
            )}

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
