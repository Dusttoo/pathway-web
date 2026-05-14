"use client";

import { useState } from "react";
import { Search, Loader2, Plus, Minus, X, Coins } from "lucide-react";
import { useItems } from "@/lib/hooks/use-items";
import type { StepProps } from "../types";
import { AonLink, valueFromMetadata } from "../AonLink";

type ItemWithAon = {
  aon_url?: string | null;
  item_metadata?: unknown;
};

const ITEM_TYPES: { value: string; label: string }[] = [
  { value: "", label: "All types" },
  { value: "weapon", label: "Weapon" },
  { value: "armor", label: "Armor" },
  { value: "shield", label: "Shield" },
  { value: "adventuring_gear", label: "Gear" },
  { value: "consumable", label: "Consumable" },
  { value: "alchemical", label: "Alchemical" },
  { value: "held_item", label: "Held item" },
  { value: "worn_item", label: "Worn item" },
];

const COIN_FIELDS: { key: "gp" | "sp" | "cp" | "pp"; label: string }[] = [
  { key: "gp", label: "GP" },
  { key: "sp", label: "SP" },
  { key: "cp", label: "CP" },
  { key: "pp", label: "PP" },
];

export function EquipmentStep({ state, update }: StepProps) {
  const [searchQ, setSearchQ] = useState("");
  const [itemType, setItemType] = useState("");

  const { data, isLoading } = useItems({
    q: searchQ || undefined,
    item_type: itemType || undefined,
    limit: 50,
  });
  const items = data?.data ?? [];
  const selectedIds = new Map(state.selectedItems.map((s) => [s.item_id, s]));

  function addItem(item: { id: string; name: string }) {
    const existing = selectedIds.get(item.id);
    if (existing) {
      bump(item.id, +1);
    } else {
      update({
        selectedItems: [
          ...state.selectedItems,
          { item_id: item.id, item_name: item.name, quantity: 1 },
        ],
      });
    }
  }

  function bump(itemId: string, delta: number) {
    update({
      selectedItems: state.selectedItems.flatMap((s) => {
        if (s.item_id !== itemId) return [s];
        const q = s.quantity + delta;
        return q <= 0 ? [] : [{ ...s, quantity: q }];
      }),
    });
  }

  function remove(itemId: string) {
    update({ selectedItems: state.selectedItems.filter((s) => s.item_id !== itemId) });
  }

  function priceLabel(cp: number | null | undefined): string | null {
    if (!cp) return null;
    if (cp >= 100) return `${(cp / 100).toFixed(cp % 100 === 0 ? 0 : 1)} gp`;
    if (cp >= 10) return `${cp / 10} sp`;
    return `${cp} cp`;
  }

  return (
    <div className="space-y-5">
      <p className="text-sm text-muted-foreground">
        Pick starting equipment from Archives of Nethys, then set your starting currency. You can
        change inventory at any time from the character sheet.
      </p>

      {/* Search + type filter */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <div className="sm:col-span-2 relative">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
          />
          <input
            type="text"
            className="input w-full pl-8"
            placeholder="Search items… (longsword, healing potion, scale mail)"
            value={searchQ}
            onChange={(e) => setSearchQ(e.target.value)}
          />
        </div>
        <select
          className="input w-full"
          value={itemType}
          onChange={(e) => setItemType(e.target.value)}
        >
          {ITEM_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </div>

      {/* Results */}
      <div className="border border-border rounded-md max-h-80 overflow-y-auto divide-y divide-border">
        {isLoading && (
          <div className="p-4 flex items-center gap-2 text-muted-foreground text-sm">
            <Loader2 size={14} className="animate-spin" /> Loading items…
          </div>
        )}
        {!isLoading && items.length === 0 && (
          <div className="p-4 text-sm text-muted-foreground">
            No items found. Run{" "}
            <code className="text-xs bg-muted px-1 rounded">
              npx tsx scripts/seed_nethys.ts --only=equipment,weapons,armor,shields
            </code>
            .
          </div>
        )}
        {items.map((item) => {
          const inList = selectedIds.has(item.id);
          const aonUrl =
            (item as ItemWithAon).aon_url || valueFromMetadata(item.item_metadata, "aon_url");
          return (
            <div key={item.id} className="p-3 flex items-center gap-3 hover:bg-muted/30">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-sm">{item.name}</span>
                  {item.level !== null && item.level !== undefined && item.level > 0 && (
                    <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded">
                      Lvl {item.level}
                    </span>
                  )}
                  {item.bulk && (
                    <span className="text-[10px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded">
                      Bulk {item.bulk}
                    </span>
                  )}
                  {priceLabel(item.price_cp) && (
                    <span className="text-[10px] text-amber-500/90 font-mono">
                      {priceLabel(item.price_cp)}
                    </span>
                  )}
                </div>
                <AonLink
                  name={item.name}
                  url={aonUrl}
                  isOfficial={item.is_official}
                  className="mt-1"
                />
              </div>
              <button
                type="button"
                onClick={() => addItem(item)}
                className="btn-outline px-2 py-1 text-xs flex items-center gap-1 shrink-0"
              >
                {inList ? (
                  `+1 (${selectedIds.get(item.id)!.quantity})`
                ) : (
                  <>
                    <Plus size={12} /> Add
                  </>
                )}
              </button>
            </div>
          );
        })}
      </div>

      {/* Selected list */}
      {state.selectedItems.length > 0 && (
        <section>
          <h3 className="text-sm font-semibold mb-2">
            Selected ({state.selectedItems.length} items,{" "}
            {state.selectedItems.reduce((sum, s) => sum + s.quantity, 0)} total)
          </h3>
          <div className="space-y-1.5">
            {state.selectedItems.map((s) => (
              <div
                key={s.item_id}
                className="flex items-center gap-2 p-2 rounded-md border border-border"
              >
                <span className="text-sm flex-1 truncate">{s.item_name}</span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => bump(s.item_id, -1)}
                    className="btn-outline w-6 h-6 p-0 flex items-center justify-center"
                    aria-label="Decrement"
                  >
                    <Minus size={11} />
                  </button>
                  <span className="text-sm font-mono w-6 text-center">{s.quantity}</span>
                  <button
                    type="button"
                    onClick={() => bump(s.item_id, +1)}
                    className="btn-outline w-6 h-6 p-0 flex items-center justify-center"
                    aria-label="Increment"
                  >
                    <Plus size={11} />
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => remove(s.item_id)}
                  className="text-muted-foreground hover:text-destructive p-1 ml-1"
                  aria-label="Remove"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Currency */}
      <section>
        <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
          <Coins size={14} className="text-amber-500" /> Starting currency
        </h3>
        <div className="grid grid-cols-4 gap-2">
          {COIN_FIELDS.map(({ key, label }) => (
            <div key={key}>
              <label className="block text-xs text-muted-foreground uppercase mb-1">{label}</label>
              <input
                type="number"
                min={0}
                className="input w-full text-center font-mono"
                value={state.money[key]}
                onChange={(e) =>
                  update({
                    money: {
                      ...state.money,
                      [key]: Math.max(0, parseInt(e.target.value) || 0),
                    },
                  })
                }
              />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
