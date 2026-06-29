"use client";

import { useState } from "react";
import { Search, Loader2, Heart, Footprints, Ruler, Star, ChevronDown } from "lucide-react";
import { useAncestries } from "@/lib/hooks/use-builder-data";
import type { StepProps } from "../types";
import { AonLink } from "../AonLink";
import { BEGINNER_ANCESTRIES, beginnerReason } from "../beginner-picks";

export function AncestryStep({ state, update, beginnerMode }: StepProps) {
  const [searchQ, setSearchQ] = useState("");
  const [browseOpen, setBrowseOpen] = useState(false);
  const { data: ancestryPage, isLoading } = useAncestries(searchQ);
  const ancestries = ancestryPage?.data ?? [];

  // Beginner Mode with no active search leads with a small curated shortlist
  // and tucks the full list behind a "browse all" toggle to cut overwhelm.
  const showRecommended = !!beginnerMode && !searchQ.trim();
  const recommended = showRecommended
    ? ancestries.filter((a) => beginnerReason(BEGINNER_ANCESTRIES, a.name))
    : [];

  type AncestryRow = (typeof ancestries)[number];

  function selectAncestry(row: AncestryRow) {
    const langs = Array.isArray(row.languages) ? (row.languages as string[]) : [];
    const boosts = Array.isArray(row.attribute_boosts) ? (row.attribute_boosts as string[]) : [];
    const flaws = Array.isArray(row.attribute_flaws) ? (row.attribute_flaws as string[]) : [];
    update({
      ancestryId: row.id,
      ancestryName: row.name,
      ancestryHp: row.ancestry_hp ?? 8,
      ancestrySpeed: row.speed ?? 25,
      ancestrySize: row.size ?? "Medium",
      ancestryBoostMode: "remaster",
      ancestryBoostOptions: boosts,
      ancestryFlawOptions: flaws,
      selectedAncestryFlaws: [],
      defaultLanguages: langs,
      ancestryBonusLanguages: row.bonus_languages ?? 0,
      languages: langs,
      heritageId: "",
      heritageName: "",
      abilityBoostChoices: { ...state.abilityBoostChoices, ancestryFree: [] },
    });
  }

  function AncestryCard({ a, reason }: { a: AncestryRow; reason?: string | null }) {
    const selected = state.ancestryId === a.id;
    return (
      <div
        className={`rounded-lg border-2 p-4 text-left transition-all ${
          selected
            ? "border-primary bg-primary/5 shadow-lg shadow-primary/10"
            : "border-border hover:border-primary/40 hover:bg-muted/40"
        }`}
      >
        <button type="button" onClick={() => selectAncestry(a)} className="w-full text-left">
          <div className="mb-2 flex items-center justify-between gap-2">
            <h3 className="font-semibold">{a.name}</h3>
            {reason ? (
              <span className="flex items-center gap-1 rounded bg-amber-500/15 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-amber-400">
                <Star size={9} className="fill-amber-400" /> Beginner
              </span>
            ) : (
              a.rarity &&
              a.rarity !== "Common" && (
                <span className="text-[10px] uppercase tracking-wide text-amber-500">
                  {a.rarity}
                </span>
              )
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
          {reason ? (
            <p className="mt-2 text-xs text-amber-200/90">{reason}</p>
          ) : (
            a.description && (
              <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">{a.description}</p>
            )
          )}
        </button>
        <AonLink name={a.name} isOfficial={a.is_official} className="mt-2" />
      </div>
    );
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
        <div className="rounded-md border border-dashed border-border p-4 text-sm text-muted-foreground">
          {searchQ.trim()
            ? `No ancestries match “${searchQ.trim()}”. Try a different name.`
            : "No ancestries are available yet. Check back soon!"}
        </div>
      )}

      {/* Recommended shortlist for first-timers */}
      {showRecommended && recommended.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <Star size={15} className="fill-amber-400 text-amber-400" />
            <h3 className="text-sm font-semibold text-amber-300">Great for your first character</h3>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {recommended.map((a) => (
              <AncestryCard key={a.id} a={a} reason={beginnerReason(BEGINNER_ANCESTRIES, a.name)} />
            ))}
          </div>
        </section>
      )}

      {/* Full list — collapsed by default when showing the shortlist */}
      {showRecommended ? (
        <section className="space-y-3">
          <button
            type="button"
            onClick={() => setBrowseOpen((open) => !open)}
            className="flex w-full items-center justify-between rounded-md border border-border bg-muted/20 px-4 py-2.5 text-left text-sm"
          >
            <span className="font-medium">Browse all ancestries ({ancestries.length})</span>
            <ChevronDown
              size={16}
              className={`text-muted-foreground transition-transform ${browseOpen ? "rotate-180" : ""}`}
            />
          </button>
          {browseOpen && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {ancestries.map((a) => (
                <AncestryCard
                  key={a.id}
                  a={a}
                  reason={beginnerReason(BEGINNER_ANCESTRIES, a.name)}
                />
              ))}
            </div>
          )}
        </section>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {ancestries.map((a) => (
            <AncestryCard key={a.id} a={a} reason={beginnerReason(BEGINNER_ANCESTRIES, a.name)} />
          ))}
        </div>
      )}

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
