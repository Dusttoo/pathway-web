"use client";

import React, { useState } from "react";
import Link from "next/link";
import { MainLayout } from "@/components/layout";
import { useAuth } from "@/lib/providers/auth-provider";
import { ArrowLeft, Plus, Trash2, ChevronDown, ChevronUp, Loader2, X, Wand2 } from "lucide-react";
import {
  useHomebrewAncestries,
  useCreateHomebrewAncestry,
  useDeleteHomebrewAncestry,
  useHomebrewClasses,
  useCreateHomebrewClass,
  useDeleteHomebrewClass,
  useHomebrewBackgrounds,
  useCreateHomebrewBackground,
  useDeleteHomebrewBackground,
  type HomebrewHeritage,
} from "@/lib/hooks/use-homebrew-content";

// ── Constants ─────────────────────────────────────────────────────────────────

const ABILITIES = ["str", "dex", "con", "int", "wis", "cha"] as const;
const SIZES = ["Tiny", "Small", "Medium", "Large", "Huge", "Gargantuan"];
const SKILLS = [
  "acrobatics","arcana","athletics","crafting","deception","diplomacy",
  "intimidation","medicine","nature","occultism","performance","religion",
  "society","stealth","survival","thievery",
];

// ── Ancestry Form ─────────────────────────────────────────────────────────────

