"use client";

import React, { useState } from "react";
import {
  Plus, Pencil, Trash2, Search, ChevronDown, Loader2, X, Wand2, AlertTriangle,
} from "lucide-react";
import {
  useHomebrewAncestries,
  useCreateHomebrewAncestry,
  useUpdateHomebrewAncestry,
  useDeleteHomebrewAncestry,
  type HomebrewHeritage,
} from "@/lib/hooks/use-homebrew-content";

// ── Constants ─────────────────────────────────────────────────────────────────

const SIZES = ["Tiny", "Small", "Medium", "Large", "Huge", "Gargantuan"];

// ── Types ─────────────────────────────────────────────────────────────────────

type AncestryItem = {
  id: string;
  name: string;
  ancestry_hp?: number;
  speed?: number;
  size?: string;
  description?: string;
  heritages?: { id: string; name: string; description?: string }[];
};

function toItem(raw: Record<string, unknown>): AncestryItem {
  const heritages = Array.isArray(raw.heritages)
    ? (raw.heritages as Record<string, unknown>[]).map((h) => ({
        id: String(h.id ?? ""),
        name: String(h.name ?? ""),
        description: h.description ? String(h.description) : undefined,
      }))
    : [];
  return {
    id: String(raw.id ?? ""),
    name: String(raw.name ?? ""),
    ancestry_hp: typeof raw.ancestry_hp === "number" ? raw.ancestry_hp : undefined,
    speed: typeof raw.speed === "number" ? raw.speed : undefined,
    size: raw.size ? String(raw.size) : undefined,
    description: raw.description ? String(raw.description) : undefined,
    heritages,
  };
}

// ── Ancestry Form ─────────────────────────────────────────────────────────────

