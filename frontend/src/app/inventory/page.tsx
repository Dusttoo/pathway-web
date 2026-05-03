"use client";

import { MainLayout } from "@/components/layout";
import { useBag, type BagCategories, type BagItem } from "@/lib/hooks/use-bag";
import { ItemSearchCombobox } from "@/components/ui/ItemSearchCombobox";
import { Package, Inbox, Plus, Trash2, X } from "lucide-react";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { bagKeys } from "@/lib/hooks/use-bag";

// ── Mutations ─────────────────────────────────────────────────────────────────

function useAddItem() {
  const qc = useQueryClient();
  return useMutation<unknown, Error, { name: string; qty: number; category: string }>({
    mutationFn: (body) =>
      fetch("/api/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }).then(async (r) => {
        if (!r.ok) throw new Error((await r.json()).error ?? r.statusText);
        return r.json();
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: bagKeys.mine() }),
  });
}

function useRemoveItem() {
  const qc = useQueryClient();
  return useMutation<unknown, Error, { category: string; itemName: string }>({
    mutationFn: (body) =>
      fetch("/api/inventory", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }).then(async (r) => {
        if (!r.ok) throw new Error((await r.json()).error ?? r.statusText);
        return r.json();
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: bagKeys.mine() }),
  });
}

// ── Add item form ─────────────────────────────────────────────────────────────

const DEFAULT_CATEGORIES = ["General", "Armor", "Weapons", "Potions", "Tools", "Valuables"];

function AddItemForm({
  existingCategories,
  onClose,
}: {
  existingCategories: string[];
  onClose: () => void;
}) {
  const addMutation = useAddItem();
  const [name, setName] = useState("");
  const [qty, setQty] = useState("1");
  const [category, setCategory] = useState("");
  const [customCat, setCustomCat] = useState("");

  const allCats = Array.from(new Set([...DEFAULT_CATEGORIES, ...existingCategories])).sort();
  const effectiveCat = category === "__custom__" ? customCat.trim() : category || "General";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    const cat = category === "__custom__" ? customCat.trim() : category || "General";
    if (!cat) return;
    await addMutation.mutateAsync({ name: name.trim(), qty: parseInt(qty) || 1, category: cat });
    setName("");
    setQty("1");
    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="card p-5 space-y-3 border-primary/40">
      <div className="flex items-center justify-between">
        <p className="font-semibold text-sm">Add Item</p>
        <button type="button" onClick={onClose} className="text-muted-foreground hover:text-foreground">
          <X size={16} />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <label className="text-xs text-muted-foreground mb-1 block">Item Name</label>
          <ItemSearchCombobox
            value={name}
            onChange={setName}
            placeholder="Search or enter item name…"
            autoFocus
          />
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Quantity</label>
          <input
            className="input"
            type="number"
            min={1}
            value={qty}
            onChange={(e) => setQty(e.target.value)}
          />
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Category</label>
          <select
            className="input"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="">General</option>
            {allCats.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
            <option value="__custom__">+ New category…</option>
          </select>
        </div>
        {category === "__custom__" && (
          <div className="col-span-2">
            <label className="text-xs text-muted-foreground mb-1 block">New Category Name</label>
            <input
              className="input"
              placeholder="e.g. Quest Items"
              value={customCat}
              onChange={(e) => setCustomCat(e.target.value)}
              required
            />
          </div>
        )}
      </div>

      {addMutation.error && (
        <p className="text-xs text-destructive">{addMutation.error.message}</p>
      )}

      <div className="flex gap-2 justify-end">
        <button type="button" onClick={onClose} className="btn btn-ghost btn-sm">
          Cancel
        </button>
        <button
          type="submit"
          className="btn btn-primary btn-sm"
          disabled={addMutation.isPending || !name.trim() || (category === "__custom__" && !effectiveCat)}
        >
          {addMutation.isPending ? "Adding…" : "Add Item"}
        </button>
      </div>
    </form>
  );
}

