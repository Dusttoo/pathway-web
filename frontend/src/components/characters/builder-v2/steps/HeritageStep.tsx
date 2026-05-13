"use client";

import { Loader2, AlertCircle, Sparkles, Users2 } from "lucide-react";
import { useAncestryDetail } from "@/lib/hooks/use-builder-data";
import type { StepProps } from "../types";

export function HeritageStep({ state, update }: StepProps) {
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

  const ancestryHeritages = (detail?.heritages ?? []).filter((h) => !h.is_versatile);
  const versatileIds = new Set(ancestryHeritages.map((h) => h.id));
  const versatile = (detail?.versatileHeritages ?? []).filter((h) => !versatileIds.has(h.id));

  function pick(h: { id: string; name: string }) {
    update({ heritageId: h.id, heritageName: h.name });
  }

  return (
    <div className="space-y-5">
      <p className="text-sm text-muted-foreground">
        Heritages refine your ancestry — a specific bloodline, region, or magical lineage that
        grants extra abilities.
      </p>

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
                <button
                  key={h.id}
                  type="button"
                  onClick={() => pick(h)}
                  className={`text-left p-3 rounded-lg border-2 transition-all
                    ${
                      selected
                        ? "border-primary bg-primary/5 shadow-md shadow-primary/10"
                        : "border-border hover:border-primary/40 hover:bg-muted/40"
                    }`}
                >
                  <p className="font-semibold text-sm">{h.name}</p>
                  {h.description && (
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                      {h.description}
                    </p>
                  )}
                </button>
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
                <button
                  key={h.id}
                  type="button"
                  onClick={() => pick(h)}
                  className={`text-left p-3 rounded-lg border-2 transition-all
                    ${
                      selected
                        ? "border-primary bg-primary/5 shadow-md shadow-primary/10"
                        : "border-border hover:border-primary/40 hover:bg-muted/40"
                    }`}
                >
                  <p className="font-semibold text-sm">{h.name}</p>
                  {h.description && (
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                      {h.description}
                    </p>
                  )}
                </button>
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