function AncestryForm({
  initialValues,
  onDone,
}: {
  initialValues?: AncestryItem;
  onDone: () => void;
}) {
  const isEditing = !!initialValues?.id;
  const create = useCreateHomebrewAncestry();
  const update = useUpdateHomebrewAncestry();

  const [name, setName] = useState(initialValues?.name ?? "");
  const [hp, setHp] = useState(initialValues?.ancestry_hp ?? 8);
  const [speed, setSpeed] = useState(initialValues?.speed ?? 25);
  const [size, setSize] = useState(initialValues?.size ?? "Medium");
  const [description, setDesc] = useState(initialValues?.description ?? "");
  const [heritages, setHeritages] = useState<HomebrewHeritage[]>(
    initialValues?.heritages?.length
      ? initialValues.heritages
      : [{ name: "" }]
  );
  const [formError, setFormError] = useState<string | null>(null);

  const isPending = create.isPending || update.isPending;

  function addHeritage() { setHeritages((h) => [...h, { name: "" }]); }
  function removeHeritage(i: number) { setHeritages((h) => h.filter((_, idx) => idx !== i)); }
  function setHeritageName(i: number, v: string) {
    setHeritages((h) => h.map((x, idx) => (idx === i ? { ...x, name: v } : x)));
  }
  function setHeritageDesc(i: number, v: string) {
    setHeritages((h) => h.map((x, idx) => (idx === i ? { ...x, description: v } : x)));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    const payload = {
      name,
      ancestry_hp: hp,
      speed,
      size,
      description: description || undefined,
      heritages: heritages.filter((h) => h.name.trim()),
    };
    try {
      if (isEditing) {
        await update.mutateAsync({ id: initialValues!.id, ...payload });
      } else {
        await create.mutateAsync(payload);
      }
      onDone();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Failed to save ancestry.");
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
            placeholder="e.g. Kitsune"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Ancestry HP</label>
          <input
            className="input w-full"
            type="number"
            min={4}
            max={16}
            value={hp}
            onChange={(e) => setHp(parseInt(e.target.value) || 8)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Speed (ft)</label>
          <input
            className="input w-full"
            type="number"
            min={10}
            max={60}
            step={5}
            value={speed}
            onChange={(e) => setSpeed(parseInt(e.target.value) || 25)}
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Size</label>
          <div className="relative">
            <select
              className="input w-full appearance-none pr-8"
              value={size}
              onChange={(e) => setSize(e.target.value)}
            >
              {SIZES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <ChevronDown
              size={14}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
            />
          </div>
        </div>
        <div className="col-span-2">
          <label className="block text-sm font-medium mb-1">
            Description{" "}
            <span className="text-xs text-muted-foreground font-normal">(optional)</span>
          </label>
          <textarea
            className="input w-full min-h-[72px] resize-y text-sm"
            value={description}
            onChange={(e) => setDesc(e.target.value)}
            placeholder="Flavor text, lore, special abilities…"
          />
        </div>
      </div>

      {/* Heritages */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium">Heritages</label>
          <button
            type="button"
            onClick={addHeritage}
            className="btn-outline py-1 px-2 text-xs flex items-center gap-1"
          >
            <Plus size={12} /> Add
          </button>
        </div>
        <div className="space-y-2">
          {heritages.map((h, i) => (
            <div key={i} className="flex gap-2 items-start">
              <div className="flex-1 space-y-1">
                <input
                  className="input w-full text-sm"
                  placeholder={`Heritage ${i + 1} name`}
                  value={h.name}
                  onChange={(e) => setHeritageName(i, e.target.value)}
                />
                <input
                  className="input w-full text-xs"
                  placeholder="Description (optional)"
                  value={h.description ?? ""}
                  onChange={(e) => setHeritageDesc(i, e.target.value)}
                />
              </div>
              {heritages.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeHeritage(i)}
                  className="mt-1 text-muted-foreground hover:text-destructive"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          ))}
        </div>
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
            "Create Ancestry"
          )}
        </button>
      </div>
    </form>
  );
}

// ── Ancestry Card ─────────────────────────────────────────────────────────────

function AncestryCard({
  item,
  onEdit,
  onDelete,
  deleting,
}: {
  item: AncestryItem;
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
            {item.ancestry_hp !== undefined && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-muted/60 text-muted-foreground border border-border">
                {item.ancestry_hp} HP
              </span>
            )}
            {item.speed !== undefined && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-muted/60 text-muted-foreground border border-border">
                {item.speed} ft.
              </span>
            )}
            {item.size && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-muted/60 text-muted-foreground border border-border">
                {item.size}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={onEdit}
            className="p-1.5 rounded-md text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
            title="Edit ancestry"
          >
            <Pencil size={14} />
          </button>
          <button
            onClick={onDelete}
            disabled={deleting}
            className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-50"
            title="Delete ancestry"
          >
            {deleting ? <div className="spinner w-3.5 h-3.5" /> : <Trash2 size={14} />}
          </button>
        </div>
      </div>

      {item.heritages && item.heritages.length > 0 && (
        <p className="text-xs text-muted-foreground">
          Heritages: {item.heritages.map((h) => h.name).join(", ")}
        </p>
      )}
      {item.description && (
        <p className="text-xs text-muted-foreground line-clamp-2">{item.description}</p>
      )}
    </div>
  );
}

// ── Panel ─────────────────────────────────────────────────────────────────────

export function AncestryPanel() {
  const [q, setQ] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null); // null = closed
  const [isCreating, setIsCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { data: rawData, isLoading, error } = useHomebrewAncestries();
  const deleteAncestry = useDeleteHomebrewAncestry();

  const items = (rawData ?? []).map(toItem);
  const filtered = q
    ? items.filter((a) => a.name.toLowerCase().includes(q.toLowerCase()))
    : items;

  const editingItem = editingId ? items.find((a) => a.id === editingId) : undefined;
  const showForm = isCreating || !!editingId;

  function openCreate() { setIsCreating(true); setEditingId(null); }
  function openEdit(id: string) { setEditingId(id); setIsCreating(false); }
  function closeForm() { setIsCreating(false); setEditingId(null); }

  async function handleDelete(id: string) {
    if (!confirm("Delete this ancestry and all its heritages? This cannot be undone.")) return;
    setDeletingId(id);
    try {
      await deleteAncestry.mutateAsync(id);
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
            placeholder="Search ancestries…"
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
          Add Ancestry
        </button>
      </div>

      {/* Inline form */}
      {showForm && (
        <div className="card p-5 border-primary/30 bg-primary/5">
          <h3 className="font-heading font-semibold mb-4">
            {editingId ? "Edit Ancestry" : "New Ancestry"}
          </h3>
          <AncestryForm
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
          <h3 className="font-heading text-xl font-bold mb-1">No homebrew ancestries yet</h3>
          <p className="text-muted-foreground text-sm mb-6">
            {q
              ? `No results for "${q}".`
              : "Create custom ancestries and heritages that appear in the character builder."}
          </p>
          {!q && (
            <button onClick={openCreate} className="btn-primary inline-flex items-center gap-2">
              <Plus size={16} /> Add your first ancestry
            </button>
          )}
        </div>
      )}

      {/* Count + grid */}
      {!isLoading && !error && items.length > 0 && (
        <>
          <p className="text-xs text-muted-foreground">
            {filtered.length} {filtered.length === 1 ? "ancestry" : "ancestries"}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((item) => (
              <AncestryCard
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
