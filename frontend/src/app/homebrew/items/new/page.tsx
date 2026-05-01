"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MainLayout } from "@/components/layout";
import { useCreateHomebrew } from "@/lib/hooks/use-homebrew";
import { HomebrewImageUpload } from "@/components/homebrew/HomebrewImageUpload";
import { ArrowLeft, Package } from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

type Rarity = "Common" | "Uncommon" | "Rare" | "Unique";

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

// ── Helpers ───────────────────────────────────────────────────────────────────

function toSlug(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function parsePriceToCP(priceRaw: string): number | null {
  const m = priceRaw.trim().match(/^(\d+(?:\.\d+)?)\s*(cp|sp|gp|pp)$/i);
  if (!m) return null;
  const value = parseFloat(m[1]);
  const multipliers: Record<string, number> = {
    cp: 1,
    sp: 10,
    gp: 100,
    pp: 1000,
  };
  return Math.round(value * (multipliers[m[2].toLowerCase()] ?? 1));
}

function normalizeBulk(raw: string): string | null {
  if (!raw || raw === "—") return "negligible";
  if (raw === "L") return "light";
  const n = parseFloat(raw);
  return isNaN(n) ? null : String(n);
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

// ── Page ──────────────────────────────────────────────────────────────────────

export default function NewItemPage() {
  const router = useRouter();
  const createHomebrew = useCreateHomebrew();
  const [formError, setFormError] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [category, setCategory] = useState<string>(ITEM_CATEGORIES[0]);
  const [subcategory, setSubcategory] = useState("");
  const [level, setLevel] = useState("0");
  const [rarity, setRarity] = useState<Rarity>("Common");
  const [traits, setTraits] = useState("");
  const [price, setPrice] = useState("");
  const [bulk, setBulk] = useState<string>("L");
  const [usage, setUsage] = useState("");
  const [sourceBook, setSourceBook] = useState("Homebrew");
  const [sourcePage, setSourcePage] = useState("");
  const [description, setDescription] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    if (!name.trim()) {
      setFormError("Item name is required.");
      return;
    }

    const id = toSlug(name);
    const price_cp = price ? parsePriceToCP(price) : null;
    const traitsList = traits
      ? traits.split(",").map((t) => t.trim()).filter(Boolean)
      : [];

    const itemData = {
      id,
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
      category: category !== "Other" ? category : (subcategory || null),
      subcategory: subcategory || null,
      level: parseInt(level) || 0,
      price_raw: price || null,
      price_cp,
      bulk_raw: bulk === "—" ? null : bulk,
      bulk_normalized: normalizeBulk(bulk),
      usage: usage || null,
      campaign: null,
      notes: description || null,
      image_url: imageUrl,
    };

    try {
      await createHomebrew.mutateAsync({
        type: "item",
        name: name.trim(),
        data: itemData,
      });
      router.push("/homebrew?tab=item");
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to create item.");
    }
  }

  return (
    <MainLayout>
      <div className="max-w-3xl space-y-6">
        {/* Back */}
        <Link
          href="/homebrew?tab=item"
          className="inline-flex items-center gap-2 text-primary hover:text-primary/80 text-sm"
        >
          <ArrowLeft size={14} />
          Back to Homebrew
        </Link>

        {/* Header */}
        <div>
          <h1 className="font-heading text-3xl font-bold mb-1 flex items-center gap-2">
            <Package className="text-primary" size={28} />
            New Homebrew Item
          </h1>
          <p className="text-muted-foreground text-sm">
            Creates an item the Pathway bot can look up in any Discord server.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Identity */}
          <div className="card p-6 space-y-4">
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Identity
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-6 items-start">
              <Field label="Item Name" required>
                <input
                  type="text"
                  className="input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Ember Flask"
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
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Subcategory" hint="Optional, e.g. Bomb, Potion">
                <input
                  type="text"
                  className="input"
                  value={subcategory}
                  onChange={(e) => setSubcategory(e.target.value)}
                  placeholder="Bomb"
                />
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Item Level">
                <select
                  className="input"
                  value={level}
                  onChange={(e) => setLevel(e.target.value)}
                >
                  {Array.from({ length: 26 }, (_, i) => String(i)).map((l) => (
                    <option key={l} value={l}>
                      {l}
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
                  {(["Common", "Uncommon", "Rare", "Unique"] as const).map(
                    (r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    )
                  )}
                </select>
              </Field>
            </div>

            <Field
              label="Traits"
              hint="Comma-separated, e.g. alchemical, bomb, consumable, fire, splash"
            >
              <input
                type="text"
                className="input"
                value={traits}
                onChange={(e) => setTraits(e.target.value)}
                placeholder="alchemical, bomb, consumable, fire"
              />
            </Field>
          </div>

          {/* Price & physical properties */}
          <div className="card p-6 space-y-4">
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Physical Properties
            </h2>

            <div className="grid grid-cols-3 gap-4">
              <Field
                label="Price"
                hint="e.g. 3 gp, 500 gp, 10 cp"
              >
                <input
                  type="text"
                  className="input"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="3 gp"
                />
              </Field>
              <Field label="Bulk">
                <select
                  className="input"
                  value={bulk}
                  onChange={(e) => setBulk(e.target.value)}
                >
                  {BULK_OPTIONS.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
              </Field>
              <Field
                label="Usage"
                hint="e.g. held in 2 hands, worn"
              >
                <input
                  type="text"
                  className="input"
                  value={usage}
                  onChange={(e) => setUsage(e.target.value)}
                  placeholder="held in 1 hand"
                />
              </Field>
            </div>
          </div>

          {/* Source */}
          <div className="card p-6 space-y-4">
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Source
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Source Book">
                <input
                  type="text"
                  className="input"
                  value={sourceBook}
                  onChange={(e) => setSourceBook(e.target.value)}
                  placeholder="Homebrew"
                />
              </Field>
              <Field label="Page">
                <input
                  type="text"
                  className="input"
                  value={sourcePage}
                  onChange={(e) => setSourcePage(e.target.value)}
                  placeholder="42"
                />
              </Field>
            </div>
          </div>

          {/* Description */}
          <div className="card p-6 space-y-4">
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Description
            </h2>
            <Field
              label="Item Description / Notes"
              hint="Rules text, flavour, or activation details."
            >
              <textarea
                className="input min-h-[140px] resize-y"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="A flask of magically superheated oil…"
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
                  <Package size={16} />
                  Create Item
                </>
              )}
            </button>
            <Link href="/homebrew?tab=item" className="btn-outline">
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </MainLayout>
  );
}
