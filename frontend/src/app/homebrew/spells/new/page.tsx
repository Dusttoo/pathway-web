"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MainLayout } from "@/components/layout";
import { useCreateHomebrew } from "@/lib/hooks/use-homebrew";
import { HomebrewImageUpload } from "@/components/homebrew/HomebrewImageUpload";
import { ArrowLeft, Sparkles } from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

type SpellType = "Spell" | "Cantrip" | "Focus" | "Ritual";
type Rarity = "Common" | "Uncommon" | "Rare" | "Unique";

const TRADITIONS = ["arcane", "divine", "occult", "primal"] as const;
type Tradition = (typeof TRADITIONS)[number];

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

// ── Helpers ───────────────────────────────────────────────────────────────────

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1">{label}</label>
      {children}
      {hint && <p className="text-xs text-muted-foreground mt-1">{hint}</p>}
    </div>
  );
}

function Select({
  value,
  onChange,
  options,
  className = "",
}: {
  value: string;
  onChange: (v: string) => void;
  options: readonly string[];
  className?: string;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`input ${className}`}
    >
      {options.map((o) => (
        <option key={o} value={o}>
          {o}
        </option>
      ))}
    </select>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function NewSpellPage() {
  const router = useRouter();
  const createHomebrew = useCreateHomebrew();
  const [formError, setFormError] = useState<string | null>(null);

  // Form fields
  const [name, setName] = useState("");
  const [type, setType] = useState<SpellType>("Spell");
  const [level, setLevel] = useState("1");
  const [rarity, setRarity] = useState<Rarity>("Common");
  const [traditions, setTraditions] = useState<Set<Tradition>>(new Set());
  const [traits, setTraits] = useState("");
  const [cast, setCast] = useState("2 Actions");
  const [castCustom, setCastCustom] = useState("");
  const [trigger, setTrigger] = useState("");
  const [requirements, setRequirements] = useState("");
  const [target, setTarget] = useState("");
  const [range, setRange] = useState("");
  const [area, setArea] = useState("");
  const [duration, setDuration] = useState("");
  const [defense, setDefense] = useState("");
  const [description, setDescription] = useState("");
  const [heightened, setHeightened] = useState("");
  const [source, setSource] = useState("Homebrew");
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  function toggleTradition(t: Tradition) {
    setTraditions((prev) => {
      const next = new Set(prev);
      next.has(t) ? next.delete(t) : next.add(t);
      return next;
    });
  }

  // Cantrips are always level 0; focus/ritual don't really use rank the same way
  const effectiveLevel =
    type === "Cantrip" ? "0" : level;

  const traditionsStr = Array.from(traditions).join(", ");

  const castValue = cast === "Other" ? castCustom : cast;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    if (!name.trim()) {
      setFormError("Spell name is required.");
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

    const spellData = {
      name: name.trim(),
      source,
      traditions: traditionsStr,
      rarity,
      traits,
      type,
      level: effectiveLevel,
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
      damage: { base: "", type: "", extra: "" },
      heightening: null,
      rolls: [],
      image_url: imageUrl,
    };

    try {
      await createHomebrew.mutateAsync({
        type: "spell",
        name: name.trim(),
        data: spellData,
      });
      router.push("/homebrew?tab=spell");
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to create spell.");
    }
  }

  return (
    <MainLayout>
      <div className="max-w-3xl space-y-6">
        {/* Back */}
        <Link
          href="/homebrew?tab=spell"
          className="inline-flex items-center gap-2 text-primary hover:text-primary/80 text-sm"
        >
          <ArrowLeft size={14} />
          Back to Homebrew
        </Link>

        {/* Header */}
        <div>
          <h1 className="font-heading text-3xl font-bold mb-1 flex items-center gap-2">
            <Sparkles className="text-primary" size={28} />
            New Homebrew Spell
          </h1>
          <p className="text-muted-foreground text-sm">
            Creates a spell the Pathway bot can look up in any Discord server.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Core identity */}
          <div className="card p-6 space-y-4">
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Core Identity
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-6 items-start">
              <Field label="Spell Name" hint="Must be unique — if the name already exists, it will be saved as 'Name (Homebrew)'.">
                <input
                  type="text"
                  className="input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Ember Lance"
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
                <Select
                  value={type}
                  onChange={(v) => setType(v as SpellType)}
                  options={["Spell", "Cantrip", "Focus", "Ritual"]}
                />
              </Field>

              <Field label={type === "Cantrip" ? "Rank (auto: 0)" : "Rank"}>
                <Select
                  value={type === "Cantrip" ? "0" : level}
                  onChange={setLevel}
                  options={["0","1","2","3","4","5","6","7","8","9","10"]}
                  className={type === "Cantrip" ? "opacity-50 pointer-events-none" : ""}
                />
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Rarity">
                <Select
                  value={rarity}
                  onChange={(v) => setRarity(v as Rarity)}
                  options={["Common", "Uncommon", "Rare", "Unique"]}
                />
              </Field>
              <Field label="Source">
                <input
                  type="text"
                  className="input"
                  value={source}
                  onChange={(e) => setSource(e.target.value)}
                  placeholder="Homebrew"
                />
              </Field>
            </div>

            {/* Traditions (only for non-Focus) */}
            {type !== "Focus" && type !== "Ritual" && (
              <Field
                label="Traditions"
                hint={type === "Cantrip" ? "Cantrips may belong to any tradition." : "Select all that apply."}
              >
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

            <Field label="Traits" hint="Comma-separated list, e.g. fire, evocation, attack">
              <input
                type="text"
                className="input"
                value={traits}
                onChange={(e) => setTraits(e.target.value)}
                placeholder="fire, evocation"
              />
            </Field>
          </div>

          {/* Casting details */}
          <div className="card p-6 space-y-4">
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Casting
            </h2>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Cast">
                <Select
                  value={cast}
                  onChange={setCast}
                  options={[...CAST_OPTIONS, "Other"]}
                />
              </Field>
              {cast === "Other" && (
                <Field label="Custom Cast Time">
                  <input
                    type="text"
                    className="input"
                    value={castCustom}
                    onChange={(e) => setCastCustom(e.target.value)}
                    placeholder="e.g. 1 minute"
                  />
                </Field>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Trigger" hint="For reactions.">
                <input
                  type="text"
                  className="input"
                  value={trigger}
                  onChange={(e) => setTrigger(e.target.value)}
                  placeholder="An enemy within 30 feet…"
                />
              </Field>
              <Field label="Requirements">
                <input
                  type="text"
                  className="input"
                  value={requirements}
                  onChange={(e) => setRequirements(e.target.value)}
                  placeholder="You must be holding…"
                />
              </Field>
            </div>
          </div>

          {/* Range / area / duration */}
          <div className="card p-6 space-y-4">
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Range, Area &amp; Duration
            </h2>

            <div className="grid grid-cols-3 gap-4">
              <Field label="Range">
                <input
                  type="text"
                  className="input"
                  value={range}
                  onChange={(e) => setRange(e.target.value)}
                  placeholder="60 feet"
                />
              </Field>
              <Field label="Area">
                <input
                  type="text"
                  className="input"
                  value={area}
                  onChange={(e) => setArea(e.target.value)}
                  placeholder="20-foot burst"
                />
              </Field>
              <Field label="Duration">
                <input
                  type="text"
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
                  type="text"
                  className="input"
                  value={target}
                  onChange={(e) => setTarget(e.target.value)}
                  placeholder="1 creature"
                />
              </Field>
              <Field label="Defense / Saving Throw">
                <input
                  type="text"
                  className="input"
                  value={defense}
                  onChange={(e) => setDefense(e.target.value)}
                  placeholder="Reflex"
                />
              </Field>
            </div>
          </div>

          {/* Description */}
          <div className="card p-6 space-y-4">
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Description
            </h2>

            <Field label="Spell Description" hint="Full rules text. Supports plain text — no Markdown rendering in the bot.">
              <textarea
                className="input min-h-[160px] resize-y"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="You hurl a lance of magical fire…"
                required
              />
            </Field>

            <Field label="Heightened" hint="Describe how the spell improves at higher ranks, e.g. '+2 Each additional rank adds 1d6 fire damage.'">
              <textarea
                className="input min-h-[80px] resize-y"
                value={heightened}
                onChange={(e) => setHeightened(e.target.value)}
                placeholder="+2 The damage increases by 2d6."
              />
            </Field>
          </div>

          {/* Submit */}
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
                  <Sparkles size={16} />
                  Create Spell
                </>
              )}
            </button>
            <Link href="/homebrew?tab=spell" className="btn-outline">
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </MainLayout>
  );
}
