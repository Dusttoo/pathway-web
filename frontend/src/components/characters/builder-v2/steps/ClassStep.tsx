"use client";

import { useState } from "react";
import { Search, Loader2, Heart, Sparkles, Key } from "lucide-react";
import { useClasses, useClassDetail } from "@/lib/hooks/use-builder-data";
import type { StepProps } from "../types";
import { AonLink } from "../AonLink";

function asAttrList(raw: unknown): string[] {
  if (Array.isArray(raw)) return raw.filter((x): x is string => typeof x === "string");
  if (typeof raw === "string") return [raw];
  return [];
}

export function ClassStep({ state, update }: StepProps) {
  const [searchQ, setSearchQ] = useState("");
  const { data: classPage, isLoading } = useClasses(searchQ);
  const { data: classDetail } = useClassDetail(state.classId || null);
  const classes = classPage?.data ?? [];

  const selectedKeyAttrs = asAttrList(classDetail?.key_attribute);

  function selectClass(row: (typeof classes)[number]) {
    const profs = (row.initial_proficiencies ?? {}) as Record<string, number>;
    const keyAttrs = asAttrList(row.key_attribute);
    const meta = (row.class_metadata ?? {}) as Record<string, unknown>;
    const trainedCount =
      typeof meta.trained_skill_count === "number" ? meta.trained_skill_count : 3;
    update({
      classId: row.id,
      className: row.name,
      classHp: row.class_hp ?? 8,
      classInitialProfs: profs,
      classTrainedCount: trainedCount,
      keyability: keyAttrs.length === 1 ? keyAttrs[0].toLowerCase() : "",
      classOptions: { kineticGate: "", kineticElements: [] },
      trainedSkills: [],
      selectedSpells: [],
      selectedFeats: state.selectedFeats.filter(
        (feat) => feat.feat_slot !== "class" && feat.feat_slot !== "impulse"
      ),
    });
  }

  return (
    <div className="space-y-5">
      <p className="text-sm text-muted-foreground">
        Your class determines hit points, key attribute, starting proficiencies, and the feats you
        can pick later.
      </p>

      <div className="relative">
        <Search
          size={14}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
        />
        <input
          type="text"
          className="input w-full pl-8"
          placeholder="Search classes… (try Fighter, Wizard, Bard)"
          value={searchQ}
          onChange={(e) => setSearchQ(e.target.value)}
        />
      </div>

      {isLoading && (
        <div className="p-4 flex items-center gap-2 text-muted-foreground text-sm">
          <Loader2 size={14} className="animate-spin" /> Loading classes…
        </div>
      )}

      {!isLoading && classes.length === 0 && (
        <div className="p-4 text-sm text-muted-foreground border border-dashed border-border rounded-md">
          No classes found. Apply migrations and run{" "}
          <code className="text-xs bg-muted px-1 rounded">
            npx tsx scripts/seed_pf2e_supabase.ts
          </code>
          .
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {classes.map((c) => {
          const selected = state.classId === c.id;
          const keyAttrs = asAttrList(c.key_attribute);
          return (
            <div
              key={c.id}
              className={`text-left p-4 rounded-lg border-2 transition-all
                ${
                  selected
                    ? "border-primary bg-primary/5 shadow-lg shadow-primary/10"
                    : "border-border hover:border-primary/40 hover:bg-muted/40"
                }`}
            >
              <button type="button" onClick={() => selectClass(c)} className="w-full text-left">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold">{c.name}</h3>
                  {c.is_spellcaster && (
                    <span className="text-[10px] uppercase tracking-wide bg-primary/10 text-primary px-1.5 py-0.5 rounded flex items-center gap-1">
                      <Sparkles size={9} /> Caster
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Heart size={11} /> {c.class_hp ?? 8} HP/lvl
                  </span>
                  {keyAttrs.length > 0 && (
                    <span className="flex items-center gap-1 capitalize">
                      <Key size={11} /> {keyAttrs.join(" / ").toLowerCase()}
                    </span>
                  )}
                </div>
                {c.description && (
                  <p className="mt-2 text-xs text-muted-foreground line-clamp-2">{c.description}</p>
                )}
              </button>
              <AonLink name={c.name} isOfficial={c.is_official} className="mt-2" />
            </div>
          );
        })}
      </div>

      {/* Key Attribute picker — only when the class offers multiple options */}
      {state.classId && selectedKeyAttrs.length > 1 && (
        <div className="card p-3 space-y-2 bg-muted/30">
          <label className="block text-sm font-medium">
            Pick your key attribute <span className="text-destructive">*</span>
          </label>
          <div className="flex flex-wrap gap-2">
            {selectedKeyAttrs.map((attr) => {
              const lc = attr.toLowerCase();
              const active = state.keyability === lc;
              return (
                <button
                  key={lc}
                  type="button"
                  onClick={() => update({ keyability: lc })}
                  className={`px-3 py-1.5 rounded-md text-sm capitalize transition-colors ${
                    active
                      ? "bg-primary text-primary-foreground font-medium"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  {lc}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {state.classId && (
        <div className="card p-3 bg-muted/30">
          <p className="text-sm">
            Selected: <span className="font-semibold">{state.className}</span>
            <span className="text-muted-foreground">
              {" "}
              · {state.classHp} HP/lvl
              {state.keyability ? ` · key ${state.keyability}` : ""}
            </span>
          </p>
        </div>
      )}
    </div>
  );
}