// ── Category section ──────────────────────────────────────────────────────────

function CategorySection({
  name,
  items,
}: {
  name: string;
  items: BagItem[];
}) {
  const removeMutation = useRemoveItem();

  return (
    <div className="card p-5">
      <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground mb-3">
        {name}
      </h3>
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground italic">Empty</p>
      ) : (
        <ul className="space-y-1">
          {items.map((item, i) => (
            <li key={i} className="flex items-center justify-between text-sm group">
              <span>{item.name}</span>
              <div className="flex items-center gap-2">
                {item.qty !== 1 && (
                  <span className="text-xs bg-muted px-2 py-0.5 rounded-full text-muted-foreground">
                    ×{item.qty}
                  </span>
                )}
                <button
                  type="button"
                  onClick={() =>
                    removeMutation.mutate({ category: name, itemName: item.name })
                  }
                  disabled={removeMutation.isPending}
                  className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity disabled:opacity-30"
                  title="Remove item"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function InventoryPage() {
  const { data: bag, isLoading, error } = useBag();
  const [showAddForm, setShowAddForm] = useState(false);

  const categories = (bag?.categories ?? {}) as BagCategories;
  const categoryNames = Object.keys(categories).sort();

  return (
    <MainLayout>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-heading text-4xl font-bold mb-2">
            {bag?.bag_name ?? "Inventory"}
          </h1>
          <p className="text-muted-foreground">
            Manage your inventory — changes sync to the bot automatically
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setShowAddForm((v) => !v)}
            className="btn btn-primary flex items-center gap-2"
          >
            <Plus size={16} />
            Add Item
          </button>
          <div className="p-3 rounded-lg bg-primary/10">
            <Package className="h-6 w-6 text-primary" />
          </div>
        </div>
      </div>

      {showAddForm && (
        <div className="mb-6">
          <AddItemForm
            existingCategories={categoryNames}
            onClose={() => setShowAddForm(false)}
          />
        </div>
      )}

      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="spinner" />
        </div>
      )}

      {error && (
        <div className="card p-6 bg-destructive/10 border-destructive">
          <p className="text-destructive font-semibold">Failed to load inventory</p>
          <p className="text-sm text-muted-foreground mt-1">{error.message}</p>
        </div>
      )}

      {!isLoading && !error && !bag && !showAddForm && (
        <div className="card p-12 text-center">
          <Inbox size={48} className="mx-auto text-muted-foreground mb-4" />
          <h2 className="font-heading text-2xl font-bold mb-2">No Bag Found</h2>
          <p className="text-muted-foreground mb-4">
            Add your first item to create a bag, or use{" "}
            <code className="bg-muted px-1 rounded">/bag add</code> in Discord.
          </p>
          <button
            type="button"
            onClick={() => setShowAddForm(true)}
            className="btn btn-primary mx-auto flex items-center gap-2"
          >
            <Plus size={16} /> Add First Item
          </button>
        </div>
      )}

      {!isLoading && !error && bag && categoryNames.length === 0 && !showAddForm && (
        <div className="card p-12 text-center">
          <Package size={48} className="mx-auto text-muted-foreground mb-4" />
          <h2 className="font-heading text-2xl font-bold mb-2">Bag is Empty</h2>
          <p className="text-muted-foreground mb-4">
            Add items here or with{" "}
            <code className="bg-muted px-1 rounded">/bag add</code> in Discord.
          </p>
          <button
            type="button"
            onClick={() => setShowAddForm(true)}
            className="btn btn-primary mx-auto flex items-center gap-2"
          >
            <Plus size={16} /> Add Item
          </button>
        </div>
      )}

      {!isLoading && !error && bag && categoryNames.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {categoryNames.map((cat) => (
            <CategorySection
              key={cat}
              name={cat}
              items={categories[cat] ?? []}
            />
          ))}
        </div>
      )}
    </MainLayout>
  );
}
