"use client";

import React, { useState } from "react";
import {
  Plus, Pencil, Trash2, Search, ChevronDown, Loader2, Wand2, AlertTriangle, X,
} from "lucide-react";
import {
  useHomebrewClasses,
  useCreateHomebrewClass,
  useUpdateHomebrewClass,
  useDeleteHomebrewClass,
} from "@/lib/hooks/use-homebrew-content";

// ── Constants ─────────────────────────────────────────────────────────────────

const ABILITIES = ["str", "dex", "con", "int", "wis", "cha"] as const;
const SKILLS = [
  "acrobatics", "arcana", "athletics", "crafting", "deception", "diplomacy",
  "intimidation", "medicine", "nature", "occultism", "performance", "religion",
  "society", "stealth", "survival", "thievery",
] as const;

// ── Types ─────────────────────────────────────────────────────────────────────

type ClassItem = {
  id: string;
  name: string;
  class_hp?: number;
  key_attribute?: string[];
  is_spellcaster?: boolean;
  spellcasting_ability?: string;
  description?: string;
  class_trained_skills: string[];
  class_lore_skills: string[];
  trained_skill_count: number;
};

function cleanLoreSkill(value: string): string {
  const topic = value.trim().replace(/\s+lore$/i, "").replace(/\s+/g, " ");
  return topic ? `${topic} Lore` : "";
}

