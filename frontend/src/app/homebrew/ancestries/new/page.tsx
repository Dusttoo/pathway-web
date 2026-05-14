"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MainLayout } from "@/components/layout";
import { useCreateHomebrew } from "@/lib/hooks/use-homebrew";
import { HomebrewImageUpload } from "@/components/homebrew/HomebrewImageUpload";
import { ArrowLeft, Users } from "lucide-react";

type Rarity = "Common" | "Uncommon" | "Rare" | "Unique";
type AbilityBoostMode = "Two free boosts" | "Fixed boosts + free boost" | "Custom";

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

function toSlug(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function listFromComma(raw: string) {
  return raw
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export default function NewAncestryPage() {
  const router = useRouter();
  const createHomebrew = useCreateHomebrew();
  const [formError, setFormError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [rarity, setRarity] = useState<Rarity>("Common");
  const [traits, setTraits] = useState("");
  const [hp, setHp] = useState("8");
  const [size, setSize] = useState("Medium");
  const [speed, setSpeed] = useState("25");
  const [abilityBoostMode, setAbilityBoostMode] = useState<AbilityBoostMode>("Two free boosts");
  const [abilityBoosts, setAbilityBoosts] = useState("");
  const [abilityFlaw, setAbilityFlaw] = useState("");
  const [languages, setLanguages] = useState("Common");
  const [additionalLanguages, setAdditionalLanguages] = useState("");
  const [senses, setSenses] = useState("");
  const [features, setFeatures] = useState("");
  const [description, setDescription] = useState("");
  const [sourceBook, setSourceBook] = useState("Homebrew");
  const [sourcePage, setSourcePage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    if (!name.trim()) {
      setFormError("Ancestry name is required.");
      return;
    }
    if (!description.trim()) {
      setFormError("Ancestry description is required.");
      return;
    }

    const sourceText = [sourceBook, sourcePage ? `p. ${sourcePage}` : ""].filter(Boolean).join(" ");
    const ancestryData = {
      id: toSlug(name),
      name: name.trim(),
      lookup_name: name.trim().toLowerCase(),
      rarity,
      traits: listFromComma(traits),
      hp: parseInt(hp) || 8,
      size,
      speed: parseInt(speed) || 25,
      ability_boost_mode: abilityBoostMode,
      ability_boosts:
        abilityBoostMode === "Two free boosts" ? ["free", "free"] : listFromComma(abilityBoosts),
      ability_flaw: abilityFlaw || null,
      languages: listFromComma(languages),
      additional_languages: additionalLanguages || null,
      senses: senses || null,
      features: features || null,
      description: description.trim(),
      source: {
        book: sourceBook || "Homebrew",
        page: sourcePage || null,
        source_text: sourceText || "Homebrew",
      },
      image_url: imageUrl,
    };

    try {
      await createHomebrew.mutateAsync({
        type: "ancestry",
        name: name.trim(),
        data: ancestryData,
      });
      router.push("/homebrew?tab=ancestry");
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to create ancestry.");
    }
  }

  return (
    <MainLayout>
      <div className="max-w-3xl space-y-6">
        <Link
          href="/homebrew?tab=ancestry"
          className="inline-flex items-center gap-2 text-primary hover:text-primary/80 text-sm"
        >
          <ArrowLeft size={14} />
          Back to Homebrew
        </Link>

        <div>
          <h1 className="font-heading text-3xl font-bold mb-1 flex items-center gap-2">
            <Users className="text-primary" size={28} />
            New Homebrew Ancestry
          </h1>
          <p className="text-muted-foreground text-sm">
            Creates a Pathfinder 2e ancestry for custom character options.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="card p-6 space-y-4">
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Identity
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-6 items-start">
              <Field label="Ancestry Name" required>
                <input
                  className="input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Stormmarked Elf"
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
              <Field label="Traits" hint="Comma-separated, e.g. elf, humanoid">
                <input
                  className="input"
                  value={traits}
                  onChange={(e) => setTraits(e.target.value)}
                />
              </Field>
            </div>
          </div>

          <div className="card p-6 space-y-4">
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Core Statistics
            </h2>
            <div className="grid grid-cols-3 gap-4">
              <Field label="Hit Points">
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9+-]*"
                  className="input"
                  value={hp}
                  onChange={(e) => setHp(e.target.value)}
                  min={1}
                />
              </Field>
              <Field label="Size">
                <select className="input" value={size} onChange={(e) => setSize(e.target.value)}>
                  {["Tiny", "Small", "Medium", "Large"].map((value) => (
                    <option key={value}>{value}</option>
                  ))}
                </select>
              </Field>
              <Field label="Speed">
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9+-]*"
                  className="input"
                  value={speed}
                  onChange={(e) => setSpeed(e.target.value)}
                  min={0}
                />
              </Field>
            </div>
            <Field label="Ability Boosts">
              <select
                className="input"
                value={abilityBoostMode}
                onChange={(e) => setAbilityBoostMode(e.target.value as AbilityBoostMode)}
              >
                {(["Two free boosts", "Fixed boosts + free boost", "Custom"] as const).map(
                  (value) => (
                    <option key={value}>{value}</option>
                  )
                )}
              </select>
            </Field>
            {abilityBoostMode !== "Two free boosts" && (
              <Field
                label="Boost Details"
                hint="Comma-separated, e.g. Dexterity, Intelligence, Free"
              >
                <input
                  className="input"
                  value={abilityBoosts}
                  onChange={(e) => setAbilityBoosts(e.target.value)}
                />
              </Field>
            )}
            <Field label="Ability Flaw">
              <input
                className="input"
                value={abilityFlaw}
                onChange={(e) => setAbilityFlaw(e.target.value)}
                placeholder="Optional"
              />
            </Field>
          </div>

          <div className="card p-6 space-y-4">
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Languages & Senses
            </h2>
            <Field label="Starting Languages" hint="Comma-separated">
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
                placeholder="Equal to Intelligence modifier from this list..."
              />
            </Field>
            <Field label="Senses">
              <input
                className="input"
                value={senses}
                onChange={(e) => setSenses(e.target.value)}
                placeholder="Low-light vision, darkvision"
              />
            </Field>
          </div>

          <div className="card p-6 space-y-4">
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Rules Text
            </h2>
            <Field label="Ancestry Features">
              <textarea
                className="input min-h-[100px] resize-y"
                value={features}
                onChange={(e) => setFeatures(e.target.value)}
                placeholder="Special rules, natural attacks, resistances, or other ancestry features."
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
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Source
            </h2>
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

          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={createHomebrew.isPending}
              className="btn-primary flex items-center gap-2"
            >
              {createHomebrew.isPending ? (
                <>
                  <div className="spinner w-4 h-4" />
                  Saving...
                </>
              ) : (
                <>
                  <Users size={16} />
                  Create Ancestry
                </>
              )}
            </button>
            <Link href="/homebrew?tab=ancestry" className="btn-outline">
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </MainLayout>
  );
}
