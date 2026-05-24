"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { MainLayout } from "@/components/layout";
import { useHomebrewEntry, useUpdateHomebrew, type HomebrewEntry } from "@/lib/hooks/use-homebrew";
import {
  ArrowLeft,
  Sparkles,
  Package,
  Swords,
  FileCode,
  LayoutList,
  Plus,
  X,
  BadgeCheck,
  Gem,
  Users,
  GraduationCap,
  BookOpen,
} from "lucide-react";
import { ItemSearchCombobox } from "@/components/ui/ItemSearchCombobox";
import { HomebrewImageUpload } from "@/components/homebrew/HomebrewImageUpload";

// ── Shared helpers ────────────────────────────────────────────────────────────

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

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
      {children}
    </h2>
  );
}

type Rarity = "Common" | "Uncommon" | "Rare" | "Unique";
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

const TRADITIONS = ["arcane", "divine", "occult", "primal"] as const;
type Tradition = (typeof TRADITIONS)[number];

const ABILITY_COSTS = [
  "Passive",
  "Free Action",
  "Reaction",
  "1 Action",
  "2 Actions",
  "3 Actions",
] as const;

const CAST_OPTIONS = [
  "Free Action",
  "Reaction",
  "1 Action",
  "2 Actions",
  "3 Actions",
  "1 Minute",
  "10 Minutes",
  "1 Hour",
  "1 Day",
];

const ITEM_CATEGORIES = [
  "Adventuring Gear",
  "Alchemical",
  "Ammunition",
  "Armor",
  "Artifact",
  "Consumable",
  "Held Item",
  "Rune",
  "Shield",
  "Snare",
  "Staff",
  "Tool",
  "Wand",
  "Weapon",
  "Worn Item",
  "Other",
] as const;

const BULK_OPTIONS = ["—", "L", "1", "2", "3", "4", "5", "6"] as const;

const FEAT_TYPES = [
  "General Feat",
  "Skill Feat",
  "Ancestry Feat",
  "Class Feat",
  "Archetype Feat",
  "Heritage Feat",
  "Lineage Feat",
  "Bonus Feat",
  "Other",
] as const;
const HERITAGE_TYPES = [
  "Ancestry Heritage",
  "Versatile Heritage",
  "Lineage",
  "Special Heritage",
  "Other",
] as const;
const ACTION_COSTS = [
  "Passive",
  "Free Action",
  "Reaction",
  "1 Action",
  "2 Actions",
  "3 Actions",
] as const;

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

function skillsToRows(raw: unknown): SkillRow[] {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return [];
  return Object.entries(raw as Record<string, unknown>)
    .filter(([, v]) => typeof v === "number")
    .map(([k, v]) => ({
      name: PF2E_SKILLS.find((s) => s.toLowerCase() === k) ?? k,
      bonus: String(v),
    }));
}

function defenseRowsFromRaw(raw: unknown): DefenseRow[] {
  if (!Array.isArray(raw)) return [];
  return (raw as { type?: string; value?: number }[])
    .filter((r) => r.type)
    .map((r) => ({ type: r.type ?? "", value: String(r.value ?? 0) }));
}

function attacksFromRaw(raw: unknown): AttackRow[] {
  if (!Array.isArray(raw)) return [];
  return (raw as Record<string, unknown>[]).map((a) => ({
    kind: (a.type === "Ranged" ? "Ranged" : "Melee") as "Melee" | "Ranged",
    name: String(a.name ?? ""),
    bonus: String(a.bonus ?? ""),
    traits: Array.isArray(a.traits) ? (a.traits as string[]).join(", ") : String(a.traits ?? ""),
    damage: String(a.damage ?? ""),
  }));
}

function abilitiesFromRaw(raw: unknown): AbilityRow[] {
  if (!Array.isArray(raw)) return [];
  return (raw as Record<string, unknown>[]).map((a) => ({
    name: String(a.name ?? ""),
    cost: String(a.cost ?? "Passive"),
    traits: Array.isArray(a.traits) ? (a.traits as string[]).join(", ") : String(a.traits ?? ""),
    description: String(a.description ?? ""),
  }));
}