function loreKey(value: string): string {
  return cleanLoreSkill(value)
    .replace(/\s+lore$/i, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");
}

function toItem(raw: Record<string, unknown>): ClassItem {
  // Extract class_trained_skills from initial_proficiencies (any skill at rank 2)
  const profs = (raw.initial_proficiencies ?? {}) as Record<string, unknown>;
  const class_trained_skills = SKILLS.filter((s) => profs[s] === 2);
  const meta = (raw.class_metadata ?? {}) as Record<string, unknown>;
  const class_lore_skills = Array.isArray(meta.class_lore_skills)
    ? meta.class_lore_skills
        .map((skill) => (typeof skill === "string" ? cleanLoreSkill(skill) : ""))
        .filter(Boolean)
    : Object.entries(profs)
        .filter(([key, rank]) => key.startsWith("lore:") && rank === 2)
        .map(([key]) => cleanLoreSkill(key.slice("lore:".length).replace(/[_-]+/g, " ")))
        .filter(Boolean);

  return {
    id: String(raw.id ?? ""),
    name: String(raw.name ?? ""),
    class_hp: typeof raw.class_hp === "number" ? raw.class_hp : undefined,
    key_attribute: Array.isArray(raw.key_attribute)
      ? (raw.key_attribute as string[])
      : raw.key_attribute
        ? [String(raw.key_attribute)]
        : [],
    is_spellcaster: !!raw.is_spellcaster,
    spellcasting_ability: raw.spellcasting_ability
      ? String(raw.spellcasting_ability)
      : undefined,
    description: raw.description ? String(raw.description) : undefined,
    class_trained_skills,
    class_lore_skills,
    trained_skill_count: typeof meta.trained_skill_count === "number"
      ? meta.trained_skill_count
      : 3,
  };
}

// ── Class Form ────────────────────────────────────────────────────────────────

function ClassForm({
  initialValues,
  onDone,
}: {
  initialValues?: ClassItem;
  onDone: () => void;
}) {
  const isEditing = !!initialValues?.id;
  const create = useCreateHomebrewClass();
  const update = useUpdateHomebrewClass();

  const [name, setName] = useState(initialValues?.name ?? "");
  const [classHp, setClassHp] = useState(initialValues?.class_hp ?? 8);
  const [keyAttrs, setKeyAttrs] = useState<string[]>(
    initialValues?.key_attribute?.length ? initialValues.key_attribute : ["str"]
  );
  const [isSpell, setIsSpell] = useState(initialValues?.is_spellcaster ?? false);
  const [spellAbility, setSpellAbility] = useState(
    initialValues?.spellcasting_ability ?? ""
  );
  const [trainedCount, setTrainedCount] = useState(
    initialValues?.trained_skill_count ?? 3
  );
  const [classSkills, setClassSkills] = useState<string[]>(
    initialValues?.class_trained_skills ?? []
  );
  const [classLoreSkills, setClassLoreSkills] = useState<string[]>(
    initialValues?.class_lore_skills ?? []
  );
  const [loreInput, setLoreInput] = useState("");
  const [description, setDesc] = useState(initialValues?.description ?? "");
  const [formError, setFormError] = useState<string | null>(null);

  const isPending = create.isPending || update.isPending;

  function toggleAttr(a: string) {
    setKeyAttrs((prev) =>
      prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a]
    );
  }
  function toggleSkill(s: string) {
    setClassSkills((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    );
  }
  function addLoreSkill() {
    const skill = cleanLoreSkill(loreInput);
    if (!skill) return;
    const key = loreKey(skill);
    setClassLoreSkills((prev) =>
      prev.some((existing) => loreKey(existing) === key) ? prev : [...prev, skill]
    );
    setLoreInput("");
  }
  function removeLoreSkill(skill: string) {
    const key = loreKey(skill);
    setClassLoreSkills((prev) => prev.filter((existing) => loreKey(existing) !== key));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    if (keyAttrs.length === 0) {
      setFormError("Select at least one key attribute.");
      return;
    }
    const payload = {
      name,
      class_hp: classHp,
      key_attribute: keyAttrs,
      is_spellcaster: isSpell,
      spellcasting_ability: isSpell ? spellAbility || undefined : undefined,
      trained_skill_count: trainedCount,
      class_trained_skills: classSkills,
      class_lore_skills: classLoreSkills,
      description: description || undefined,
    };
    try {
      if (isEditing) {
        await update.mutateAsync({ id: initialValues!.id, ...payload });
      } else {
        await create.mutateAsync(payload);
      }
      onDone();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to save class.");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <label className="block text-sm font-medium mb-1">
            Name <span className="text-destructive">*</span>
          </label>
          <input
            className="input w-full"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Warlord"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">HP per Level</label>
          <input
            className="input w-full"
            type="number"
            min={4}
            max={12}
            step={2}
            value={classHp}
            onChange={(e) => setClassHp(parseInt(e.target.value) || 8)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Free Skill Picks</label>
          <input
            className="input w-full"
            type="number"
            min={1}
            max={10}
            value={trainedCount}
            onChange={(e) => setTrainedCount(parseInt(e.target.value) || 3)}
          />
        </div>
      </div>

      {/* Key Attributes */}
      <div>
        <label className="block text-sm font-medium mb-2">
          Key Attribute(s) <span className="text-destructive">*</span>
        </label>
        <div className="flex gap-2 flex-wrap">
          {ABILITIES.map((a) => (
            <button
              key={a}
              type="button"
              onClick={() => toggleAttr(a)}
              className={`px-3 py-1 rounded-md text-sm font-mono font-bold uppercase transition-colors ${
                keyAttrs.includes(a)
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted hover:bg-muted/70 text-muted-foreground"
              }`}
            >
              {a}
            </button>
          ))}
        </div>
      </div>

      {/* Spellcaster */}
      <div className="flex items-center gap-3">
        <input
          id="is-spellcaster"
          type="checkbox"
          checked={isSpell}
          onChange={(e) => setIsSpell(e.target.checked)}
          className="w-4 h-4 accent-primary"
        />
        <label htmlFor="is-spellcaster" className="text-sm font-medium">
          Spellcaster
        </label>
        {isSpell && (
          <div className="relative ml-2">
            <select
              className="input appearance-none pr-8 py-1 text-sm"
              value={spellAbility}
              onChange={(e) => setSpellAbility(e.target.value)}
            >
              <option value="">Select spellcasting ability…</option>
              {ABILITIES.map((a) => (
                <option key={a} value={a}>{a.toUpperCase()}</option>
              ))}
            </select>
            <ChevronDown
              size={12}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
            />
          </div>
        )}
      </div>

      {/* Class-trained skills */}
      <div>
        <label className="block text-sm font-medium mb-1">
          Class-Granted Trained Skills
        </label>
        <p className="text-xs text-muted-foreground mb-2">
          These skills are pre-trained by the class (locked in the character builder).
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-1">
          {SKILLS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => toggleSkill(s)}
              className={`px-2 py-1 rounded text-xs text-left capitalize transition-colors ${
                classSkills.includes(s)
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted hover:bg-muted/70 text-muted-foreground"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Class-granted Lore skills */}
      <div>
        <label className="block text-sm font-medium mb-1">
          Class-Granted Lore Skills
        </label>
        <p className="text-xs text-muted-foreground mb-2">
          Add specific Lore skills granted by the class, such as Warfare Lore or Dragonmark Lore.
        </p>
        <div className="flex gap-2">
          <input
            className="input flex-1 text-sm"
            value={loreInput}
            onChange={(e) => setLoreInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addLoreSkill();
              }
            }}
            placeholder="e.g. Warfare Lore"
          />
          <button type="button" onClick={addLoreSkill} className="btn-outline px-3">
            <Plus size={14} />
          </button>
        </div>
        {classLoreSkills.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {classLoreSkills.map((skill) => (
              <span
                key={skill}
                className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs"
              >
                {skill}
                <button
                  type="button"
                  onClick={() => removeLoreSkill(skill)}
                  className="text-muted-foreground hover:text-destructive"
                  title={`Remove ${skill}`}
                >
                  <X size={12} />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">
          Description{" "}
          <span className="text-xs text-muted-foreground font-normal">(optional)</span>
        </label>
        <textarea
          className="input w-full min-h-[72px] resize-y text-sm"
          value={description}
          onChange={(e) => setDesc(e.target.value)}
          placeholder="Flavor text, class features…"
        />
      </div>

      {formError && <p className="text-sm text-destructive">{formError}</p>}
      <div className="flex gap-2 justify-end pt-1">
        <button type="button" onClick={onDone} className="btn-outline px-4">
          Cancel
        </button>
        <button
          type="submit"
          disabled={isPending}
          className="btn-primary px-4 flex items-center gap-2"
        >
          {isPending ? (
            <><Loader2 size={14} className="animate-spin" /> Saving…</>
          ) : isEditing ? (
            "Save Changes"
          ) : (
            "Create Class"
          )}
        </button>
      </div>
    </form>
  );
}

// ── Class Card ────────────────────────────────────────────────────────────────

function ClassCard({
  item,
  onEdit,
  onDelete,
  deleting,
}: {
  item: ClassItem;
  onEdit: () => void;
  onDelete: () => void;
  deleting: boolean;
}) {
  return (
    <div className="card p-4 flex flex-col gap-2">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h3 className="font-heading font-bold truncate">{item.name}</h3>
          <div className="flex flex-wrap gap-1.5 mt-1">
            {item.class_hp !== undefined && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-muted/60 text-muted-foreground border border-border">
                {item.class_hp} HP/level
              </span>
            )}
            {item.key_attribute?.map((a) => (
              <span
                key={a}
                className="text-xs px-2 py-0.5 rounded-full bg-primary/15 text-primary border border-primary/30 font-mono uppercase"
              >
                {a}
              </span>
            ))}
            {item.is_spellcaster && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-violet-500/15 text-violet-400 border border-violet-500/30">
                Spellcaster
                {item.spellcasting_ability && ` · ${item.spellcasting_ability.toUpperCase()}`}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={onEdit}
            className="p-1.5 rounded-md text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
            title="Edit class"
          >
            <Pencil size={14} />
          </button>
          <button
            onClick={onDelete}
            disabled={deleting}
            className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-50"
            title="Delete class"
          >
            {deleting ? <div className="spinner w-3.5 h-3.5" /> : <Trash2 size={14} />}
          </button>
        </div>
      </div>

      {item.class_trained_skills.length > 0 && (
        <p className="text-xs text-muted-foreground capitalize">
          Class skills: {item.class_trained_skills.join(", ")}
        </p>
      )}
      {item.class_lore_skills.length > 0 && (
        <p className="text-xs text-muted-foreground">
          Class lore: {item.class_lore_skills.join(", ")}
        </p>
      )}
      {item.description && (
        <p className="text-xs text-muted-foreground line-clamp-2">{item.description}</p>
      )}
    </div>
  );
}

// ── Panel ─────────────────────────────────────────────────────────────────────

export function ClassPanel() {
  const [q, setQ] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { data: rawData, isLoading, error } = useHomebrewClasses();
  const deleteClass = useDeleteHomebrewClass();

  const items = (rawData ?? []).map(toItem);
  const filtered = q
    ? items.filter((c) => c.name.toLowerCase().includes(q.toLowerCase()))
    : items;

  const editingItem = editingId ? items.find((c) => c.id === editingId) : undefined;
  const showForm = isCreating || !!editingId;

  function openCreate() { setIsCreating(true); setEditingId(null); }
  function openEdit(id: string) { setEditingId(id); setIsCreating(false); }
  function closeForm() { setIsCreating(false); setEditingId(null); }

  async function handleDelete(id: string) {
    if (!confirm("Delete this class? This cannot be undone.")) return;
    setDeletingId(id);
    try {
      await deleteClass.mutateAsync(id);
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
          />
          <input
            type="search"
            placeholder="Search classes…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="input pl-9"
          />
        </div>
        <button
          onClick={openCreate}
          className="btn-primary flex items-center gap-2 shrink-0"
        >
          <Plus size={16} />
          Add Class
        </button>
      </div>

      {/* Inline form */}
      {showForm && (
        <div className="card p-5 border-primary/30 bg-primary/5">
          <h3 className="font-heading font-semibold mb-4">
            {editingId ? "Edit Class" : "New Class"}
          </h3>
          <ClassForm
            key={editingId ?? "new"}
            initialValues={editingItem}
            onDone={closeForm}
          />
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-16">
          <div className="spinner" />
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="card p-4 bg-destructive/10 border-destructive flex items-start gap-3">
          <AlertTriangle size={16} className="text-destructive shrink-0 mt-0.5" />
          <p className="text-sm text-destructive">{error.message}</p>
        </div>
      )}

      {/* Empty */}
      {!isLoading && !error && items.length === 0 && (
        <div className="card p-12 text-center">
          <Wand2 size={40} className="mx-auto text-muted-foreground mb-4" />
          <h3 className="font-heading text-xl font-bold mb-1">No homebrew classes yet</h3>
          <p className="text-muted-foreground text-sm mb-6">
            {q
              ? `No results for "${q}".`
              : "Create custom classes that appear in the character builder."}
          </p>
          {!q && (
            <button onClick={openCreate} className="btn-primary inline-flex items-center gap-2">
              <Plus size={16} /> Add your first class
            </button>
          )}
        </div>
      )}

      {/* Count + grid */}
      {!isLoading && !error && items.length > 0 && (
        <>
          <p className="text-xs text-muted-foreground">
            {filtered.length} {filtered.length === 1 ? "class" : "classes"}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((item) => (
              <ClassCard
                key={item.id}
                item={item}
                onEdit={() => openEdit(item.id)}
                onDelete={() => handleDelete(item.id)}
                deleting={deletingId === item.id}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
