"use client";

import { useState } from "react";
import { Search, Loader2, CheckCircle2, BookOpen } from "lucide-react";
import { useBackgroundsList } from "@/lib/hooks/use-builder-data";
import type { StepProps } from "../types";
import { AonLink } from "../AonLink";

function asStringList(raw: unknown): string[] {
  if (Array.isArray(raw)) return raw.filter((x): x is string => typeof x === "string");
  return [];
}

export function BackgroundStep({ state, update }: StepProps) {
  const [searchQ, setSearchQ] = useState("");
  const { data: bgPage, isLoading } = useBackgroundsList(searchQ);
  const backgrounds = bgPage?.data ?? [];

  function selectBackground(row: (typeof backgrounds)[number]) {
    const skills = asStringList(row.skill_proficiencies);
    const boosts = asStringList(row.attribute_boosts);
    // Backgrounds typically grant one free trained skill — surface the first
    // as the default; AbilitiesStep / SkillsStep can let the user reassign.
    update({
      backgroundId: row.id,
      backgroundName: row.name,
      backgroundBoostOptions: boosts,
      backgroundTrainedSkill: skills[0] ?? "",
      abilityBoostChoices: { ...state.abilityBoostChoices, background: [] },
    });
  }

  return (
    <div className="space-y-5">
      <p className="text-sm text-muted-foreground">
        Your background shapes your character&apos;s history — it grants attribute boosts, a trained
        skill, a lore skill, and a skill feat.
      </p>

      <div className="relative">
        <Search
          size={14}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
        />
        <input
          type="text"
          className="input w-full pl-8"
          placeholder="Search backgrounds… (try Acolyte, Criminal, Scholar)"
          value={searchQ}
          onChange={(e) => setSearchQ(e.target.value)}
        />
      </div>

      {isLoading && (
        <div className="p-4 flex items-center gap-2 text-muted-foreground text-sm">
          <Loader2 size={14} className="animate-spin" /> Loading backgrounds…
        </div>
      )}

      {!isLoading && backgrounds.length === 0 && (
        <div className="p-4 text-sm text-muted-foreground border border-dashed border-border rounded-md">
          No backgrounds found. Apply migrations and run{" "}
          <code className="text-xs bg-muted px-1 rounded">
            npx tsx scripts/seed_nethys.ts --only=backgrounds
          </code>
          .
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {backgrounds.map((bg) => {
          const selected = state.backgroundId === bg.id;
          const skills = asStringList(bg.skill_proficiencies);
          const boosts = asStringList(bg.attribute_boosts);
          return (
            <div
              key={bg.id}
              className={`text-left p-4 rounded-lg border-2 transition-all
                ${
                  selected
                    ? "border-primary bg-primary/5 shadow-lg shadow-primary/10"
                    : "border-border hover:border-primary/40 hover:bg-muted/40"
                }`}
            >
              <button
                type="button"
                onClick={() => selectBackground(bg)}
                className="w-full text-left"
              >
                <h3 className="font-semibold mb-2">{bg.name}</h3>
                <div className="space-y-1 text-xs text-muted-foreground">
                  {boosts.length > 0 && (
                    <div className="flex items-center gap-1 capitalize">
                      <span className="font-medium text-foreground">Boosts:</span>{" "}
                      {boosts.join(", ").toLowerCase()}
                    </div>
                  )}
                  {skills.length > 0 && (
                    <div className="flex items-start gap-1">
                      <CheckCircle2 size={11} className="mt-0.5 shrink-0" />
                      <span>{skills.join(", ")}</span>
                    </div>
                  )}
                </div>
                {bg.description && (
                  <p className="mt-2 text-xs text-muted-foreground line-clamp-2">
                    {bg.description}
                  </p>
                )}
              </button>
              <AonLink name={bg.name} isOfficial={bg.is_official} className="mt-2" />
            </div>
          );
        })}
      </div>

      {/* Lore picker — most backgrounds grant a specific lore skill. We surface
          a text input rather than enumerating because the lore name often
          depends on the player's narrative choice (e.g. "Cathedral Lore"). */}
      {state.backgroundId && (
        <div className="card p-3 space-y-3 bg-muted/30">
          <p className="text-sm">
            Selected: <span className="font-semibold">{state.backgroundName}</span>
            {state.backgroundTrainedSkill && (
              <span className="text-muted-foreground">
                {" "}
                · trained {state.backgroundTrainedSkill}
              </span>
            )}
          </p>
          <div>
            <label className="block text-xs font-medium mb-1 flex items-center gap-1">
              <BookOpen size={11} /> Lore skill name{" "}
              <span className="text-muted-foreground font-normal">(optional, narrative)</span>
            </label>
            <input
              className="input w-full text-sm"
              type="text"
              placeholder="e.g. Heraldry Lore, Underworld Lore"
              value={state.lore}
              onChange={(e) => update({ lore: e.target.value })}
            />
          </div>
        </div>
      )}
    </div>
  );
}