function toSlug(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function parsePriceToCP(raw: string): number | null {
  const m = raw.trim().match(/^(\d+(?:\.\d+)?)\s*(cp|sp|gp|pp)$/i);
  if (!m) return null;
  const mult: Record<string, number> = { cp: 1, sp: 10, gp: 100, pp: 1000 };
  return Math.round(parseFloat(m[1]) * (mult[m[2].toLowerCase()] ?? 1));
}

function normalizeBulk(raw: string): string | null {
  if (!raw || raw === "—") return "negligible";
  if (raw === "L") return "light";
  const n = parseFloat(raw);
  return isNaN(n) ? null : String(n);
}

// ── Spell edit form ───────────────────────────────────────────────────────────

function SpellEditForm({ entry }: { entry: HomebrewEntry }) {
  const router = useRouter();
  const update = useUpdateHomebrew();
  const [formError, setFormError] = useState<string | null>(null);

  const d = entry.data as Record<string, unknown>;

  const [name, setName] = useState(String(d.name ?? entry.name));
  const [type, setType] = useState(String(d.type ?? "Spell"));
  const [level, setLevel] = useState(String(d.level ?? "1"));
  const [rarity, setRarity] = useState<Rarity>((d.rarity as Rarity) ?? "Common");
  const [traditions, setTraditions] = useState<Set<Tradition>>(
    new Set(
      String(d.traditions ?? "")
        .split(",")
        .map((t) => t.trim())
        .filter((t): t is Tradition => (TRADITIONS as readonly string[]).includes(t))
    )
  );
  const [traits, setTraits] = useState(String(d.traits ?? ""));
  const rawCast = String(d.cast ?? "2 Actions");
  const [cast, setCast] = useState(CAST_OPTIONS.includes(rawCast) ? rawCast : "Other");
  const [castCustom, setCastCustom] = useState(CAST_OPTIONS.includes(rawCast) ? "" : rawCast);
  const [trigger, setTrigger] = useState(String(d.trigger ?? ""));
  const [requirements, setRequirements] = useState(String(d.requirements ?? ""));
  const [target, setTarget] = useState(String(d.target ?? ""));
  const [range, setRange] = useState(String(d.range ?? ""));
  const [area, setArea] = useState(String(d.area ?? ""));
  const [duration, setDuration] = useState(String(d.duration ?? ""));
  const [defense, setDefense] = useState(String(d.defense ?? ""));
  const [description, setDescription] = useState(String(d.description ?? ""));
  const [heightened, setHeightened] = useState(String(d.heightened ?? ""));
  const [source, setSource] = useState(String(d.source ?? "Homebrew"));
  const [imageUrl, setImageUrl] = useState<string | null>((d.image_url as string | null) ?? null);

  function toggleTradition(t: Tradition) {
    setTraditions((prev) => {
      const next = new Set(prev);
      next.has(t) ? next.delete(t) : next.add(t);
      return next;
    });
  }

  const isCantripType = type === "Cantrip" || type === "Focus Cantrip";
  const isFocusType = type === "Focus" || type === "Focus Cantrip";
  const effectiveLevel = isCantripType ? "0" : level;
  const castValue = cast === "Other" ? castCustom : cast;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    if (!name.trim()) {
      setFormError("Name is required.");
      return;
    }
    if (!description.trim()) {
      setFormError("Description is required.");
      return;
    }
    if (type === "Spell" && traditions.size === 0) {
      setFormError("Regular spells must belong to at least one tradition.");
      return;
    }
    try {
      await update.mutateAsync({
        id: entry.id,
        name: name.trim(),
        data: {
          name: name.trim(),
          source,
          traditions: Array.from(traditions).join(", "),
          rarity,
          traits,
          type,
          level: effectiveLevel,
          is_focus_spell: isFocusType,
          is_ritual: type === "Ritual",
          heightened,
          summary: description.trim().slice(0, 400),
          description: description.trim(),
          cast: castValue,
          trigger,
          requirements,
          target,
          range,
          area,
          duration,
          defense,
          damage: (d.damage as object) ?? { base: "", type: "", extra: "" },
          heightening: null,
          rolls: [],
          image_url: imageUrl,
        },
      });
      router.push("/homebrew?tab=spell");
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to save.");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="card p-6 space-y-4">
        <SectionHeading>Core Identity</SectionHeading>
        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-6 items-start">
          <Field label="Spell Name" required>
            <input
              className="input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </Field>
          <HomebrewImageUpload
            value={imageUrl}
            onChange={setImageUrl}
            label="Artwork"
            recommendedSize="256×256 px"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Type">
            <select className="input" value={type} onChange={(e) => setType(e.target.value)}>
              {["Spell", "Cantrip", "Focus", "Focus Cantrip", "Ritual"].map((o) => (
                <option key={o}>{o}</option>
              ))}
            </select>
          </Field>
          <Field label={isCantripType ? "Rank (auto: 0)" : "Rank"}>
            <select
              className={`input ${isCantripType ? "opacity-50 pointer-events-none" : ""}`}
              value={isCantripType ? "0" : level}
              onChange={(e) => setLevel(e.target.value)}
            >
              {["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10"].map((l) => (
                <option key={l}>{l}</option>
              ))}
            </select>
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-4">
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
          <Field label="Source">
            <input className="input" value={source} onChange={(e) => setSource(e.target.value)} />
          </Field>
        </div>
        {!isFocusType && type !== "Ritual" && (
          <Field label="Traditions" hint="Select all that apply.">
            <div className="flex flex-wrap gap-2 mt-1">
              {TRADITIONS.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => toggleTradition(t)}
                  className={`px-3 py-1 rounded-full text-sm font-medium border-2 transition-colors capitalize ${
                    traditions.has(t)
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-muted-foreground hover:border-primary/50"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </Field>
        )}
        <Field label="Traits" hint="Comma-separated">
          <input
            className="input"
            value={traits}
            onChange={(e) => setTraits(e.target.value)}
            placeholder="fire, evocation"
          />
        </Field>
      </div>

      <div className="card p-6 space-y-4">
        <SectionHeading>Casting</SectionHeading>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Cast">
            <select className="input" value={cast} onChange={(e) => setCast(e.target.value)}>
              {[...CAST_OPTIONS, "Other"].map((o) => (
                <option key={o}>{o}</option>
              ))}
            </select>
          </Field>
          {cast === "Other" && (
            <Field label="Custom Cast Time">
              <input
                className="input"
                value={castCustom}
                onChange={(e) => setCastCustom(e.target.value)}
              />
            </Field>
          )}
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Trigger">
            <input
              className="input"
              value={trigger}
              onChange={(e) => setTrigger(e.target.value)}
              placeholder="An enemy within 30 feet…"
            />
          </Field>
          <Field label="Requirements">
            <input
              className="input"
              value={requirements}
              onChange={(e) => setRequirements(e.target.value)}
            />
          </Field>
        </div>
      </div>

      <div className="card p-6 space-y-4">
        <SectionHeading>Range, Area &amp; Duration</SectionHeading>
        <div className="grid grid-cols-3 gap-4">
          <Field label="Range">
            <input
              className="input"
              value={range}
              onChange={(e) => setRange(e.target.value)}
              placeholder="60 feet"
            />
          </Field>
          <Field label="Area">
            <input
              className="input"
              value={area}
              onChange={(e) => setArea(e.target.value)}
              placeholder="20-foot burst"
            />
          </Field>
          <Field label="Duration">
            <input
              className="input"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              placeholder="1 minute"
            />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Target">
            <input
              className="input"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              placeholder="1 creature"
            />
          </Field>
          <Field label="Defense / Saving Throw">
            <input
              className="input"
              value={defense}
              onChange={(e) => setDefense(e.target.value)}
              placeholder="Reflex"
            />
          </Field>
        </div>
      </div>

      <div className="card p-6 space-y-4">
        <SectionHeading>Description</SectionHeading>
        <Field label="Spell Description" required>
          <textarea
            className="input min-h-[160px] resize-y"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          />
        </Field>
        <Field label="Heightened" hint="+2 The damage increases by 2d6.">
          <textarea
            className="input min-h-[80px] resize-y"
            value={heightened}
            onChange={(e) => setHeightened(e.target.value)}
          />
        </Field>
      </div>

      {formError && <p className="text-sm text-destructive font-medium">{formError}</p>}
      <div className="flex gap-3">
        <button
          type="submit"
          disabled={update.isPending}
          className="btn-primary flex items-center gap-2"
        >
          {update.isPending ? (
            <>
              <div className="spinner w-4 h-4" />
              Saving…
            </>
          ) : (
            <>
              <Sparkles size={16} />
              Save Spell
            </>
          )}
        </button>
        <Link href="/homebrew?tab=spell" className="btn-outline">
          Cancel
        </Link>
      </div>
    </form>
  );
}

// ── Item edit form ────────────────────────────────────────────────────────────

function ItemEditForm({ entry }: { entry: HomebrewEntry }) {
  const router = useRouter();
  const update = useUpdateHomebrew();
  const [formError, setFormError] = useState<string | null>(null);

  const d = entry.data as Record<string, unknown>;
  const src = d.source as Record<string, unknown> | undefined;

  const [name, setName] = useState(String(d.name ?? entry.name));
  const [category, setCategory] = useState(String(d.category ?? ITEM_CATEGORIES[0]));
  const [subcategory, setSubcategory] = useState(String(d.subcategory ?? ""));
  const [level, setLevel] = useState(String(d.level ?? "0"));
  const [rarity, setRarity] = useState<Rarity>((d.rarity as Rarity) ?? "Common");
  const [traits, setTraits] = useState(
    Array.isArray(d.traits) ? (d.traits as string[]).join(", ") : String(d.traits ?? "")
  );
  const [price, setPrice] = useState(String(d.price_raw ?? ""));
  const [bulk, setBulk] = useState(String(d.bulk_raw ?? "L"));
  const [usage, setUsage] = useState(String(d.usage ?? ""));
  const [sourceBook, setSourceBook] = useState(String(src?.book ?? "Homebrew"));
  const [sourcePage, setSourcePage] = useState(String(src?.page ?? ""));
  const [description, setDescription] = useState(String(d.notes ?? ""));
  const [imageUrl, setImageUrl] = useState<string | null>((d.image_url as string | null) ?? null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    if (!name.trim()) {
      setFormError("Name is required.");
      return;
    }
    const traitsList = traits
      ? traits
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean)
      : [];
    try {
      await update.mutateAsync({
        id: entry.id,
        name: name.trim(),
        data: {
          id: entry.entry_key,
          name: name.trim(),
          lookup_name: name.trim().toLowerCase(),
          pfs_availability: null,
          source: {
            book: sourceBook || "Homebrew",
            page: sourcePage || null,
            source_text: [sourceBook, sourcePage].filter(Boolean).join(" p."),
          },
          rarity,
          traits: traitsList,
          category: category !== "Other" ? category : subcategory || null,
          subcategory: subcategory || null,
          level: parseInt(level) || 0,
          price_raw: price || null,
          price_cp: price ? parsePriceToCP(price) : null,
          bulk_raw: bulk === "—" ? null : bulk,
          bulk_normalized: normalizeBulk(bulk),
          usage: usage || null,
          campaign: null,
          notes: description || null,
          image_url: imageUrl,
        },
      });
      router.push("/homebrew?tab=item");
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to save.");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="card p-6 space-y-4">
        <SectionHeading>Identity</SectionHeading>
        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-6 items-start">
          <Field label="Item Name" required>
            <input
              className="input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </Field>
          <HomebrewImageUpload
            value={imageUrl}
            onChange={setImageUrl}
            label="Artwork"
            recommendedSize="256×256 px"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Category">
            <select
              className="input"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              {ITEM_CATEGORIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </Field>
          <Field label="Subcategory" hint="Optional, e.g. Bomb, Potion">
            <input
              className="input"
              value={subcategory}
              onChange={(e) => setSubcategory(e.target.value)}
            />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Item Level">
            <select className="input" value={level} onChange={(e) => setLevel(e.target.value)}>
              {Array.from({ length: 26 }, (_, i) => String(i)).map((l) => (
                <option key={l}>{l}</option>
              ))}
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
        <Field label="Traits" hint="Comma-separated">
          <input className="input" value={traits} onChange={(e) => setTraits(e.target.value)} />
        </Field>
      </div>

      <div className="card p-6 space-y-4">
        <SectionHeading>Physical Properties</SectionHeading>
        <div className="grid grid-cols-3 gap-4">
          <Field label="Price" hint="e.g. 3 gp">
            <input className="input" value={price} onChange={(e) => setPrice(e.target.value)} />
          </Field>
          <Field label="Bulk">
            <select className="input" value={bulk} onChange={(e) => setBulk(e.target.value)}>
              {BULK_OPTIONS.map((b) => (
                <option key={b}>{b}</option>
              ))}
            </select>
          </Field>
          <Field label="Usage">
            <input
              className="input"
              value={usage}
              onChange={(e) => setUsage(e.target.value)}
              placeholder="held in 1 hand"
            />
          </Field>
        </div>
      </div>

      <div className="card p-6 space-y-4">
        <SectionHeading>Source</SectionHeading>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Source Book">
            <input
              className="input"
              value={sourceBook}
              onChange={(e) => setSourceBook(e.target.value)}
            />
          </Field>
          <Field label="Page">
            <input
              className="input"
              value={sourcePage}
              onChange={(e) => setSourcePage(e.target.value)}
            />
          </Field>
        </div>
      </div>

      <div className="card p-6 space-y-4">
        <SectionHeading>Description</SectionHeading>
        <Field label="Item Description / Notes">
          <textarea
            className="input min-h-[140px] resize-y"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </Field>
      </div>

      {formError && <p className="text-sm text-destructive font-medium">{formError}</p>}
      <div className="flex gap-3">
        <button
          type="submit"
          disabled={update.isPending}
          className="btn-primary flex items-center gap-2"
        >
          {update.isPending ? (
            <>
              <div className="spinner w-4 h-4" />
              Saving…
            </>
          ) : (
            <>
              <Package size={16} />
              Save Item
            </>
          )}
        </button>
        <Link href="/homebrew?tab=item" className="btn-outline">
          Cancel
        </Link>
      </div>
    </form>
  );
}

// ── Monster edit form ─────────────────────────────────────────────────────────

function FeatEditForm({ entry }: { entry: HomebrewEntry }) {
  const router = useRouter();
  const update = useUpdateHomebrew();
  const [formError, setFormError] = useState<string | null>(null);
  const d = entry.data as Record<string, unknown>;
  const src = d.source as Record<string, unknown> | undefined;

  const [name, setName] = useState(String(d.name ?? entry.name));
  const [featType, setFeatType] = useState(String(d.feat_type ?? "General Feat"));
  const [level, setLevel] = useState(String(d.level ?? "1"));
  const [rarity, setRarity] = useState<Rarity>((d.rarity as Rarity) ?? "Common");
  const [traits, setTraits] = useState(
    Array.isArray(d.traits) ? (d.traits as string[]).join(", ") : String(d.traits ?? "")
  );
  const [prerequisites, setPrerequisites] = useState(String(d.prerequisites ?? ""));
  const [frequency, setFrequency] = useState(String(d.frequency ?? ""));
  const [trigger, setTrigger] = useState(String(d.trigger ?? ""));
  const [requirements, setRequirements] = useState(String(d.requirements ?? ""));
  const [actionCost, setActionCost] = useState(String(d.action_cost ?? "Passive"));
  const [description, setDescription] = useState(String(d.description ?? ""));
  const [special, setSpecial] = useState(String(d.special ?? ""));
  const [sourceBook, setSourceBook] = useState(String(src?.book ?? "Homebrew"));
  const [sourcePage, setSourcePage] = useState(String(src?.page ?? ""));
  const [imageUrl, setImageUrl] = useState<string | null>((d.image_url as string | null) ?? null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    if (!name.trim()) {
      setFormError("Name is required.");
      return;
    }
    if (!description.trim()) {
      setFormError("Benefit is required.");
      return;
    }
    try {
      await update.mutateAsync({
        id: entry.id,
        name: name.trim(),
        data: {
          id: entry.entry_key,
          name: name.trim(),
          lookup_name: name.trim().toLowerCase(),
          feat_type: featType,
          level: parseInt(level) || 1,
          rarity,
          traits: traits
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean),
          prerequisites: prerequisites || null,
          frequency: frequency || null,
          trigger: trigger || null,
          requirements: requirements || null,
          action_cost: actionCost === "Passive" ? null : actionCost,
          description: description.trim(),
          special: special || null,
          source: {
            book: sourceBook || "Homebrew",
            page: sourcePage || null,
            source_text:
              [sourceBook, sourcePage ? `p. ${sourcePage}` : ""].filter(Boolean).join(" ") ||
              "Homebrew",
          },
          image_url: imageUrl,
        },
      });
      router.push("/homebrew?tab=feat");
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to save.");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="card p-6 space-y-4">
        <SectionHeading>Identity</SectionHeading>
        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-6 items-start">
          <Field label="Feat Name" required>
            <input
              className="input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </Field>
          <HomebrewImageUpload
            value={imageUrl}
            onChange={setImageUrl}
            label="Artwork"
            recommendedSize="256x256 px"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Feat Type">
            <select
              className="input"
              value={featType}
              onChange={(e) => setFeatType(e.target.value)}
            >
              {FEAT_TYPES.map((type) => (
                <option key={type}>{type}</option>
              ))}
            </select>
          </Field>
          <Field label="Level">
            <select className="input" value={level} onChange={(e) => setLevel(e.target.value)}>
              {Array.from({ length: 21 }, (_, i) => String(i)).map((value) => (
                <option key={value}>{value}</option>
              ))}
            </select>
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-4">
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
          <Field label="Action Cost">
            <select
              className="input"
              value={actionCost}
              onChange={(e) => setActionCost(e.target.value)}
            >
              {ACTION_COSTS.map((cost) => (
                <option key={cost}>{cost}</option>
              ))}
            </select>
          </Field>
        </div>
        <Field label="Traits" hint="Comma-separated">
          <input className="input" value={traits} onChange={(e) => setTraits(e.target.value)} />
        </Field>
      </div>

      <div className="card p-6 space-y-4">
        <SectionHeading>Requirements</SectionHeading>
        <Field label="Prerequisites">
          <input
            className="input"
            value={prerequisites}
            onChange={(e) => setPrerequisites(e.target.value)}
          />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Frequency">
            <input
              className="input"
              value={frequency}
              onChange={(e) => setFrequency(e.target.value)}
            />
          </Field>
          <Field label="Trigger">
            <input className="input" value={trigger} onChange={(e) => setTrigger(e.target.value)} />
          </Field>
        </div>
        <Field label="Requirements">
          <input
            className="input"
            value={requirements}
            onChange={(e) => setRequirements(e.target.value)}
          />
        </Field>
      </div>

      <div className="card p-6 space-y-4">
        <SectionHeading>Rules Text</SectionHeading>
        <Field label="Benefit" required>
          <textarea
            className="input min-h-[160px] resize-y"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          />
        </Field>
        <Field label="Special">
          <textarea
            className="input min-h-[80px] resize-y"
            value={special}
            onChange={(e) => setSpecial(e.target.value)}
          />
        </Field>
      </div>

      <div className="card p-6 space-y-4">
        <SectionHeading>Source</SectionHeading>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Source Book">
            <input
              className="input"
              value={sourceBook}
              onChange={(e) => setSourceBook(e.target.value)}
            />
          </Field>
          <Field label="Page">
            <input
              className="input"
              value={sourcePage}
              onChange={(e) => setSourcePage(e.target.value)}
            />
          </Field>
        </div>
      </div>

      {formError && <p className="text-sm text-destructive font-medium">{formError}</p>}
      <div className="flex gap-3">
        <button
          type="submit"
          disabled={update.isPending}
          className="btn-primary flex items-center gap-2"
        >
          {update.isPending ? (
            <>
              <div className="spinner w-4 h-4" />
              Saving...
            </>
          ) : (
            <>
              <BadgeCheck size={16} />
              Save Feat
            </>
          )}
        </button>
        <Link href="/homebrew?tab=feat" className="btn-outline">
          Cancel
        </Link>
      </div>
    </form>
  );
}

function HeritageEditForm({ entry }: { entry: HomebrewEntry }) {
  const router = useRouter();
  const update = useUpdateHomebrew();
  const [formError, setFormError] = useState<string | null>(null);
  const d = entry.data as Record<string, unknown>;
  const src = d.source as Record<string, unknown> | undefined;

  const [name, setName] = useState(String(d.name ?? entry.name));
  const [heritageType, setHeritageType] = useState(String(d.heritage_type ?? "Ancestry Heritage"));
  const [ancestry, setAncestry] = useState(String(d.ancestry ?? ""));
  const [level, setLevel] = useState(String(d.level ?? "1"));
  const [rarity, setRarity] = useState<Rarity>((d.rarity as Rarity) ?? "Common");
  const [traits, setTraits] = useState(
    Array.isArray(d.traits) ? (d.traits as string[]).join(", ") : String(d.traits ?? "")
  );
  const [prerequisites, setPrerequisites] = useState(String(d.prerequisites ?? ""));
  const [description, setDescription] = useState(String(d.description ?? ""));
  const [special, setSpecial] = useState(String(d.special ?? ""));
  const [sourceBook, setSourceBook] = useState(String(src?.book ?? "Homebrew"));
  const [sourcePage, setSourcePage] = useState(String(src?.page ?? ""));
  const [imageUrl, setImageUrl] = useState<string | null>((d.image_url as string | null) ?? null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    if (!name.trim()) {
      setFormError("Name is required.");
      return;
    }
    if (!description.trim()) {
      setFormError("Benefit is required.");
      return;
    }
    try {
      await update.mutateAsync({
        id: entry.id,
        name: name.trim(),
        data: {
          id: entry.entry_key,
          name: name.trim(),
          lookup_name: name.trim().toLowerCase(),
          heritage_type: heritageType,
          ancestry: ancestry || null,
          level: parseInt(level) || 1,
          rarity,
          traits: traits
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean),
          prerequisites: prerequisites || null,
          description: description.trim(),
          special: special || null,
          source: {
            book: sourceBook || "Homebrew",
            page: sourcePage || null,
            source_text:
              [sourceBook, sourcePage ? `p. ${sourcePage}` : ""].filter(Boolean).join(" ") ||
              "Homebrew",
          },
          image_url: imageUrl,
        },
      });
      router.push("/homebrew?tab=heritage");
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to save.");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="card p-6 space-y-4">
        <SectionHeading>Identity</SectionHeading>
        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-6 items-start">
          <Field label="Heritage Name" required>
            <input
              className="input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </Field>
          <HomebrewImageUpload
            value={imageUrl}
            onChange={setImageUrl}
            label="Artwork"
            recommendedSize="256x256 px"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Heritage Type">
            <select
              className="input"
              value={heritageType}
              onChange={(e) => setHeritageType(e.target.value)}
            >
              {HERITAGE_TYPES.map((type) => (
                <option key={type}>{type}</option>
              ))}
            </select>
          </Field>
          <Field label="Ancestry">
            <input
              className="input"
              value={ancestry}
              onChange={(e) => setAncestry(e.target.value)}
            />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Level">
            <select className="input" value={level} onChange={(e) => setLevel(e.target.value)}>
              {Array.from({ length: 21 }, (_, i) => String(i)).map((value) => (
                <option key={value}>{value}</option>
              ))}
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
        <Field label="Traits" hint="Comma-separated">
          <input className="input" value={traits} onChange={(e) => setTraits(e.target.value)} />
        </Field>
      </div>

      <div className="card p-6 space-y-4">
        <SectionHeading>Requirements</SectionHeading>
        <Field label="Prerequisites">
          <input
            className="input"
            value={prerequisites}
            onChange={(e) => setPrerequisites(e.target.value)}
          />
        </Field>
      </div>

      <div className="card p-6 space-y-4">
        <SectionHeading>Rules Text</SectionHeading>
        <Field label="Benefit" required>
          <textarea
            className="input min-h-[160px] resize-y"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          />
        </Field>
        <Field label="Special">
          <textarea
            className="input min-h-[80px] resize-y"
            value={special}
            onChange={(e) => setSpecial(e.target.value)}
          />
        </Field>
      </div>

      <div className="card p-6 space-y-4">
        <SectionHeading>Source</SectionHeading>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Source Book">
            <input
              className="input"
              value={sourceBook}
              onChange={(e) => setSourceBook(e.target.value)}
            />
          </Field>
          <Field label="Page">
            <input
              className="input"
              value={sourcePage}
              onChange={(e) => setSourcePage(e.target.value)}
            />
          </Field>
        </div>
      </div>

      {formError && <p className="text-sm text-destructive font-medium">{formError}</p>}
      <div className="flex gap-3">
        <button
          type="submit"
          disabled={update.isPending}
          className="btn-primary flex items-center gap-2"
        >
          {update.isPending ? (
            <>
              <div className="spinner w-4 h-4" />
              Saving...
            </>
          ) : (
            <>
              <Gem size={16} />
              Save Heritage
            </>
          )}
        </button>
        <Link href="/homebrew?tab=heritage" className="btn-outline">
          Cancel
        </Link>
      </div>
    </form>
  );
}

function AncestryEditForm({ entry }: { entry: HomebrewEntry }) {
  const router = useRouter();
  const update = useUpdateHomebrew();
  const [formError, setFormError] = useState<string | null>(null);
  const d = entry.data as Record<string, unknown>;
  const src = d.source as Record<string, unknown> | undefined;

  const [name, setName] = useState(String(d.name ?? entry.name));
  const [rarity, setRarity] = useState<Rarity>((d.rarity as Rarity) ?? "Common");
  const [traits, setTraits] = useState(
    Array.isArray(d.traits) ? (d.traits as string[]).join(", ") : String(d.traits ?? "")
  );
  const [hp, setHp] = useState(String(d.hp ?? "8"));
  const [size, setSize] = useState(String(d.size ?? "Medium"));
  const [speed, setSpeed] = useState(String(d.speed ?? "25"));
  const [abilityBoostMode, setAbilityBoostMode] = useState(
    String(d.ability_boost_mode ?? "Two free boosts")
  );
  const [abilityBoosts, setAbilityBoosts] = useState(
    Array.isArray(d.ability_boosts) ? (d.ability_boosts as string[]).join(", ") : ""
  );
  const [abilityFlaw, setAbilityFlaw] = useState(String(d.ability_flaw ?? ""));
  const [languages, setLanguages] = useState(
    Array.isArray(d.languages) ? (d.languages as string[]).join(", ") : String(d.languages ?? "")
  );
  const [additionalLanguages, setAdditionalLanguages] = useState(
    String(d.additional_languages ?? "")
  );
  const [senses, setSenses] = useState(String(d.senses ?? ""));
  const [features, setFeatures] = useState(String(d.features ?? ""));
  const [description, setDescription] = useState(String(d.description ?? ""));
  const [sourceBook, setSourceBook] = useState(String(src?.book ?? "Homebrew"));
  const [sourcePage, setSourcePage] = useState(String(src?.page ?? ""));
  const [imageUrl, setImageUrl] = useState<string | null>((d.image_url as string | null) ?? null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    if (!name.trim()) {
      setFormError("Name is required.");
      return;
    }
    if (!description.trim()) {
      setFormError("Description is required.");
      return;
    }
    try {
      await update.mutateAsync({
        id: entry.id,
        name: name.trim(),
        data: {
          id: entry.entry_key,
          name: name.trim(),
          lookup_name: name.trim().toLowerCase(),
          rarity,
          traits: traits
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean),
          hp: parseInt(hp) || 8,
          size,
          speed: parseInt(speed) || 25,
          ability_boost_mode: abilityBoostMode,
          ability_boosts: abilityBoosts
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean),
          ability_flaw: abilityFlaw || null,
          languages: languages
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean),
          additional_languages: additionalLanguages || null,
          senses: senses || null,
          features: features || null,
          description: description.trim(),
          source: {
            book: sourceBook || "Homebrew",
            page: sourcePage || null,
            source_text:
              [sourceBook, sourcePage ? `p. ${sourcePage}` : ""].filter(Boolean).join(" ") ||
              "Homebrew",
          },
          image_url: imageUrl,
        },
      });
      router.push("/homebrew?tab=ancestry");
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to save.");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="card p-6 space-y-4">
        <SectionHeading>Identity</SectionHeading>
        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-6 items-start">
          <Field label="Ancestry Name" required>
            <input
              className="input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </Field>
          <HomebrewImageUpload
            value={imageUrl}
            onChange={setImageUrl}
            label="Artwork"
            recommendedSize="256x256 px"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
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
          <Field label="Traits" hint="Comma-separated">
            <input className="input" value={traits} onChange={(e) => setTraits(e.target.value)} />
          </Field>
        </div>
      </div>

      <div className="card p-6 space-y-4">
        <SectionHeading>Core Statistics</SectionHeading>
        <div className="grid grid-cols-3 gap-4">
          <Field label="Hit Points">
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9+-]*"
              className="input"
              value={hp}
              onChange={(e) => setHp(e.target.value)}
            />
          </Field>
          <Field label="Size">
            <input className="input" value={size} onChange={(e) => setSize(e.target.value)} />
          </Field>
          <Field label="Speed">
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9+-]*"
              className="input"
              value={speed}
              onChange={(e) => setSpeed(e.target.value)}
            />
          </Field>
        </div>
        <Field label="Ability Boost Mode">
          <input
            className="input"
            value={abilityBoostMode}
            onChange={(e) => setAbilityBoostMode(e.target.value)}
          />
        </Field>
        <Field label="Ability Boosts" hint="Comma-separated">
          <input
            className="input"
            value={abilityBoosts}
            onChange={(e) => setAbilityBoosts(e.target.value)}
          />
        </Field>
        <Field label="Ability Flaw">
          <input
            className="input"
            value={abilityFlaw}
            onChange={(e) => setAbilityFlaw(e.target.value)}
          />
        </Field>
      </div>

      <div className="card p-6 space-y-4">
        <SectionHeading>Languages & Senses</SectionHeading>
        <Field label="Languages" hint="Comma-separated">
          <input
            className="input"
            value={languages}
            onChange={(e) => setLanguages(e.target.value)}
          />
        </Field>
        <Field label="Additional Languages">
          <input
            className="input"
            value={additionalLanguages}
            onChange={(e) => setAdditionalLanguages(e.target.value)}
          />
        </Field>
        <Field label="Senses">
          <input className="input" value={senses} onChange={(e) => setSenses(e.target.value)} />
        </Field>
      </div>

      <div className="card p-6 space-y-4">
        <SectionHeading>Rules Text</SectionHeading>
        <Field label="Features">
          <textarea
            className="input min-h-[100px] resize-y"
            value={features}
            onChange={(e) => setFeatures(e.target.value)}
          />
        </Field>
        <Field label="Description" required>
          <textarea
            className="input min-h-[160px] resize-y"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          />
        </Field>
      </div>

      <div className="card p-6 space-y-4">
        <SectionHeading>Source</SectionHeading>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Source Book">
            <input
              className="input"
              value={sourceBook}
              onChange={(e) => setSourceBook(e.target.value)}
            />
          </Field>
          <Field label="Page">
            <input
              className="input"
              value={sourcePage}
              onChange={(e) => setSourcePage(e.target.value)}
            />
          </Field>
        </div>
      </div>

      {formError && <p className="text-sm text-destructive font-medium">{formError}</p>}
      <div className="flex gap-3">
        <button
          type="submit"
          disabled={update.isPending}
          className="btn-primary flex items-center gap-2"
        >
          {update.isPending ? (
            <>
              <div className="spinner w-4 h-4" />
              Saving...
            </>
          ) : (
            <>
              <Users size={16} />
              Save Ancestry
            </>
          )}
        </button>
        <Link href="/homebrew?tab=ancestry" className="btn-outline">
          Cancel
        </Link>
      </div>
    </form>
  );
}

function ClassEditForm({ entry }: { entry: HomebrewEntry }) {
  const router = useRouter();
  const update = useUpdateHomebrew();
  const [formError, setFormError] = useState<string | null>(null);
  const d = entry.data as Record<string, unknown>;
  const src = d.source as Record<string, unknown> | undefined;

  const [name, setName] = useState(String(d.name ?? entry.name));
  const [rarity, setRarity] = useState<Rarity>((d.rarity as Rarity) ?? "Common");
  const [keyAbility, setKeyAbility] = useState(
    Array.isArray(d.key_ability)
      ? (d.key_ability as string[]).join(", ")
      : String(d.key_ability ?? "")
  );
  const [hpPerLevel, setHpPerLevel] = useState(String(d.hp_per_level ?? "8"));
  const [perception, setPerception] = useState(String(d.perception ?? "Trained"));
  const [savingThrows, setSavingThrows] = useState(String(d.saving_throws ?? ""));
  const [skills, setSkills] = useState(String(d.skills ?? ""));
  const [attacks, setAttacks] = useState(String(d.attacks ?? ""));
  const [defenses, setDefenses] = useState(String(d.defenses ?? ""));
  const [classDc, setClassDc] = useState(String(d.class_dc ?? "Trained"));
  const [tradition, setTradition] = useState(String(d.spellcasting_tradition ?? ""));
  const [features, setFeatures] = useState(String(d.features ?? ""));
  const [description, setDescription] = useState(String(d.description ?? ""));
  const [sourceBook, setSourceBook] = useState(String(src?.book ?? "Homebrew"));
  const [sourcePage, setSourcePage] = useState(String(src?.page ?? ""));
  const [imageUrl, setImageUrl] = useState<string | null>((d.image_url as string | null) ?? null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    if (!name.trim()) {
      setFormError("Name is required.");
      return;
    }
    if (!description.trim()) {
      setFormError("Description is required.");
      return;
    }
    try {
      await update.mutateAsync({
        id: entry.id,
        name: name.trim(),
        data: {
          id: entry.entry_key,
          name: name.trim(),
          lookup_name: name.trim().toLowerCase(),
          rarity,
          key_ability: keyAbility
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean),
          hp_per_level: parseInt(hpPerLevel) || 8,
          perception,
          saving_throws: savingThrows || null,
          skills: skills || null,
          attacks: attacks || null,
          defenses: defenses || null,
          class_dc: classDc || null,
          spellcasting_tradition: tradition || null,
          features: features || null,
          description: description.trim(),
          source: {
            book: sourceBook || "Homebrew",
            page: sourcePage || null,
            source_text:
              [sourceBook, sourcePage ? `p. ${sourcePage}` : ""].filter(Boolean).join(" ") ||
              "Homebrew",
          },
          image_url: imageUrl,
        },
      });
      router.push("/homebrew?tab=class");
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to save.");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="card p-6 space-y-4">
        <SectionHeading>Identity</SectionHeading>
        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-6 items-start">
          <Field label="Class Name" required>
            <input
              className="input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </Field>
          <HomebrewImageUpload
            value={imageUrl}
            onChange={setImageUrl}
            label="Artwork"
            recommendedSize="256x256 px"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
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
          <Field label="Key Ability" hint="Comma-separated">
            <input
              className="input"
              value={keyAbility}
              onChange={(e) => setKeyAbility(e.target.value)}
            />
          </Field>
        </div>
      </div>

      <div className="card p-6 space-y-4">
        <SectionHeading>Initial Proficiencies</SectionHeading>
        <div className="grid grid-cols-2 gap-4">
          <Field label="HP Per Level">
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9+-]*"
              className="input"
              value={hpPerLevel}
              onChange={(e) => setHpPerLevel(e.target.value)}
            />
          </Field>
          <Field label="Perception">
            <input
              className="input"
              value={perception}
              onChange={(e) => setPerception(e.target.value)}
            />
          </Field>
        </div>
        <Field label="Saving Throws">
          <input
            className="input"
            value={savingThrows}
            onChange={(e) => setSavingThrows(e.target.value)}
          />
        </Field>
        <Field label="Skills">
          <textarea
            className="input min-h-[80px] resize-y"
            value={skills}
            onChange={(e) => setSkills(e.target.value)}
          />
        </Field>
        <Field label="Attacks">
          <input className="input" value={attacks} onChange={(e) => setAttacks(e.target.value)} />
        </Field>
        <Field label="Defenses">
          <input className="input" value={defenses} onChange={(e) => setDefenses(e.target.value)} />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Class DC">
            <input className="input" value={classDc} onChange={(e) => setClassDc(e.target.value)} />
          </Field>
          <Field label="Spellcasting Tradition">
            <input
              className="input"
              value={tradition}
              onChange={(e) => setTradition(e.target.value)}
            />
          </Field>
        </div>
      </div>

      <div className="card p-6 space-y-4">
        <SectionHeading>Rules Text</SectionHeading>
        <Field label="Class Features">
          <textarea
            className="input min-h-[120px] resize-y"
            value={features}
            onChange={(e) => setFeatures(e.target.value)}
          />
        </Field>
        <Field label="Description" required>
          <textarea
            className="input min-h-[160px] resize-y"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          />
        </Field>
      </div>

      <div className="card p-6 space-y-4">
        <SectionHeading>Source</SectionHeading>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Source Book">
            <input
              className="input"
              value={sourceBook}
              onChange={(e) => setSourceBook(e.target.value)}
            />
          </Field>
          <Field label="Page">
            <input
              className="input"
              value={sourcePage}
              onChange={(e) => setSourcePage(e.target.value)}
            />
          </Field>
        </div>
      </div>

      {formError && <p className="text-sm text-destructive font-medium">{formError}</p>}
      <div className="flex gap-3">
        <button
          type="submit"
          disabled={update.isPending}
          className="btn-primary flex items-center gap-2"
        >
          {update.isPending ? (
            <>
              <div className="spinner w-4 h-4" />
              Saving...
            </>
          ) : (
            <>
              <GraduationCap size={16} />
              Save Class
            </>
          )}
        </button>
        <Link href="/homebrew?tab=class" className="btn-outline">
          Cancel
        </Link>
      </div>
    </form>
  );
}

function BackgroundEditForm({ entry }: { entry: HomebrewEntry }) {
  const router = useRouter();
  const update = useUpdateHomebrew();
  const [formError, setFormError] = useState<string | null>(null);
  const d = entry.data as Record<string, unknown>;
  const src = d.source as Record<string, unknown> | undefined;

  const [name, setName] = useState(String(d.name ?? entry.name));
  const [rarity, setRarity] = useState<Rarity>((d.rarity as Rarity) ?? "Common");
  const [traits, setTraits] = useState(
    Array.isArray(d.traits) ? (d.traits as string[]).join(", ") : String(d.traits ?? "")
  );
  const [abilityBoosts, setAbilityBoosts] = useState(
    Array.isArray(d.ability_boosts) ? (d.ability_boosts as string[]).join(", ") : ""
  );
  const [trainedSkill, setTrainedSkill] = useState(String(d.trained_skill ?? ""));
  const [loreSkill, setLoreSkill] = useState(String(d.lore_skill ?? ""));
  const [skillFeat, setSkillFeat] = useState(String(d.skill_feat ?? ""));
  const [description, setDescription] = useState(String(d.description ?? ""));
  const [special, setSpecial] = useState(String(d.special ?? ""));
  const [sourceBook, setSourceBook] = useState(String(src?.book ?? "Homebrew"));
  const [sourcePage, setSourcePage] = useState(String(src?.page ?? ""));
  const [imageUrl, setImageUrl] = useState<string | null>((d.image_url as string | null) ?? null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    if (!name.trim()) {
      setFormError("Name is required.");
      return;
    }
    if (!description.trim()) {
      setFormError("Description is required.");
      return;
    }
    try {
      await update.mutateAsync({
        id: entry.id,
        name: name.trim(),
        data: {
          id: entry.entry_key,
          name: name.trim(),
          lookup_name: name.trim().toLowerCase(),
          rarity,
          traits: traits
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean),
          ability_boosts: abilityBoosts
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean),
          trained_skill: trainedSkill || null,
          lore_skill: loreSkill || null,
          skill_feat: skillFeat || null,
          description: description.trim(),
          special: special || null,
          source: {
            book: sourceBook || "Homebrew",
            page: sourcePage || null,
            source_text:
              [sourceBook, sourcePage ? `p. ${sourcePage}` : ""].filter(Boolean).join(" ") ||
              "Homebrew",
          },
          image_url: imageUrl,
        },
      });
      router.push("/homebrew?tab=background");
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to save.");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="card p-6 space-y-4">
        <SectionHeading>Identity</SectionHeading>
        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-6 items-start">
          <Field label="Background Name" required>
            <input
              className="input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </Field>
          <HomebrewImageUpload
            value={imageUrl}
            onChange={setImageUrl}
            label="Artwork"
            recommendedSize="256x256 px"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
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
          <Field label="Traits" hint="Comma-separated">
            <input className="input" value={traits} onChange={(e) => setTraits(e.target.value)} />
          </Field>
        </div>
      </div>

      <div className="card p-6 space-y-4">
        <SectionHeading>Character Options</SectionHeading>
        <Field label="Ability Boosts" hint="Comma-separated">
          <input
            className="input"
            value={abilityBoosts}
            onChange={(e) => setAbilityBoosts(e.target.value)}
          />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Trained Skill">
            <input
              className="input"
              value={trainedSkill}
              onChange={(e) => setTrainedSkill(e.target.value)}
            />
          </Field>
          <Field label="Lore Skill">
            <input
              className="input"
              value={loreSkill}
              onChange={(e) => setLoreSkill(e.target.value)}
            />
          </Field>
        </div>
        <Field label="Skill Feat">
          <input
            className="input"
            value={skillFeat}
            onChange={(e) => setSkillFeat(e.target.value)}
          />
        </Field>
      </div>

      <div className="card p-6 space-y-4">
        <SectionHeading>Rules Text</SectionHeading>
        <Field label="Description" required>
          <textarea
            className="input min-h-[160px] resize-y"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          />
        </Field>
        <Field label="Special">
          <textarea
            className="input min-h-[80px] resize-y"
            value={special}
            onChange={(e) => setSpecial(e.target.value)}
          />
        </Field>
      </div>

      <div className="card p-6 space-y-4">
        <SectionHeading>Source</SectionHeading>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Source Book">
            <input
              className="input"
              value={sourceBook}
              onChange={(e) => setSourceBook(e.target.value)}
            />
          </Field>
          <Field label="Page">
            <input
              className="input"
              value={sourcePage}
              onChange={(e) => setSourcePage(e.target.value)}
            />
          </Field>
        </div>
      </div>

      {formError && <p className="text-sm text-destructive font-medium">{formError}</p>}
      <div className="flex gap-3">
        <button
          type="submit"
          disabled={update.isPending}
          className="btn-primary flex items-center gap-2"
        >
          {update.isPending ? (
            <>
              <div className="spinner w-4 h-4" />
              Saving...
            </>
          ) : (
            <>
              <BookOpen size={16} />
              Save Background
            </>
          )}
        </button>
        <Link href="/homebrew?tab=background" className="btn-outline">
          Cancel
        </Link>
      </div>
    </form>
  );
}

function MonsterEditForm({ entry }: { entry: HomebrewEntry }) {
  const router = useRouter();
  const update = useUpdateHomebrew();
  const [formError, setFormError] = useState<string | null>(null);
  const [mode, setMode] = useState<"form" | "json">("form");

  const d = entry.data as Record<string, unknown>;
  const core = (d.core ?? {}) as Record<string, unknown>;
  const rich = (d.rich ?? {}) as Record<string, unknown>;
  const saves = (core.saves ?? {}) as Record<string, unknown>;
  const speedRaw = (rich.speed ?? {}) as Record<string, unknown>;
  const mods = (rich.ability_modifiers ?? {}) as Record<string, unknown>;
  const defsRaw = (rich.defenses ?? {}) as Record<string, unknown>;

  // Form state — initialised from stored data
  const [name, setName] = useState(String(core.name ?? d.name ?? entry.name));
  const [level, setLevel] = useState(String(core.level ?? "1"));
  const [size, setSize] = useState(String(core.size ?? "Medium"));
  const [rarity, setRarity] = useState<Rarity>((core.rarity as Rarity) ?? "Common");
  const [traits, setTraits] = useState(
    Array.isArray(core.traits) ? (core.traits as string[]).join(", ") : String(core.traits ?? "")
  );
  const [hp, setHp] = useState(String(core.hp ?? ""));
  const [ac, setAc] = useState(String(core.ac ?? ""));
  const [perception, setPerception] = useState(String(core.perception ?? ""));
  const [fort, setFort] = useState(String(saves.fort ?? ""));
  const [ref, setRef] = useState(String(saves.ref ?? ""));
  const [will, setWill] = useState(String(saves.will ?? ""));
  const [immunities, setImmunities] = useState(
    Array.isArray(defsRaw.immunities) ? (defsRaw.immunities as string[]).join(", ") : ""
  );
  const [hpNotes, setHpNotes] = useState(
    Array.isArray(defsRaw.hp_notes) && (defsRaw.hp_notes as string[]).length > 0
      ? String((defsRaw.hp_notes as string[])[0])
      : ""
  );
  const [weaknesses, setWeaknesses] = useState<DefenseRow[]>(() =>
    defenseRowsFromRaw(defsRaw.weaknesses)
  );
  const [resistances, setResistances] = useState<DefenseRow[]>(() =>
    defenseRowsFromRaw(defsRaw.resistances)
  );
  const [landSpeed, setLandSpeed] = useState(String(speedRaw.land ?? "25"));
  const [flySpeed, setFlySpeed] = useState(speedRaw.fly != null ? String(speedRaw.fly) : "");
  const [burrowSpeed, setBurrowSpeed] = useState(
    speedRaw.burrow != null ? String(speedRaw.burrow) : ""
  );
  const [swimSpeed, setSwimSpeed] = useState(speedRaw.swim != null ? String(speedRaw.swim) : "");
  const [climbSpeed, setClimbSpeed] = useState(
    speedRaw.climb != null ? String(speedRaw.climb) : ""
  );
  const [senses, setSenses] = useState((rich.senses as string[] | undefined)?.join(", ") ?? "");
  const [languages, setLanguages] = useState(
    (rich.languages as string[] | undefined)?.join(", ") ?? ""
  );
  const [description, setDescription] = useState(String(rich.description ?? ""));
  const [strMod, setStrMod] = useState(String(mods.str ?? ""));
  const [dexMod, setDexMod] = useState(String(mods.dex ?? ""));
  const [conMod, setConMod] = useState(String(mods.con ?? ""));
  const [intMod, setIntMod] = useState(String(mods.int ?? ""));
  const [wisMod, setWisMod] = useState(String(mods.wis ?? ""));
  const [chaMod, setChaMod] = useState(String(mods.cha ?? ""));
  const [imageUrl, setImageUrl] = useState<string | null>((d.image_url as string | null) ?? null);
  const [skills, setSkills] = useState<SkillRow[]>(() => skillsToRows(rich.skills));
  const [items, setItems] = useState<string[]>(
    Array.isArray(rich.items) ? (rich.items as string[]) : []
  );
  const [itemDraft, setItemDraft] = useState("");
  const [attacks, setAttacks] = useState<AttackRow[]>(() => attacksFromRaw(rich.attacks));
  const [abilities, setAbilities] = useState<AbilityRow[]>(() => {
    const abils = (rich.abilities ?? {}) as { mid?: unknown };
    return abilitiesFromRaw(abils.mid);
  });

  // ── Generic row helpers ─────────────────────────────────────────────────────
  function addRow<T>(setter: React.Dispatch<React.SetStateAction<T[]>>, blank: T) {
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

  // JSON mode — strip internal fields for display
  const cleanData = { ...d };
  delete (cleanData as Record<string, unknown>)._homebrew;
  delete (cleanData as Record<string, unknown>)._addedBy;
  const [jsonText, setJsonText] = useState(JSON.stringify(cleanData, null, 2));

  function parseMod(raw: string): number | null {
    const n = parseInt(raw);
    return isNaN(n) ? null : n;
  }

  async function handleFormSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    if (!name.trim()) {
      setFormError("Name is required.");
      return;
    }
    if (!hp || !ac) {
      setFormError("HP and AC are required.");
      return;
    }
    const traitsList = traits
      ? traits
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean)
      : [];
    const newCore = {
      name: name.trim(),
      level: parseInt(level) || 0,
      size,
      traits: traitsList,
      rarity,
      hp: parseInt(hp) || 0,
      ac: parseInt(ac) || 0,
      perception: parseInt(perception) || 0,
      saves: { fort: parseInt(fort) || 0, ref: parseInt(ref) || 0, will: parseInt(will) || 0 },
      source: core.source ?? { summary_source: null },
      has_rich_data: true,
    };
    const speedObj: Record<string, number> = { land: parseInt(landSpeed) || 25 };
    if (flySpeed.trim()) speedObj.fly = parseInt(flySpeed) || 0;
    if (burrowSpeed.trim()) speedObj.burrow = parseInt(burrowSpeed) || 0;
    if (swimSpeed.trim()) speedObj.swim = parseInt(swimSpeed) || 0;
    if (climbSpeed.trim()) speedObj.climb = parseInt(climbSpeed) || 0;

    const newRich = {
      ...rich,
      name: name.trim(),
      level: parseInt(level) || 0,
      size,
      creature_traits: traitsList,
      perception: parseInt(perception) || 0,
      senses: senses ? senses.split(",").map((s) => s.trim()) : [],
      languages: languages ? languages.split(",").map((l) => l.trim()) : [],
      skills: buildSkillsObject(skills),
      ability_modifiers: {
        str: parseMod(strMod),
        dex: parseMod(dexMod),
        con: parseMod(conMod),
        int: parseMod(intMod),
        wis: parseMod(wisMod),
        cha: parseMod(chaMod),
      },
      items,
      speed: speedObj,
      defenses: {
        ...((rich.defenses as object) ?? {}),
        ac: parseInt(ac) || 0,
        saves: { Fort: parseInt(fort) || 0, Ref: parseInt(ref) || 0, Will: parseInt(will) || 0 },
        hp: parseInt(hp) || 0,
        hp_notes: hpNotes.trim() ? [hpNotes.trim()] : [],
        immunities: immunities
          ? immunities
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean)
          : [],
        weaknesses: weaknesses
          .filter((w) => w.type.trim())
          .map((w) => ({ type: w.type.trim(), value: parseInt(w.value) || 0 })),
        resistances: resistances
          .filter((r) => r.type.trim())
          .map((r) => ({ type: r.type.trim(), value: parseInt(r.value) || 0 })),
      },
      attacks: attacks
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
      abilities: {
        top: (rich.abilities as { top?: unknown[] } | undefined)?.top ?? [],
        mid: abilities
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
        bot: (rich.abilities as { bot?: unknown[] } | undefined)?.bot ?? [],
      },
      description: description || null,
    };
    try {
      await update.mutateAsync({
        id: entry.id,
        name: name.trim(),
        data: {
          name: name.trim(),
          core: newCore,
          rich: newRich,
          summary: d.summary,
          image_url: imageUrl,
        },
      });
      router.push("/homebrew?tab=monster");
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to save.");
    }
  }

  async function handleJsonSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(jsonText);
    } catch {
      setFormError("Invalid JSON — fix syntax and try again.");
      return;
    }
    const entryName =
      (parsed.name as string) ?? ((parsed.core as Record<string, unknown>)?.name as string);
    if (!entryName) {
      setFormError('JSON must have a top-level "name" field.');
      return;
    }
    try {
      await update.mutateAsync({ id: entry.id, name: entryName, data: parsed });
      router.push("/homebrew?tab=monster");
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to save.");
    }
  }

  const levels = Array.from({ length: 32 }, (_, i) => String(i - 1));

  return (
    <div className="space-y-6">
      <div className="flex gap-1 p-1 bg-muted/40 rounded-lg border border-border w-fit">
        {(
          [
            ["form", LayoutList, "Form Builder"],
            ["json", FileCode, "JSON"],
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

      {mode === "form" && (
        <form onSubmit={handleFormSubmit} className="space-y-6">
          <div className="card p-6 space-y-4">
            <SectionHeading>Identity</SectionHeading>
            <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-6 items-start">
              <Field label="Name" required>
                <input
                  className="input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
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
                <select className="input" value={level} onChange={(e) => setLevel(e.target.value)}>
                  {levels.map((l) => (
                    <option key={l}>{l}</option>
                  ))}
                </select>
              </Field>
              <Field label="Size">
                <select className="input" value={size} onChange={(e) => setSize(e.target.value)}>
                  {["Tiny", "Small", "Medium", "Large", "Huge", "Gargantuan"].map((s) => (
                    <option key={s}>{s}</option>
                  ))}
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
            <Field label="Traits" hint="Comma-separated">
              <input className="input" value={traits} onChange={(e) => setTraits(e.target.value)} />
            </Field>
          </div>

          <div className="card p-6 space-y-4">
            <SectionHeading>Defenses</SectionHeading>
            <div className="grid grid-cols-3 gap-4">
              <Field label="HP" required>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9+-]*"
                  className="input"
                  value={hp}
                  onChange={(e) => setHp(e.target.value)}
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
                onClick={() => addRow(setWeaknesses, { type: "", value: "" })}
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
                onClick={() => addRow(setResistances, { type: "", value: "" })}
                className="btn-outline text-sm flex items-center gap-1.5"
              >
                <Plus size={13} />
                Add Resistance
              </button>
            </div>
          </div>

          <div className="card p-6 space-y-4">
            <SectionHeading>Ability Modifiers</SectionHeading>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
              {(
                [
                  ["STR", strMod, setStrMod],
                  ["DEX", dexMod, setDexMod],
                  ["CON", conMod, setConMod],
                  ["INT", intMod, setIntMod],
                  ["WIS", wisMod, setWisMod],
                  ["CHA", chaMod, setChaMod],
                ] as const
              ).map(([label, val, setter]) => (
                <div key={label as string}>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1 text-center">
                    {label as string}
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9+-]*"
                    className="input text-center"
                    value={val as string}
                    onChange={(e) => (setter as (v: string) => void)(e.target.value)}
                    placeholder="+0"
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="card p-6 space-y-4">
            <SectionHeading>Skills</SectionHeading>
            {skills.length === 0 && (
              <p className="text-sm text-muted-foreground">No skills added yet.</p>
            )}
            <datalist id="pf2e-skills-edit">
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
                    list="pf2e-skills-edit"
                    className="input flex-1"
                    placeholder="e.g. Stealth"
                    value={row.name}
                    onChange={(e) => {
                      const next = [...skills];
                      next[i] = { ...next[i], name: e.target.value };
                      setSkills(next);
                    }}
                  />
                  <div className="flex items-center gap-1 shrink-0">
                    <span className="text-muted-foreground text-sm">+</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9+-]*"
                      className="input w-20 text-center"
                      value={row.bonus}
                      onChange={(e) => {
                        const next = [...skills];
                        next[i] = { ...next[i], bonus: e.target.value };
                        setSkills(next);
                      }}
                      placeholder="0"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => setSkills(skills.filter((_, j) => j !== i))}
                    className="p-1.5 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors shrink-0"
                    title="Remove skill"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setSkills([...skills, { name: PF2E_SKILLS[0], bonus: "" }])}
              className="btn-outline text-sm flex items-center gap-1.5"
            >
              + Add Skill
            </button>
          </div>

          <div className="card p-6 space-y-4">
            <SectionHeading>Movement, Senses &amp; Languages</SectionHeading>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <Field label="Land Speed (ft)">
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9+-]*"
                  className="input"
                  value={landSpeed}
                  onChange={(e) => setLandSpeed(e.target.value)}
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
            <Field label="Senses" hint="Comma-separated">
              <input className="input" value={senses} onChange={(e) => setSenses(e.target.value)} />
            </Field>
            <Field label="Languages" hint="Comma-separated">
              <input
                className="input"
                value={languages}
                onChange={(e) => setLanguages(e.target.value)}
              />
            </Field>
          </div>

          {/* Items */}
          <div className="card p-6 space-y-4">
            <SectionHeading>Items</SectionHeading>
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
            <SectionHeading>Attacks</SectionHeading>
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
                addRow(setAttacks, { kind: "Melee", name: "", bonus: "", traits: "", damage: "" })
              }
              className="btn-outline text-sm flex items-center gap-1.5"
            >
              <Plus size={13} />
              Add Attack
            </button>
          </div>

          {/* Abilities */}
          <div className="card p-6 space-y-4">
            <SectionHeading>Special Abilities</SectionHeading>
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
                      onChange={(e) => updateRow(setAbilities, i, { description: e.target.value })}
                    />
                  </Field>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={() =>
                addRow(setAbilities, { name: "", cost: "2 Actions", traits: "", description: "" })
              }
              className="btn-outline text-sm flex items-center gap-1.5"
            >
              <Plus size={13} />
              Add Ability
            </button>
          </div>

          <div className="card p-6 space-y-4">
            <SectionHeading>Description</SectionHeading>
            <Field label="Creature Description">
              <textarea
                className="input min-h-[120px] resize-y"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </Field>
          </div>

          {formError && <p className="text-sm text-destructive font-medium">{formError}</p>}
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={update.isPending}
              className="btn-primary flex items-center gap-2"
            >
              {update.isPending ? (
                <>
                  <div className="spinner w-4 h-4" />
                  Saving…
                </>
              ) : (
                <>
                  <Swords size={16} />
                  Save Monster
                </>
              )}
            </button>
            <Link href="/homebrew?tab=monster" className="btn-outline">
              Cancel
            </Link>
          </div>
        </form>
      )}

      {mode === "json" && (
        <form onSubmit={handleJsonSubmit} className="space-y-6">
          <div className="card p-6 space-y-4">
            <SectionHeading>JSON</SectionHeading>
            <p className="text-sm text-muted-foreground">
              Edit the raw monster object. Must include a top-level{" "}
              <code className="text-xs bg-muted px-1 py-0.5 rounded">name</code> field.
            </p>
            <textarea
              className="input min-h-[400px] resize-y font-mono text-xs"
              value={jsonText}
              onChange={(e) => setJsonText(e.target.value)}
              spellCheck={false}
            />
          </div>
          {formError && <p className="text-sm text-destructive font-medium">{formError}</p>}
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={update.isPending}
              className="btn-primary flex items-center gap-2"
            >
              {update.isPending ? (
                <>
                  <div className="spinner w-4 h-4" />
                  Saving…
                </>
              ) : (
                <>
                  <FileCode size={16} />
                  Save Monster
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
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

const TYPE_META: Record<string, { label: string; icon: typeof Sparkles; tab: string }> = {
  spell: { label: "Spell", icon: Sparkles, tab: "spell" },
  item: { label: "Item", icon: Package, tab: "item" },
  monster: { label: "Monster", icon: Swords, tab: "monster" },
  feat: { label: "Feat", icon: BadgeCheck, tab: "feat" },
  heritage: { label: "Heritage", icon: Gem, tab: "heritage" },
  ancestry: { label: "Ancestry", icon: Users, tab: "ancestry" },
  class: { label: "Class", icon: GraduationCap, tab: "class" },
  background: { label: "Background", icon: BookOpen, tab: "background" },
};

export default function EditHomebrewPage() {
  const { id } = useParams<{ id: string }>();
  const { data, isLoading, error } = useHomebrewEntry(id);

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center py-16">
          <div className="spinner" />
        </div>
      </MainLayout>
    );
  }

  if (error || !data?.data) {
    return (
      <MainLayout>
        <div className="space-y-4">
          <Link href="/homebrew" className="inline-flex items-center gap-2 text-primary text-sm">
            <ArrowLeft size={14} /> Back to Homebrew
          </Link>
          <div className="card p-6 bg-destructive/10 border-destructive">
            <p className="text-destructive font-semibold">Entry not found</p>
            <p className="text-sm text-muted-foreground mt-1">{error?.message}</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  const entry = data.data;
  const meta = TYPE_META[entry.type] ?? TYPE_META.spell;
  const Icon = meta.icon;

  return (
    <MainLayout>
      <div className="max-w-3xl space-y-6">
        <Link
          href={`/homebrew?tab=${meta.tab}`}
          className="inline-flex items-center gap-2 text-primary hover:text-primary/80 text-sm"
        >
          <ArrowLeft size={14} />
          Back to Homebrew
        </Link>

        <div>
          <h1 className="font-heading text-3xl font-bold mb-1 flex items-center gap-2">
            <Icon className="text-primary" size={28} />
            Edit {meta.label}
          </h1>
          <p className="text-muted-foreground text-sm">
            <span className="font-mono text-xs bg-muted px-2 py-0.5 rounded">
              {entry.entry_key}
            </span>
            <span className="ml-2">— changes take effect in the bot immediately via Realtime.</span>
          </p>
        </div>

        {entry.type === "spell" && <SpellEditForm entry={entry} />}
        {entry.type === "item" && <ItemEditForm entry={entry} />}
        {entry.type === "monster" && <MonsterEditForm entry={entry} />}
        {entry.type === "feat" && <FeatEditForm entry={entry} />}
        {entry.type === "heritage" && <HeritageEditForm entry={entry} />}
        {entry.type === "ancestry" && <AncestryEditForm entry={entry} />}
        {entry.type === "class" && <ClassEditForm entry={entry} />}
        {entry.type === "background" && <BackgroundEditForm entry={entry} />}
      </div>
    </MainLayout>
  );
}
