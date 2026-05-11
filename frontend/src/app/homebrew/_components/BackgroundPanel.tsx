"use client";

import React, { useState } from "react";
import {
  Plus, Pencil, Trash2, Search, ChevronDown, Loader2, Wand2, AlertTriangle,
} from "lucide-react";
import {
  useHomebrewBackgrounds,
  useCreateHomebrewBackground,
  useUpdateHomebrewBackground,
  useDeleteHomebrewBackground,
} from "@/lib/hooks/use-homebrew-content";

// ── Constants ─────────────────────────────────────────────────────────────────

const SKILLS = [
  "acrobatics", "arcana", "athletics", "crafting", "deception", "diplomacy",
  "intimidation", "medicine", "nature", "occultism", "performance", "religion",
  "society", "stealth", "survival", "thievery",
] as const;

// ── Types ─────────────────────────────────────────────────────────────────────

type BackgroundItem = {
  id: string;
  name: string;
  description?: string;
  trained_skill?: string;
  lore_skill?: string;
};

function toItem(raw: Record<string, unknown>): BackgroundItem {
  const sp = raw.skill_proficiencies;
  let trained_skill: string | undefined;
  let lore_skill: string | undefined;

  if (Array.isArray(sp)) {
    // Official seeded format: string[] e.g. ["Religion", "Scribing Lore"]
    const profs = sp as string[];
    const trainedEntry = profs.find((s) => !s.toLowerCase().includes("lore"));
    trained_skill = trainedEntry?.toLowerCase();
    const loreEntry = profs.find((s) => s.toLowerCase().includes("lore"));
    lore_skill = loreEntry?.replace(/ lore$/i, "");
  } else if (sp && typeof sp === "object") {
    // Homebrew format: { [skillKey]: 2 }
    const skillProfs = sp as Record<string, unknown>;
    trained_skill = Object.keys(skillProfs).find((k) => skillProfs[k] === 2);
    // Also check lore_skills column for homebrew entries
    const loreSkills = Array.isArray(raw.lore_skills) ? raw.lore_skills as string[] : [];
    lore_skill = loreSkills[0];
  }

  // lore_skills column fallback (official data may eventually use it)
  if (!lore_skill) {
    const loreSkills = Array.isArray(raw.lore_skills) ? raw.lore_skills as string[] : [];
    lore_skill = loreSkills[0];
  }

  return {
    id: String(raw.id ?? ""),
    name: String(raw.name ?? ""),
    description: raw.description ? String(raw.description) : undefined,
    trained_skill,
    lore_skill,
  };
}

// ── Background Form ───────────────────────────────────────────────────────────

function BackgroundForm({
  initialValues,
  onDone,
}: {
  initialValues?: BackgroundItem;
  onDone: () => void;
}) {
  const isEditing = !!initialValues?.id;
  const create = useCreateHomebrewBackground();
  const update = useUpdateHomebrewBackground();

  const [name, setName] = useState(initialValues?.name ?? "");
  const [description, setDesc] = useState(initialValues?.description ?? "");
  const [trainedSkill, setTrainedSkill] = useState(initialValues?.trained_skill ?? "");
  const [loreSkill, setLoreSkill] = useState(initialValues?.lore_skill ?? "");
  const [formError, setFormError] = useState<string | null>(null);

  const isPending = create.isPending || update.isPending;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    const payload = {
      name,
      description: description || undefined,
      trained_skill: trainedSkill || undefined,
      lore_skill: loreSkill || undefined,
    };
    try {
      if (isEditing) {
        await update.mutateAsync({ id: initialValues!.id, ...payload });
      } else {
        await create.mutateAsync(payload);
      }
      onDone();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to save background.");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">
          Name <span className="text-destructive">*</span>
        </label>
        <input
          className="input w-full"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Wandering Merchant"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">
          Trained Skill{" "}
          <span className="text-xs text-muted-foreground font-normal">(optional)</span>
        </label>
        <div className="relative">
          <select
            className="input w-full appearance-none pr-8"
            value={trainedSkill}
            onChange={(e) => setTrainedSkill(e.target.value)}
          >
            <option value="">None selected</option>
            {SKILLS.map((s) => (
              <option key={s} value={s} className="capitalize">
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </option>
            ))}
          </select>
          <ChevronDown
            size={14}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">
          Lore Skill Topic{" "}
          <span className="text-xs text-muted-foreground font-normal">(optional)</span>
        </label>
        <input
          className="input w-full"
          value={loreSkill}
          onChange={(e) => setLoreSkill(e.target.value)}
          placeholder="e.g. Trade, Sailing, Alchemy…"
        />
        <p className="text-xs text-muted-foreground mt-1">
          Enter just the topic — not &quot;Lore&quot;.
        </p>
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
          placeholder="Flavor text, origin story…"
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
            "Create Background"
          )}
        </button>
      </div>
    </form>
  );
}

