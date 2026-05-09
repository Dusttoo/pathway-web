"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { useClasses, useClassDetail, useBackgroundsList } from "@/lib/hooks/use-builder-data";
import type { StepProps } from "./types";

export function ClassBackgroundStep({ state, update, onNext, onBack }: StepProps) {
  const [classQ, setClassQ]       = useState("");
  const [bgQ,    setBgQ]          = useState("");

  const { data: classPage,  isLoading: loadingClasses }    = useClasses(classQ);
  const { data: classDetail, isLoading: loadingClassDetail } = useClassDetail(state.classId || null);
  const { data: bgPage,     isLoading: loadingBgs }        = useBackgroundsList(bgQ);

  const classes     = classPage?.data ?? [];
  const backgrounds = bgPage?.data    ?? [];

  // Key ability options from the selected class
  const keyAttrs: string[] = Array.isArray(classDetail?.key_attribute)
    ? (classDetail.key_attribute as string[])
    : typeof classDetail?.key_attribute === "string"
      ? [classDetail.key_attribute as string]
      : [];

  function handleClassChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const id  = e.target.value;
    const row = classes.find((c) => c.id === id);
    if (!row) {
      update({ classId: "", className: "", classHp: 8, classInitialProfs: {}, classTrainedCount: 3, keyability: "", trainedSkills: [] });
      return;
    }
    const profs       = (row.initial_proficiencies ?? {}) as Record<string, number>;
    const keyAttrList = Array.isArray(row.key_attribute)
      ? (row.key_attribute as string[])
      : typeof row.key_attribute === "string"
        ? [row.key_attribute as string]
        : [];
    // Look for a trained_skill_count in class_metadata; default to 3
    const meta            = (row.class_metadata ?? {}) as Record<string, unknown>;
    const trainedCount    = typeof meta.trained_skill_count === "number" ? meta.trained_skill_count : 3;
    update({
      classId:          row.id,
      className:        row.name,
      classHp:          row.class_hp ?? 8,
      classInitialProfs: profs,
      classTrainedCount: trainedCount,
      keyability:       keyAttrList.length === 1 ? keyAttrList[0].toLowerCase() : "",
      trainedSkills:    [],  // reset on class change
    });
  }

  const canProceed = !!state.classId && !!state.backgroundName && !!state.keyability;

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold mb-1">Class & Background</h2>
        <p className="text-sm text-muted-foreground">Choose your class, background, and key ability.</p>
      </div>

      {/* Class */}
      <div>
        <label className="block text-sm font-medium mb-1">
          Class <span className="text-destructive">*</span>
        </label>
        <input
          className="input w-full mb-2"
          type="text"
          placeholder="Search classes…"
          value={classQ}
          onChange={(e) => setClassQ(e.target.value)}
        />
        <div className="relative">
          <select
            className="input w-full appearance-none pr-8"
            value={state.classId}
            onChange={handleClassChange}
            disabled={loadingClasses}
          >
            <option value="">
              {loadingClasses ? "Loading classes…" : "Select a class…"}
            </option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} · {c.class_hp} HP{c.is_spellcaster ? " · Spellcaster" : ""}
              </option>
            ))}
          </select>
          <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
        </div>
      </div>

      {/* Key Ability — only show when multiple options exist */}
      {state.classId && keyAttrs.length > 1 && (
        <div>
          <label className="block text-sm font-medium mb-1">
            Key Ability <span className="text-destructive">*</span>
          </label>
          <div className="relative">
            <select
              className="input w-full appearance-none pr-8"
              value={state.keyability}
              onChange={(e) => update({ keyability: e.target.value.toLowerCase() })}
              disabled={loadingClassDetail}
            >
              <option value="">Select key ability…</option>
              {keyAttrs.map((attr) => (
                <option key={attr} value={attr.toLowerCase()}>
                  {attr.toUpperCase()}
                </option>
              ))}
            </select>
            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          </div>
        </div>
      )}

      {/* Background */}
      <div>
        <label className="block text-sm font-medium mb-1">
          Background <span className="text-destructive">*</span>
        </label>
        <input
          className="input w-full mb-2"
          type="text"
          placeholder="Search backgrounds…"
          value={bgQ}
          onChange={(e) => setBgQ(e.target.value)}
        />
        <div className="relative">
          <select
            className="input w-full appearance-none pr-8"
            value={state.backgroundName}
            onChange={(e) => update({ backgroundName: e.target.value })}
            disabled={loadingBgs}
          >
            <option value="">
              {loadingBgs ? "Loading backgrounds…" : "Select a background…"}
            </option>
            {backgrounds.map((b) => (
              <option key={b.id} value={b.name}>{b.name}</option>
            ))}
          </select>
          <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
        </div>
      </div>

      {/* Lore skill from background */}
      <div>
        <label className="block text-sm font-medium mb-1">
          Background Lore Skill <span className="text-xs text-muted-foreground font-normal">(optional)</span>
        </label>
        <input
          className="input w-full"
          type="text"
          placeholder="e.g. Alcohol, Cooking, Gladiatorial…"
          value={state.lore}
          onChange={(e) => update({ lore: e.target.value })}
        />
        <p className="text-xs text-muted-foreground mt-1">
          Most backgrounds grant one Lore skill. Enter just the topic (not "Lore").
        </p>
      </div>

      <div className="flex justify-between pt-2">
        <button type="button" onClick={onBack} className="btn-outline px-6">← Back</button>
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