function AncestryForm({ onDone }: { onDone: () => void }) {
  const create = useCreateHomebrewAncestry();
  const [name, setName]             = useState("");
  const [hp, setHp]                 = useState(8);
  const [speed, setSpeed]           = useState(25);
  const [size, setSize]             = useState("Medium");
  const [description, setDesc]      = useState("");
  const [heritages, setHeritages]   = useState<HomebrewHeritage[]>([{ name: "" }]);
  const [error, setError]           = useState<string | null>(null);

  function addHeritage() { setHeritages((h) => [...h, { name: "" }]); }
  function removeHeritage(i: number) { setHeritages((h) => h.filter((_, idx) => idx !== i)); }
  function setHeritageName(i: number, v: string) {
    setHeritages((h) => h.map((x, idx) => idx === i ? { ...x, name: v } : x));
  }
  function setHeritageDesc(i: number, v: string) {
    setHeritages((h) => h.map((x, idx) => idx === i ? { ...x, description: v } : x));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await create.mutateAsync({
        name, ancestry_hp: hp, speed, size, description: description || undefined,
        heritages: heritages.filter((h) => h.name.trim()),
      });
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create ancestry.");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <label className="block text-sm font-medium mb-1">Name <span className="text-destructive">*</span></label>
          <input className="input w-full" required value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Kitsune" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">HP</label>
          <input className="input w-full" type="number" min={4} max={16} value={hp} onChange={(e) => setHp(parseInt(e.target.value) || 8)} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Speed (ft)</label>
          <input className="input w-full" type="number" min={10} max={60} step={5} value={speed} onChange={(e) => setSpeed(parseInt(e.target.value) || 25)} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Size</label>
          <div className="relative">
            <select className="input w-full appearance-none pr-8" value={size} onChange={(e) => setSize(e.target.value)}>
              {SIZES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          </div>
        </div>
        <div className="col-span-2">
          <label className="block text-sm font-medium mb-1">Description <span className="text-xs text-muted-foreground font-normal">(optional)</span></label>
          <textarea className="input w-full min-h-[80px] resize-y text-sm" value={description} onChange={(e) => setDesc(e.target.value)} placeholder="Flavor text, lore, special abilities…" />
        </div>
      </div>

      {/* Heritages */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium">Heritages</label>
          <button type="button" onClick={addHeritage} className="btn-outline py-1 px-2 text-xs flex items-center gap-1">
            <Plus size={12} /> Add
          </button>
        </div>
        <div className="space-y-2">
          {heritages.map((h, i) => (
            <div key={i} className="flex gap-2 items-start">
              <div className="flex-1 space-y-1">
                <input className="input w-full text-sm" placeholder={`Heritage ${i + 1} name`} value={h.name} onChange={(e) => setHeritageName(i, e.target.value)} />
                <input className="input w-full text-xs" placeholder="Description (optional)" value={h.description ?? ""} onChange={(e) => setHeritageDesc(i, e.target.value)} />
              </div>
              {heritages.length > 1 && (
                <button type="button" onClick={() => removeHeritage(i)} className="mt-1 text-muted-foreground hover:text-destructive">
                  <X size={14} />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="flex gap-2 justify-end">
        <button type="button" onClick={onDone} className="btn-outline px-4">Cancel</button>
        <button type="submit" disabled={create.isPending} className="btn-primary px-4 flex items-center gap-2">
          {create.isPending ? <><Loader2 size={14} className="animate-spin" /> Saving…</> : "Create Ancestry"}
        </button>
      </div>
    </form>
  );
}

// ── Class Form ────────────────────────────────────────────────────────────────

function ClassForm({ onDone }: { onDone: () => void }) {
  const create = useCreateHomebrewClass();
  const [name, setName]               = useState("");
  const [classHp, setClassHp]         = useState(8);
  const [keyAttrs, setKeyAttrs]       = useState<string[]>(["str"]);
  const [isSpell, setIsSpell]         = useState(false);
  const [spellAbility, setSpellAbil]  = useState("");
  const [trainedCount, setTrainedCount] = useState(3);
  const [classSkills, setClassSkills] = useState<string[]>([]);
  const [description, setDesc]        = useState("");
  const [error, setError]             = useState<string | null>(null);

  function toggleAttr(a: string) {
    setKeyAttrs((prev) => prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a]);
  }
  function toggleSkill(s: string) {
    setClassSkills((prev) => prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (keyAttrs.length === 0) { setError("Select at least one key attribute."); return; }
    try {
      await create.mutateAsync({
        name, class_hp: classHp, key_attribute: keyAttrs,
        is_spellcaster: isSpell, spellcasting_ability: isSpell ? spellAbility : undefined,
        trained_skill_count: trainedCount, class_trained_skills: classSkills,
        description: description || undefined,
      });
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create class.");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <label className="block text-sm font-medium mb-1">Name <span className="text-destructive">*</span></label>
          <input className="input w-full" required value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Warlord" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">HP per Level</label>
          <input className="input w-full" type="number" min={4} max={12} step={2} value={classHp} onChange={(e) => setClassHp(parseInt(e.target.value) || 8)} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Free Skill Picks</label>
          <input className="input w-full" type="number" min={1} max={10} value={trainedCount} onChange={(e) => setTrainedCount(parseInt(e.target.value) || 3)} />
        </div>
      </div>

      {/* Key Attributes */}
      <div>
        <label className="block text-sm font-medium mb-2">Key Attribute(s) <span className="text-destructive">*</span></label>
        <div className="flex gap-2 flex-wrap">
          {ABILITIES.map((a) => (
            <button key={a} type="button" onClick={() => toggleAttr(a)}
              className={`px-3 py-1 rounded-md text-sm font-mono font-bold uppercase transition-colors ${keyAttrs.includes(a) ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/70"}`}>
              {a}
            </button>
          ))}
        </div>
      </div>

      {/* Spellcaster */}
      <div className="flex items-center gap-3">
        <input id="is-spellcaster" type="checkbox" checked={isSpell} onChange={(e) => setIsSpell(e.target.checked)} className="w-4 h-4 accent-primary" />
        <label htmlFor="is-spellcaster" className="text-sm font-medium">Spellcaster</label>
        {isSpell && (
          <div className="relative ml-4">
            <select className="input appearance-none pr-8 py-1 text-sm" value={spellAbility} onChange={(e) => setSpellAbil(e.target.value)}>
              <option value="">Select ability…</option>
              {ABILITIES.map((a) => <option key={a} value={a}>{a.toUpperCase()}</option>)}
            </select>
            <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          </div>
        )}
      </div>

      {/* Class-trained skills */}
      <div>
        <label className="block text-sm font-medium mb-2">Class-Granted Trained Skills</label>
        <p className="text-xs text-muted-foreground mb-2">These are pre-trained by the class (shown as locked in the builder).</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-1">
          {SKILLS.map((s) => (
            <button key={s} type="button" onClick={() => toggleSkill(s)}
              className={`px-2 py-1 rounded text-xs text-left capitalize transition-colors ${classSkills.includes(s) ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/70"}`}>
              {s}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Description <span className="text-xs text-muted-foreground font-normal">(optional)</span></label>
        <textarea className="input w-full min-h-[80px] resize-y text-sm" value={description} onChange={(e) => setDesc(e.target.value)} placeholder="Flavor text, class features…" />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="flex gap-2 justify-end">
        <button type="button" onClick={onDone} className="btn-outline px-4">Cancel</button>
        <button type="submit" disabled={create.isPending} className="btn-primary px-4 flex items-center gap-2">
          {create.isPending ? <><Loader2 size={14} className="animate-spin" /> Saving…</> : "Create Class"}
        </button>
      </div>
    </form>
  );
}

// ── Background Form ───────────────────────────────────────────────────────────

function BackgroundForm({ onDone }: { onDone: () => void }) {
  const create = useCreateHomebrewBackground();
  const [name, setName]         = useState("");
  const [description, setDesc]  = useState("");
  const [trainedSkill, setTSkill] = useState("");
  const [loreSkill, setLSkill]  = useState("");
  const [error, setError]       = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await create.mutateAsync({
        name, description: description || undefined,
        trained_skill: trainedSkill || undefined,
        lore_skill: loreSkill || undefined,
      });
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create background.");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Name <span className="text-destructive">*</span></label>
        <input className="input w-full" required value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Wandering Merchant" />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Trained Skill <span className="text-xs text-muted-foreground font-normal">(optional)</span></label>
        <div className="relative">
          <select className="input w-full appearance-none pr-8" value={trainedSkill} onChange={(e) => setTSkill(e.target.value)}>
            <option value="">None selected</option>
            {SKILLS.map((s) => <option key={s} value={s} className="capitalize">{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
          </select>
          <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Lore Skill Topic <span className="text-xs text-muted-foreground font-normal">(optional)</span></label>
        <input className="input w-full" value={loreSkill} onChange={(e) => setLSkill(e.target.value)} placeholder="e.g. Trade, Sailing, Alchemy…" />
        <p className="text-xs text-muted-foreground mt-1">Enter just the topic — not "Lore".</p>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Description <span className="text-xs text-muted-foreground font-normal">(optional)</span></label>
        <textarea className="input w-full min-h-[80px] resize-y text-sm" value={description} onChange={(e) => setDesc(e.target.value)} placeholder="Flavor text, origin story…" />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="flex gap-2 justify-end">
        <button type="button" onClick={onDone} className="btn-outline px-4">Cancel</button>
        <button type="submit" disabled={create.isPending} className="btn-primary px-4 flex items-center gap-2">
          {create.isPending ? <><Loader2 size={14} className="animate-spin" /> Saving…</> : "Create Background"}
        </button>
      </div>
    </form>
  );
}

// ── Section Card ──────────────────────────────────────────────────────────────

function SectionCard({
  title, description, items, isLoading,
  onDelete, deleteLabel,
  form, formOpen, onToggleForm,
}: {
  title: string;
  description: string;
  items: Record<string, unknown>[];
  isLoading: boolean;
  onDelete: (id: string) => void;
  deleteLabel?: string;
  form: React.ReactNode;
  formOpen: boolean;
  onToggleForm: () => void;
}) {
  return (
    <div className="card p-6">
      <div className="flex items-start justify-between mb-2">
        <div>
          <h2 className="text-lg font-semibold">{title}</h2>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        <button type="button" onClick={onToggleForm}
          className="btn-outline py-1.5 px-3 flex items-center gap-1.5 text-sm shrink-0">
          {formOpen ? <><ChevronUp size={14} /> Cancel</> : <><Plus size={14} /> New</>}
        </button>
      </div>

      {formOpen && (
        <div className="border border-border rounded-lg p-4 mb-4 mt-4 bg-muted/20">
          {form}
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center gap-2 text-muted-foreground text-sm py-4">
          <Loader2 size={14} className="animate-spin" /> Loading…
        </div>
      ) : items.length === 0 ? (
        <p className="text-sm text-muted-foreground italic py-4">No homebrew {title.toLowerCase()} yet.</p>
      ) : (
        <ul className="divide-y divide-border">
          {items.map((item) => (
            <li key={String(item.id)} className="flex items-center justify-between py-3">
              <div>
                <p className="font-medium text-sm">{String(item.name)}</p>
                {!!item.description && (
                  <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{String(item.description)}</p>
                )}
              </div>
              <button type="button" onClick={() => onDelete(String(item.id))}
                className="text-muted-foreground hover:text-destructive transition-colors ml-4 shrink-0"
                title={deleteLabel ?? `Delete ${title.slice(0, -1)}`}>
                <Trash2 size={14} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

type FormSection = "ancestry" | "class" | "background" | null;

export default function HomebrewCharacterContentPage() {
  const { user } = useAuth();
  const [openForm, setOpenForm] = useState<FormSection>(null);

  const { data: ancestries = [], isLoading: loadingA } = useHomebrewAncestries();
  const { data: classes    = [], isLoading: loadingC } = useHomebrewClasses();
  const { data: backgrounds = [], isLoading: loadingB } = useHomebrewBackgrounds();

  const deleteAncestry   = useDeleteHomebrewAncestry();
  const deleteClass      = useDeleteHomebrewClass();
  const deleteBackground = useDeleteHomebrewBackground();

  if (!user) {
    return (
      <MainLayout>
        <div className="card p-8 text-center">
          <p className="text-muted-foreground">Please log in to manage homebrew content.</p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="mb-6">
        <Link href="/homebrew" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft size={16} /> Back to Homebrew
        </Link>
        <div className="flex items-center gap-3">
          <Wand2 size={28} className="text-primary" />
          <div>
            <h1 className="font-heading text-3xl font-bold">Character Content</h1>
            <p className="text-muted-foreground mt-0.5">
              Create custom ancestries, classes, and backgrounds that appear in the character builder.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-6 max-w-2xl">
        <SectionCard
          title="Ancestries"
          description="Custom ancestries with heritages. Appear in the character builder alongside official options."
          items={ancestries}
          isLoading={loadingA}
          onDelete={(id) => deleteAncestry.mutate(id)}
          formOpen={openForm === "ancestry"}
          onToggleForm={() => setOpenForm((f) => f === "ancestry" ? null : "ancestry")}
          form={<AncestryForm onDone={() => setOpenForm(null)} />}
        />

        <SectionCard
          title="Classes"
          description="Custom classes with HP, key attributes, and skill training. Appear in the character builder."
          items={classes}
          isLoading={loadingC}
          onDelete={(id) => deleteClass.mutate(id)}
          formOpen={openForm === "class"}
          onToggleForm={() => setOpenForm((f) => f === "class" ? null : "class")}
          form={<ClassForm onDone={() => setOpenForm(null)} />}
        />

        <SectionCard
          title="Backgrounds"
          description="Custom backgrounds with skill training and lore skills. Appear in the character builder."
          items={backgrounds}
          isLoading={loadingB}
          onDelete={(id) => deleteBackground.mutate(id)}
          formOpen={openForm === "background"}
          onToggleForm={() => setOpenForm((f) => f === "background" ? null : "background")}
          form={<BackgroundForm onDone={() => setOpenForm(null)} />}
        />
      </div>
    </MainLayout>
  );
}
