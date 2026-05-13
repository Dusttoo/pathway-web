"use client";

import { useState } from "react";
import { Search, Loader2, Heart, Footprints, Ruler } from "lucide-react";
import { useAncestries } from "@/lib/hooks/use-builder-data";
import type { StepProps } from "../types";

export function AncestryStep({ state, update }: StepProps) {
  const [searchQ, setSearchQ] = useState("");
  const { data: ancestryPage, isLoading } = useAncestries(searchQ);
  const ancestries = ancestryPage?.data ?? [];

  function selectAncestry(row: (typeof ancestries)[number]) {
    const langs = Array.isArray(row.languages) ? (row.languages as string[]) : [];
    const boosts = Array.isArray(row.attribute_boosts) ? (row.attribute_boosts as string[]) : [];
    const flaws = Array.isArray(row.attribute_flaws) ? (row.attribute_flaws as string[]) : [];
    update({
      ancestryId: row.id,
      ancestryName: row.name,
      ancestryHp: row.ancestry_hp ?? 8,
      ancestrySpeed: row.speed ?? 25,
      ancestrySize: row.size ?? "Medium",
      ancestryBoostOptions: boosts,
      ancestryFlawOptions: flaws,
      defaultLanguages: langs,
      languages: langs,
      heritageId: "",
      heritageName: "",
      abilityBoostChoices: { ...state.abilityBoostChoices, ancestryFree: [] },
    });
  }

  return (
    <div className="space-y-5">
      <p className="text-sm text-muted-foreground">
        Your ancestry determines your hit points, size, speed, languages, and the base set of feats
        you can choose from.
      </p>

      <div className="relative">
        <Search
          size={14}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
        />
        <input
          type="text"
          className="input w-full pl-8"
          placeholder="Search ancestries… (try Elf, Dwarf, Goblin)"
          value={searchQ}
          onChange={(e) => setSearchQ(e.target.value)}
        />
      </div>

      {isLoading && (
        <div className="p-4 flex items-center gap-2 text-muted-foreground text-sm">
          <Loader2 size={14} className="animate-spin" /> Loading ancestries…
        </div>
      )}

      {!isLoading && ancestries.length === 0 && (
        <div className="p-4 text-sm text-muted-foreground border border-dashed border-border rounded-md">
          No ancestries found. Apply migrations and run{" "}
          <code className="text-xs bg-muted px-1 rounded">
            npx tsx scripts/seed_nethys.ts --only=ancestries
          </code>
          .
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {ancestries.map((a) => {
          const selected = state.ancestryId === a.id;
          return (
            <button
              key={a.id}
              type="button"
              onClick={() => selectAncestry(a)}
              className={`text-left p-4 rounded-lg border-2 transition-all
                ${
                  selected
                    ? "border-primary bg-primary/5 shadow-lg shadow-primary/10"
                    : "border-border hover:border-primary/40 hover:bg-muted/40"
                }`}
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold">{a.name}</h3>
                {a.rarity && a.rarity !== "Common" && (
                  <span className="text-[10px] uppercase tracking-wide text-amber-500">
                    {a.rarity}
                  </span>
                )}
              </div>
              <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Heart size={11} /> {a.ancestry_hp ?? 8} HP
                </span>
                <span className="flex items-center gap-1">
                  <Footprints size={11} /> {a.speed ?? 25} ft
                </span>
                <span className="flex items-center gap-1">
                  <Ruler size={11} /> {a.size ?? "Medium"}
                </span>
              </div>
              {a.description && (
                <p className="mt-2 text-xs text-muted-foreground line-clamp-2">{a.description}</p>
              )}
            </button>
          );
        })}
      </div>

      {state.ancestryId && (
        <div className="card p-3 bg-muted/30">
          <p className="text-sm">
            Selected: <span className="font-semibold">{state.ancestryName}</span>
            <span className="text-muted-foreground">
              {" "}
              · {state.ancestryHp} HP · {state.ancestrySpeed} ft · {state.ancestrySize}
            </span>
          </p>
        </div>
      )}
    </div>
  );
}
