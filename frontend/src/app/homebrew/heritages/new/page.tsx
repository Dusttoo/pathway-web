"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MainLayout } from "@/components/layout";
import { useCreateHomebrew } from "@/lib/hooks/use-homebrew";
import { HomebrewImageUpload } from "@/components/homebrew/HomebrewImageUpload";
import { ArrowLeft, Gem } from "lucide-react";

type Rarity = "Common" | "Uncommon" | "Rare" | "Unique";

const HERITAGE_TYPES = [
  "Ancestry Heritage",
  "Versatile Heritage",
  "Lineage",
  "Special Heritage",
  "Other",
] as const;

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
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function listFromComma(raw: string) {
  return raw.split(",").map((item) => item.trim()).filter(Boolean);
}

export default function NewHeritagePage() {
  const router = useRouter();
  const createHomebrew = useCreateHomebrew();
  const [formError, setFormError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [heritageType, setHeritageType] = useState<string>("Ancestry Heritage");
  const [customHeritageType, setCustomHeritageType] = useState("");
  const [ancestry, setAncestry] = useState("");
  const [level, setLevel] = useState("1");
  const [rarity, setRarity] = useState<Rarity>("Common");
  const [traits, setTraits] = useState("");
  const [prerequisites, setPrerequisites] = useState("");
  const [benefit, setBenefit] = useState("");
  const [special, setSpecial] = useState("");
  const [sourceBook, setSourceBook] = useState("Homebrew");
  const [sourcePage, setSourcePage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    if (!name.trim()) {
      setFormError("Heritage name is required.");
      return;
    }
    if (!benefit.trim()) {
      setFormError("Heritage benefit is required.");
      return;
    }

    const resolvedHeritageType =
      heritageType === "Other" ? customHeritageType.trim() || "Other" : heritageType;
    const sourceText = [sourceBook, sourcePage ? `p. ${sourcePage}` : ""].filter(Boolean).join(" ");
    const heritageData = {
      id: toSlug(name),
      name: name.trim(),
      lookup_name: name.trim().toLowerCase(),
      heritage_type: resolvedHeritageType,
      ancestry: ancestry || null,
      level: parseInt(level) || 1,
      rarity,
      traits: listFromComma(traits),
      prerequisites: prerequisites || null,
      description: benefit.trim(),
      special: special || null,
      source: {
        book: sourceBook || "Homebrew",
        page: sourcePage || null,
        source_text: sourceText || "Homebrew",
      },
      image_url: imageUrl,
    };

    try {
      await createHomebrew.mutateAsync({
        type: "heritage",
        name: name.trim(),
        data: heritageData,
      });
      router.push("/homebrew?tab=heritage");
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to create heritage.");
    }
  }

  return (
    <MainLayout>
      <div className="max-w-3xl space-y-6">
        <Link
          href="/homebrew?tab=heritage"
          className="inline-flex items-center gap-2 text-primary hover:text-primary/80 text-sm"
        >
          <ArrowLeft size={14} />
          Back to Homebrew
        </Link>

        <div>
          <h1 className="font-heading text-3xl font-bold mb-1 flex items-center gap-2">
            <Gem className="text-primary" size={28} />
            New Homebrew Heritage
          </h1>
          <p className="text-muted-foreground text-sm">
            Creates a Pathfinder 2e heritage the Pathway bot can look up in any Discord server.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="card p-6 space-y-4">
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Identity
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-6 items-start">
              <Field label="Heritage Name" required>
                <input
                  type="text"
                  className="input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Emberborn Elf"
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
                <select className="input" value={heritageType} onChange={(e) => setHeritageType(e.target.value)}>
                  {HERITAGE_TYPES.map((type) => (
                    <option key={type}>{type}</option>
                  ))}
                </select>
              </Field>
              <Field label="Ancestry" hint="Optional for versatile heritages.">
                <input
                  type="text"
                  className="input"
                  value={ancestry}
                  onChange={(e) => setAncestry(e.target.value)}
                  placeholder="Elf, Dwarf, Human"
                />
              </Field>
            </div>

            {heritageType === "Other" && (
              <Field label="Custom Heritage Type">
                <input
                  type="text"
                  className="input"
                  value={customHeritageType}
                  onChange={(e) => setCustomHeritageType(e.target.value)}
                  placeholder="e.g. Campaign Heritage"
                />
              </Field>
            )}

            <div className="grid grid-cols-2 gap-4">
              <Field label="Level">
                <select className="input" value={level} onChange={(e) => setLevel(e.target.value)}>
                  {Array.from({ length: 21 }, (_, i) => String(i)).map((value) => (
                    <option key={value}>{value}</option>
                  ))}
                </select>
              </Field>
              <Field label="Rarity">
                <select className="input" value={rarity} onChange={(e) => setRarity(e.target.value as Rarity)}>
                  {(["Common", "Uncommon", "Rare", "Unique"] as const).map((r) => (
                    <option key={r}>{r}</option>
                  ))}
                </select>
              </Field>
            </div>

            <Field label="Traits" hint="Comma-separated, e.g. elf, fire, versatile">
              <input
                type="text"
                className="input"
                value={traits}
                onChange={(e) => setTraits(e.target.value)}
                placeholder="elf, fire"
              />
            </Field>
          </div>

          <div className="card p-6 space-y-4">
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Requirements
            </h2>
            <Field label="Prerequisites">
              <input
                type="text"
                className="input"
                value={prerequisites}
                onChange={(e) => setPrerequisites(e.target.value)}
                placeholder="elf ancestry, element-touched lineage"
              />
            </Field>
          </div>

          <div className="card p-6 space-y-4">
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Rules Text
            </h2>
            <Field label="Heritage Benefit" required>
              <textarea
                className="input min-h-[160px] resize-y"
                value={benefit}
                onChange={(e) => setBenefit(e.target.value)}
                placeholder="Describe the benefits this heritage grants."
                required
              />
            </Field>
            <Field label="Special">
              <textarea
                className="input min-h-[80px] resize-y"
                value={special}
                onChange={(e) => setSpecial(e.target.value)}
                placeholder="Any special rules or restrictions."
              />
            </Field>
          </div>

          <div className="card p-6 space-y-4">
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Source
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Source Book">
                <input className="input" value={sourceBook} onChange={(e) => setSourceBook(e.target.value)} placeholder="Homebrew" />
              </Field>
              <Field label="Page">
                <input className="input" value={sourcePage} onChange={(e) => setSourcePage(e.target.value)} placeholder="12" />
              </Field>
            </div>
          </div>

          {formError && <p className="text-sm text-destructive font-medium">{formError}</p>}

          <div className="flex items-center gap-3">
            <button type="submit" disabled={createHomebrew.isPending} className="btn-primary flex items-center gap-2">
              {createHomebrew.isPending ? (
                <>
                  <div className="spinner w-4 h-4" />
                  Saving...
                </>
              ) : (
                <>
                  <Gem size={16} />
                  Create Heritage
                </>
              )}
            </button>
            <Link href="/homebrew?tab=heritage" className="btn-outline">
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </MainLayout>
  );
}
