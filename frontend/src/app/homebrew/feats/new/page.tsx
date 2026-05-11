"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MainLayout } from "@/components/layout";
import { useCreateHomebrew } from "@/lib/hooks/use-homebrew";
import { HomebrewImageUpload } from "@/components/homebrew/HomebrewImageUpload";
import { ArrowLeft, BadgeCheck } from "lucide-react";

type Rarity = "Common" | "Uncommon" | "Rare" | "Unique";

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

const ACTION_COSTS = [
  "Passive",
  "Free Action",
  "Reaction",
  "1 Action",
  "2 Actions",
  "3 Actions",
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

export default function NewFeatPage() {
  const router = useRouter();
  const createHomebrew = useCreateHomebrew();
  const [formError, setFormError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [featType, setFeatType] = useState<string>("General Feat");
  const [customFeatType, setCustomFeatType] = useState("");
  const [level, setLevel] = useState("1");
  const [rarity, setRarity] = useState<Rarity>("Common");
  const [traits, setTraits] = useState("");
  const [prerequisites, setPrerequisites] = useState("");
  const [frequency, setFrequency] = useState("");
  const [trigger, setTrigger] = useState("");
  const [requirements, setRequirements] = useState("");
  const [actionCost, setActionCost] = useState("Passive");
  const [benefit, setBenefit] = useState("");
  const [special, setSpecial] = useState("");
  const [sourceBook, setSourceBook] = useState("Homebrew");
  const [sourcePage, setSourcePage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    if (!name.trim()) {
      setFormError("Feat name is required.");
      return;
    }
    if (!benefit.trim()) {
      setFormError("Feat benefit is required.");
      return;
    }

    const resolvedFeatType = featType === "Other" ? customFeatType.trim() || "Other" : featType;
    const sourceText = [sourceBook, sourcePage ? `p. ${sourcePage}` : ""].filter(Boolean).join(" ");
    const featData = {
      id: toSlug(name),
      name: name.trim(),
      lookup_name: name.trim().toLowerCase(),
      feat_type: resolvedFeatType,
      level: parseInt(level) || 1,
      rarity,
      traits: listFromComma(traits),
      prerequisites: prerequisites || null,
      frequency: frequency || null,
      trigger: trigger || null,
      requirements: requirements || null,
      action_cost: actionCost === "Passive" ? null : actionCost,
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
        type: "feat",
        name: name.trim(),
        data: featData,
      });
      router.push("/homebrew?tab=feat");
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to create feat.");
    }
  }

  return (
    <MainLayout>
      <div className="max-w-3xl space-y-6">
        <Link
          href="/homebrew?tab=feat"
          className="inline-flex items-center gap-2 text-primary hover:text-primary/80 text-sm"
        >
          <ArrowLeft size={14} />
          Back to Homebrew
        </Link>

        <div>
          <h1 className="font-heading text-3xl font-bold mb-1 flex items-center gap-2">
            <BadgeCheck className="text-primary" size={28} />
            New Homebrew Feat
          </h1>
          <p className="text-muted-foreground text-sm">
            Creates a Pathfinder 2e feat the Pathway bot can look up in any Discord server.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="card p-6 space-y-4">
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Identity
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-6 items-start">
              <Field label="Feat Name" required>
                <input
                  type="text"
                  className="input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Ember Step"
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
                <select className="input" value={featType} onChange={(e) => setFeatType(e.target.value)}>
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

            {featType === "Other" && (
              <Field label="Custom Feat Type">
                <input
                  type="text"
                  className="input"
                  value={customFeatType}
                  onChange={(e) => setCustomFeatType(e.target.value)}
                  placeholder="e.g. Deviant Feat"
                />
              </Field>
            )}

            <div className="grid grid-cols-2 gap-4">
              <Field label="Rarity">
                <select className="input" value={rarity} onChange={(e) => setRarity(e.target.value as Rarity)}>
                  {(["Common", "Uncommon", "Rare", "Unique"] as const).map((r) => (
                    <option key={r}>{r}</option>
                  ))}
                </select>
              </Field>
              <Field label="Action Cost">
                <select className="input" value={actionCost} onChange={(e) => setActionCost(e.target.value)}>
                  {ACTION_COSTS.map((cost) => (
                    <option key={cost}>{cost}</option>
                  ))}
                </select>
              </Field>
            </div>

            <Field label="Traits" hint="Comma-separated, e.g. general, skill, fire, fortune">
              <input
                type="text"
                className="input"
                value={traits}
                onChange={(e) => setTraits(e.target.value)}
                placeholder="general, skill"
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
                placeholder="trained in Arcana, elf ancestry, level 4"
              />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Frequency">
                <input className="input" value={frequency} onChange={(e) => setFrequency(e.target.value)} placeholder="once per hour" />
              </Field>
              <Field label="Trigger">
                <input className="input" value={trigger} onChange={(e) => setTrigger(e.target.value)} placeholder="You take fire damage" />
              </Field>
            </div>
            <Field label="Requirements">
              <input className="input" value={requirements} onChange={(e) => setRequirements(e.target.value)} placeholder="You are wielding a shield" />
            </Field>
          </div>

          <div className="card p-6 space-y-4">
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Rules Text
            </h2>
            <Field label="Benefit" required>
              <textarea
                className="input min-h-[160px] resize-y"
                value={benefit}
                onChange={(e) => setBenefit(e.target.value)}
                placeholder="Describe what this feat does."
                required
              />
            </Field>
            <Field label="Special">
              <textarea
                className="input min-h-[80px] resize-y"
                value={special}
                onChange={(e) => setSpecial(e.target.value)}
                placeholder="Any special rules, repeatability, or restrictions."
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
                  <BadgeCheck size={16} />
                  Create Feat
                </>
              )}
            </button>
            <Link href="/homebrew?tab=feat" className="btn-outline">
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </MainLayout>
  );
}