// ── Background Card ───────────────────────────────────────────────────────────

function BackgroundCard({
  item,
  onEdit,
  onDelete,
  deleting,
}: {
  item: BackgroundItem;
  onEdit: () => void;
  onDelete: () => void;
  deleting: boolean;
}) {
  const metaParts: string[] = [];
  if (item.trained_skill) metaParts.push(item.trained_skill.charAt(0).toUpperCase() + item.trained_skill.slice(1));
  if (item.lore_skill) metaParts.push(`${item.lore_skill} Lore`);

  return (
    <div className="card p-4 flex flex-col gap-2">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h3 className="font-heading font-bold truncate">{item.name}</h3>
          {metaParts.length > 0 && (
            <p className="text-xs text-muted-foreground mt-0.5">
              {metaParts.join(" · ")}
            </p>
          )}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={onEdit}
            className="p-1.5 rounded-md text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
            title="Edit background"
          >
            <Pencil size={14} />
          </button>
          <button
            onClick={onDelete}
            disabled={deleting}
            className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-50"
            title="Delete background"
          >
            {deleting ? <div className="spinner w-3.5 h-3.5" /> : <Trash2 size={14} />}
          </button>
        </div>
      </div>

      {item.description && (
        <p className="text-xs text-muted-foreground line-clamp-2">{item.description}</p>
      )}
    </div>
  );
}

// ── Panel ─────────────────────────────────────────────────────────────────────

export function BackgroundPanel() {
  const [q, setQ] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { data: rawData, isLoading, error } = useHomebrewBackgrounds();
  const deleteBackground = useDeleteHomebrewBackground();

  const items = (rawData ?? []).map(toItem);
  const filtered = q
    ? items.filter((b) => b.name.toLowerCase().includes(q.toLowerCase()))
    : items;

  const editingItem = editingId ? items.find((b) => b.id === editingId) : undefined;
  const showForm = isCreating || !!editingId;

  function openCreate() { setIsCreating(true); setEditingId(null); }
  function openEdit(id: string) { setEditingId(id); setIsCreating(false); }
  function closeForm() { setIsCreating(false); setEditingId(null); }

  async function handleDelete(id: string) {
    if (!confirm("Delete this background? This cannot be undone.")) return;
    setDeletingId(id);
    try {
      await deleteBackground.mutateAsync(id);
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
            placeholder="Search backgrounds…"
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
          Add Background
        </button>
      </div>

      {/* Inline form */}
      {showForm && (
        <div className="card p-5 border-primary/30 bg-primary/5">
          <h3 className="font-heading font-semibold mb-4">
            {editingId ? "Edit Background" : "New Background"}
          </h3>
          <BackgroundForm
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
          <h3 className="font-heading text-xl font-bold mb-1">No homebrew backgrounds yet</h3>
          <p className="text-muted-foreground text-sm mb-6">
            {q
              ? `No results for "${q}".`
              : "Create custom backgrounds that appear in the character builder."}
          </p>
          {!q && (
            <button onClick={openCreate} className="btn-primary inline-flex items-center gap-2">
              <Plus size={16} /> Add your first background
            </button>
          )}
        </div>
      )}

      {/* Count + grid */}
      {!isLoading && !error && items.length > 0 && (
        <>
          <p className="text-xs text-muted-foreground">
            {filtered.length} {filtered.length === 1 ? "background" : "backgrounds"}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((item) => (
              <BackgroundCard
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
