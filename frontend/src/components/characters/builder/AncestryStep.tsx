"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { useAncestries, useAncestryDetail } from "@/lib/hooks/use-builder-data";
import type { StepProps } from "./types";

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

export function AncestryStep({ state, update, onNext, onBack }: StepProps) {
  const [searchQ, setSearchQ] = useState("");

  const { data: ancestryPage, isLoading: loadingList } = useAncestries(searchQ);
  const { data: ancestryDetail, isLoading: loadingDetail } = useAncestryDetail(
    state.ancestryId || null
  );

  const ancestries = ancestryPage?.data ?? [];
  const ancestryHeritages = (ancestryDetail?.heritages ?? []).filter((h) => !h.is_versatile);
  const ancestryHeritageIds = new Set(ancestryHeritages.map((h) => h.id));
  const versatileHeritages = (ancestryDetail?.versatileHeritages ?? []).filter(
    (h) => !ancestryHeritageIds.has(h.id)
  );
  const selectedAncestry = ancestryDetail ?? ancestries.find((a) => a.id === state.ancestryId);

  function handleAncestryChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const id = e.target.value;
    const row = ancestries.find((a) => a.id === id);
    if (!row) {
      update({
        ancestryId: "",
        ancestryName: "",
        ancestryHp: 8,
        ancestrySpeed: 25,
        ancestrySize: "Medium",
        heritageName: "",
        defaultLanguages: [],
      });
      return;
    }
    const langs = Array.isArray(row.languages) ? (row.languages as string[]) : [];
    update({
      ancestryId: row.id,
      ancestryName: row.name,
      ancestryHp: row.ancestry_hp ?? 8,
      ancestrySpeed: row.speed ?? 25,
      ancestrySize: row.size ?? "Medium",
      heritageName: "", // reset when ancestry changes
      defaultLanguages: langs,
      languages: langs, // pre-populate languages for step 5
    });
  }

  function handleHeritageChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const heritageName = e.target.value;
    const heritage = [...ancestryHeritages, ...versatileHeritages].find(
      (h) => h.name === heritageName
    );
    const benefits = heritage?.benefits;
    const ancestryHp =
      numberFromBenefit(statBenefit(benefits, "ancestry_hp")) ??
      numberFromBenefit(statBenefit(benefits, "hp")) ??
      selectedAncestry?.ancestry_hp ??
      8;
    const ancestrySpeed =
      numberFromBenefit(statBenefit(benefits, "speed")) ??
      numberFromBenefit(statBenefit(benefits, "land_speed")) ??
      selectedAncestry?.speed ??
      25;
    const ancestrySize =
      stringFromBenefit(statBenefit(benefits, "size")) ?? selectedAncestry?.size ?? "Medium";

    update({
      heritageName,
      ancestryHp,
      ancestrySpeed,
      ancestrySize,
    });
  }

  const canProceed = !!state.ancestryId && !!state.heritageName;

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold mb-1">Ancestry & Heritage</h2>
        <p className="text-sm text-muted-foreground">
          Choose your character&apos;s ancestry and heritage.
        </p>
      </div>

      {/* Ancestry search + select */}
      <div>
        <label className="block text-sm font-medium mb-1">
          Ancestry <span className="text-destructive">*</span>
        </label>
        <input
          className="input w-full mb-2"
          type="text"
          placeholder="Search ancestries…"
          value={searchQ}
          onChange={(e) => setSearchQ(e.target.value)}
        />
        <div className="relative">
          <select
            className="input w-full appearance-none pr-8"
            value={state.ancestryId}
            onChange={handleAncestryChange}
            disabled={loadingList}
          >
            <option value="">{loadingList ? "Loading ancestries…" : "Select an ancestry…"}</option>
            {ancestries.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name} · {a.ancestry_hp} HP · {a.speed} ft. · {a.size}
              </option>
            ))}
          </select>
          <ChevronDown
            size={14}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
          />
        </div>
      </div>

      {/* Heritage */}
      {state.ancestryId && (
        <div>
          <label className="block text-sm font-medium mb-1">
            Heritage <span className="text-destructive">*</span>
          </label>
          <div className="relative">
            <select
              className="input w-full appearance-none pr-8"
              value={state.heritageName}
              onChange={handleHeritageChange}
              disabled={loadingDetail}
            >
              <option value="">
                {loadingDetail ? "Loading heritages…" : "Select a heritage…"}
              </option>
              {ancestryHeritages.length > 0 && (
                <optgroup label={`${state.ancestryName} Heritages`}>
                  {ancestryHeritages.map((h) => (
                    <option key={h.id} value={h.name}>
                      {h.name}
                    </option>
                  ))}
                </optgroup>
              )}
              {versatileHeritages.length > 0 && (
                <optgroup label="Versatile Heritages">
                  {versatileHeritages.map((h) => (
                    <option key={h.id} value={h.name}>
                      {h.name}
                    </option>
                  ))}
                </optgroup>
              )}
            </select>
            <ChevronDown
              size={14}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
            />
          </div>
        </div>
      )}

      {/* Summary chip */}
      {state.ancestryId && (
        <div className="flex flex-wrap gap-2">
          <span className="text-xs bg-primary/10 text-primary px-3 py-1 rounded-full font-medium">
            {state.ancestryName} · {state.ancestryHp} HP · {state.ancestrySpeed} ft. ·{" "}
            {state.ancestrySize}
          </span>
          {state.heritageName && (
            <span className="text-xs bg-muted text-muted-foreground px-3 py-1 rounded-full">
              {state.heritageName}
            </span>
          )}
        </div>
      )}

      <div className="flex justify-between pt-2">
        <button type="button" onClick={onBack} className="btn-outline px-6">
          ← Back
        </button>
        <button
          type="button"
          onClick={onNext}
          disabled={!canProceed}
          className="btn-primary px-6 disabled:opacity-50"
        >
          Next →
        </button>
      </div>
    </div>
  );
}
