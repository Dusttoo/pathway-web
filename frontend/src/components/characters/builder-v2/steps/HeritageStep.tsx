"use client";

import { useState } from "react";
import { Loader2, AlertCircle, Sparkles, Users2, Search } from "lucide-react";
import { useAncestryDetail } from "@/lib/hooks/use-builder-data";
import type { StepProps } from "../types";
import { AonLink, valueFromMetadata } from "../AonLink";

function numberFromBenefit(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const match = value.match(/-?\d+/);
    if (match) return parseInt(match[0], 10);
  }
  return undefined;
}

function stringFromBenefit(value: unknown): string | undefined {
  if (Array.isArray(value)) {
    const strings = value.filter((item) => typeof item === "string");
    return strings.length ? strings.join(", ") : undefined;
  }
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function statBenefit(benefits: unknown, key: string): unknown {
  if (!benefits || typeof benefits !== "object" || Array.isArray(benefits)) return undefined;
  const record = benefits as Record<string, unknown>;
  const stats = record.stats;
  if (stats && typeof stats === "object" && !Array.isArray(stats)) {
    const value = (stats as Record<string, unknown>)[key];
    if (value !== undefined) return value;
  }
  return record[key];
}

function heritageAonUrl(benefits: unknown): string | null {
  return valueFromMetadata(benefits, "aon_url");
}

export function HeritageStep({ state, update }: StepProps) {
  const [searchQ, setSearchQ] = useState("");
  const { data: detail, isLoading } = useAncestryDetail(state.ancestryId || null);

  if (!state.ancestryId) {
    return (
      <div className="p-4 border border-dashed border-border rounded-md flex items-center gap-2 text-sm text-muted-foreground">
        <AlertCircle size={14} className="text-amber-500" />
        Pick an ancestry first, then come back for a heritage.
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-4 flex items-center gap-2 text-muted-foreground text-sm">
        <Loader2 size={14} className="animate-spin" /> Loading heritages…
      </div>
    );
  }

  const query = searchQ.trim().toLowerCase();
  const matchesSearch = (h: { name: string; description?: string | null }) =>
    !query ||
    h.name.toLowerCase().includes(query) ||
    (h.description ?? "").toLowerCase().includes(query);
  const allAncestryHeritages = (detail?.heritages ?? []).filter((h) => !h.is_versatile);
  const ancestryHeritages = allAncestryHeritages.filter(matchesSearch);
  const versatileIds = new Set(allAncestryHeritages.map((h) => h.id));
  const versatile = (detail?.versatileHeritages ?? []).filter(
    (h) => !versatileIds.has(h.id) && matchesSearch(h)
  );

  function pick(h: { id: string; name: string; benefits?: unknown }) {
    const ancestryHp =
      numberFromBenefit(statBenefit(h.benefits, "ancestry_hp")) ??
      numberFromBenefit(statBenefit(h.benefits, "hp")) ??
      detail?.ancestry_hp ??
      state.ancestryHp;
    const ancestrySpeed =
      numberFromBenefit(statBenefit(h.benefits, "speed")) ??
      numberFromBenefit(statBenefit(h.benefits, "land_speed")) ??
      detail?.speed ??
      state.ancestrySpeed;
    const ancestrySize =
      stringFromBenefit(statBenefit(h.benefits, "size")) ?? detail?.size ?? state.ancestrySize;

    update({
      heritageId: h.id,
      heritageName: h.name,
      ancestryHp,
      ancestrySpeed,
      ancestrySize,
    });
  }

  return (
    <div className="space-y-5">
      <p className="text-sm text-muted-foreground">
        Heritages refine your ancestry — a specific bloodline, region, or magical lineage that
        grants extra abilities.
      </p>

      <div className="relative">
        <Search
          size={14}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
        />
        <input
          className="input w-full pl-8"
          type="text"
          placeholder="Search heritages..."
          value={searchQ}
          onChange={(e) => setSearchQ(e.target.value)}
        />
      </div>

      {/* Ancestry-specific heritages */}
      {ancestryHeritages.length > 0 && (
        <section>
          <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
            <Sparkles size={14} className="text-primary" />
            {state.ancestryName} Heritages
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {ancestryHeritages.map((h) => {
              const selected = state.heritageId === h.id;
              return (
                <div
                  key={h.id}
                  className={`text-left p-3 rounded-lg border-2 transition-all
                    ${
                      selected
                        ? "border-primary bg-primary/5 shadow-md shadow-primary/10"
                        : "border-border hover:border-primary/40 hover:bg-muted/40"
                    }`}
                >
                  <button type="button" onClick={() => pick(h)} className="w-full text-left">
                    <p className="font-semibold text-sm">{h.name}</p>
                    {h.description && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {h.description}
                      </p>
                    )}
                  </button>
                  <AonLink
                    name={h.name}
                    url={heritageAonUrl(h.benefits)}
                    isOfficial={h.is_official}
                    className="mt-2"
                  />
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Versatile heritages — open to all ancestries */}
      {versatile.length > 0 && (
        <section>
          <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
            <Users2 size={14} className="text-muted-foreground" /> Versatile Heritages
          </h3>
          <p className="text-xs text-muted-foreground mb-2">
            Available regardless of ancestry — Aiuvarin, Dhampir, Changeling, etc.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {versatile.map((h) => {
              const selected = state.heritageId === h.id;
              return (
                <div
                  key={h.id}
                  className={`text-left p-3 rounded-lg border-2 transition-all
                    ${
                      selected
                        ? "border-primary bg-primary/5 shadow-md shadow-primary/10"
                        : "border-border hover:border-primary/40 hover:bg-muted/40"
                    }`}
                >
                  <button type="button" onClick={() => pick(h)} className="w-full text-left">
                    <p className="font-semibold text-sm">{h.name}</p>
                    {h.description && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {h.description}
                      </p>
                    )}
                  </button>
                  <AonLink
                    name={h.name}
                    url={heritageAonUrl(h.benefits)}
                    isOfficial={h.is_official}
                    className="mt-2"
                  />
                </div>
              );
            })}
          </div>
        </section>
      )}

      {state.heritageId && (
        <div className="card p-3 bg-muted/30">
          <p className="text-sm">
            Selected: <span className="font-semibold">{state.heritageName}</span>
            <span className="text-muted-foreground"> ({state.ancestryName})</span>
          </p>
        </div>
      )}
    </div>
  );
}
