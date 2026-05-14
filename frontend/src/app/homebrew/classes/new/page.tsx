"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MainLayout } from "@/components/layout";
import { useCreateHomebrew } from "@/lib/hooks/use-homebrew";
import { HomebrewImageUpload } from "@/components/homebrew/HomebrewImageUpload";
import { ArrowLeft, GraduationCap } from "lucide-react";

type Rarity = "Common" | "Uncommon" | "Rare" | "Unique";

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

export default function NewClassPage() {
  const router = useRouter();
  const createHomebrew = useCreateHomebrew();
  const [formError, setFormError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [rarity, setRarity] = useState<Rarity>("Common");
  const [keyAbility, setKeyAbility] = useState("");
  const [hpPerLevel, setHpPerLevel] = useState("8");
  const [perception, setPerception] = useState("Trained");
  const [savingThrows, setSavingThrows] = useState("");
  const [skills, setSkills] = useState("");
  const [attacks, setAttacks] = useState("");
  const [defenses, setDefenses] = useState("");
  const [classDc, setClassDc] = useState("Trained");
  const [tradition, setTradition] = useState("");
  const [features, setFeatures] = useState("");
  const [description, setDescription] = useState("");
  const [sourceBook, setSourceBook] = useState("Homebrew");
  const [sourcePage, setSourcePage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    if (!name.trim()) {
      setFormError("Class name is required.");
      return;
    }
    if (!description.trim()) {
      setFormError("Class description is required.");
      return;
    }

    const sourceText = [sourceBook, sourcePage ? `p. ${sourcePage}` : ""].filter(Boolean).join(" ");
    const classData = {
      id: toSlug(name),
      name: name.trim(),
      lookup_name: name.trim().toLowerCase(),
      rarity,
      key_ability: listFromComma(keyAbility),
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
        source_text: sourceText || "Homebrew",
      },
      image_url: imageUrl,
    };

    try {
      await createHomebrew.mutateAsync({
        type: "class",
        name: name.trim(),
        data: classData,
      });
      router.push("/homebrew?tab=class");
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to create class.");
    }
  }

  return (
    <MainLayout>
      <div className="max-w-3xl space-y-6">
        <Link
          href="/homebrew?tab=class"
          className="inline-flex items-center gap-2 text-primary hover:text-primary/80 text-sm"
        >
          <ArrowLeft size={14} />
          Back to Homebrew
        </Link>

        <div>
          <h1 className="font-heading text-3xl font-bold mb-1 flex items-center gap-2">
            <GraduationCap className="text-primary" size={28} />
            New Homebrew Class
          </h1>
          <p className="text-muted-foreground text-sm">
            Creates a Pathfinder 2e class for custom character options.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="card p-6 space-y-4">
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Identity
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-6 items-start">
              <Field label="Class Name" required>
                <input
                  className="input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Stormcaller"
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
              <Field label="Key Ability" hint="Comma-separated if multiple">
                <input
                  className="input"
                  value={keyAbility}
                  onChange={(e) => setKeyAbility(e.target.value)}
                  placeholder="Strength, Dexterity"
                />
              </Field>
            </div>
          </div>

          <div className="card p-6 space-y-4">
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Initial Proficiencies
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <Field label="HP Per Level">
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9+-]*"
                  className="input"
                  value={hpPerLevel}
                  onChange={(e) => setHpPerLevel(e.target.value)}
                  min={1}
                />
              </Field>
              <Field label="Perception">
                <select
                  className="input"
                  value={perception}
                  onChange={(e) => setPerception(e.target.value)}
                >
                  {["Untrained", "Trained", "Expert", "Master", "Legendary"].map((value) => (
                    <option key={value}>{value}</option>
                  ))}
                </select>
              </Field>
            </div>
            <Field label="Saving Throws">
              <input
                className="input"
                value={savingThrows}
                onChange={(e) => setSavingThrows(e.target.value)}
                placeholder="Fortitude expert, Reflex trained, Will expert"
              />
            </Field>
            <Field label="Skills">
              <textarea
                className="input min-h-[80px] resize-y"
                value={skills}
                onChange={(e) => setSkills(e.target.value)}
                placeholder="Trained in Arcana, plus a number of additional skills..."
              />
            </Field>
            <Field label="Attacks">
              <input
                className="input"
                value={attacks}
                onChange={(e) => setAttacks(e.target.value)}
                placeholder="Simple weapons trained, martial weapons trained"
              />
            </Field>
            <Field label="Defenses">
              <input
                className="input"
                value={defenses}
                onChange={(e) => setDefenses(e.target.value)}
                placeholder="Unarmored defense trained, light armor trained"
              />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Class DC">
                <select
                  className="input"
                  value={classDc}
                  onChange={(e) => setClassDc(e.target.value)}
                >
                  {["Untrained", "Trained", "Expert", "Master", "Legendary"].map((value) => (
                    <option key={value}>{value}</option>
                  ))}
                </select>
              </Field>
              <Field label="Spellcasting Tradition">
                <input
                  className="input"
                  value={tradition}
                  onChange={(e) => setTradition(e.target.value)}
                  placeholder="Arcane, divine, occult, primal"
                />
              </Field>
            </div>
          </div>

          <div className="card p-6 space-y-4">
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Rules Text
            </h2>
            <Field label="Class Features">
              <textarea
                className="input min-h-[120px] resize-y"
                value={features}
                onChange={(e) => setFeatures(e.target.value)}
                placeholder="List level 1 features, class paths, special rules, or class-defining mechanics."
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
                  <GraduationCap size={16} />
                  Create Class
                </>
              )}
            </button>
            <Link href="/homebrew?tab=class" className="btn-outline">
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </MainLayout>
  );
}
