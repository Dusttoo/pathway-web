"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MainLayout } from "@/components/layout";
import { useCreateHomebrew } from "@/lib/hooks/use-homebrew";
import { HomebrewImageUpload } from "@/components/homebrew/HomebrewImageUpload";
import { ArrowLeft, BookOpen } from "lucide-react";

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
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function listFromComma(raw: string) {
  return raw.split(",").map((item) => item.trim()).filter(Boolean);
}

export default function NewBackgroundPage() {
  const router = useRouter();
  const createHomebrew = useCreateHomebrew();
  const [formError, setFormError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [rarity, setRarity] = useState<Rarity>("Common");
  const [traits, setTraits] = useState("");
  const [abilityBoosts, setAbilityBoosts] = useState("");
  const [trainedSkill, setTrainedSkill] = useState("");
  const [loreSkill, setLoreSkill] = useState("");
  const [skillFeat, setSkillFeat] = useState("");
  const [description, setDescription] = useState("");
  const [special, setSpecial] = useState("");
  const [sourceBook, setSourceBook] = useState("Homebrew");
  const [sourcePage, setSourcePage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    if (!name.trim()) {
      setFormError("Background name is required.");
      return;
    }
    if (!description.trim()) {
      setFormError("Background description is required.");
      return;
    }

    const sourceText = [sourceBook, sourcePage ? `p. ${sourcePage}` : ""].filter(Boolean).join(" ");
    const backgroundData = {
      id: toSlug(name),
      name: name.trim(),
      lookup_name: name.trim().toLowerCase(),
      rarity,
      traits: listFromComma(traits),
      ability_boosts: listFromComma(abilityBoosts),
      trained_skill: trainedSkill || null,
      lore_skill: loreSkill || null,
      skill_feat: skillFeat || null,
      description: description.trim(),
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
        type: "background",
        name: name.trim(),
        data: backgroundData,
      });
      router.push("/homebrew?tab=background");
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to create background.");
    }
  }

  return (
    <MainLayout>
      <div className="max-w-3xl space-y-6">
        <Link href="/homebrew?tab=background" className="inline-flex items-center gap-2 text-primary hover:text-primary/80 text-sm">
          <ArrowLeft size={14} />
          Back to Homebrew
        </Link>

        <div>
          <h1 className="font-heading text-3xl font-bold mb-1 flex items-center gap-2">
            <BookOpen className="text-primary" size={28} />
            New Homebrew Background
          </h1>
          <p className="text-muted-foreground text-sm">
            Creates a Pathfinder 2e background for custom character options.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="card p-6 space-y-4">
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Identity</h2>
            <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-6 items-start">
              <Field label="Background Name" required>
                <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Lightning Rail Agent" required />
              </Field>
              <HomebrewImageUpload value={imageUrl} onChange={setImageUrl} label="Artwork" recommendedSize="256x256 px" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Rarity">
                <select className="input" value={rarity} onChange={(e) => setRarity(e.target.value as Rarity)}>
                  {(["Common", "Uncommon", "Rare", "Unique"] as const).map((r) => <option key={r}>{r}</option>)}
                </select>
              </Field>
              <Field label="Traits" hint="Comma-separated">
                <input className="input" value={traits} onChange={(e) => setTraits(e.target.value)} />
              </Field>
            </div>
          </div>

          <div className="card p-6 space-y-4">
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Character Options</h2>
            <Field label="Ability Boosts" hint="Comma-separated, e.g. Dexterity, Charisma, Free">
              <input className="input" value={abilityBoosts} onChange={(e) => setAbilityBoosts(e.target.value)} />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Trained Skill">
                <input className="input" value={trainedSkill} onChange={(e) => setTrainedSkill(e.target.value)} placeholder="Diplomacy" />
              </Field>
              <Field label="Lore Skill">
                <input className="input" value={loreSkill} onChange={(e) => setLoreSkill(e.target.value)} placeholder="Dragonmark Lore" />
              </Field>
            </div>
            <Field label="Skill Feat">
              <input className="input" value={skillFeat} onChange={(e) => setSkillFeat(e.target.value)} placeholder="Group Impression" />
            </Field>
          </div>

          <div className="card p-6 space-y-4">
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Rules Text</h2>
            <Field label="Description" required>
              <textarea className="input min-h-[160px] resize-y" value={description} onChange={(e) => setDescription(e.target.value)} required />
            </Field>
            <Field label="Special">
              <textarea className="input min-h-[80px] resize-y" value={special} onChange={(e) => setSpecial(e.target.value)} />
            </Field>
          </div>

          <div className="card p-6 space-y-4">
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Source</h2>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Source Book">
                <input className="input" value={sourceBook} onChange={(e) => setSourceBook(e.target.value)} />
              </Field>
              <Field label="Page">
                <input className="input" value={sourcePage} onChange={(e) => setSourcePage(e.target.value)} />
              </Field>
            </div>
          </div>

          {formError && <p className="text-sm text-destructive font-medium">{formError}</p>}

          <div className="flex items-center gap-3">
            <button type="submit" disabled={createHomebrew.isPending} className="btn-primary flex items-center gap-2">
              {createHomebrew.isPending ? <><div className="spinner w-4 h-4" />Saving...</> : <><BookOpen size={16} />Create Background</>}
            </button>
            <Link href="/homebrew?tab=background" className="btn-outline">Cancel</Link>
          </div>
        </form>
      </div>
    </MainLayout>
  );
}
