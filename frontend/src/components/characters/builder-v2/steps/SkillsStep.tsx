"use client";

import { Lock, CheckCircle2, Circle, Plus, X } from "lucide-react";
import { useState } from "react";
import type { StepProps } from "../types";

const SKILL_LIST: { key: string; label: string; ability: string }[] = [
  { key: "acrobatics", label: "Acrobatics", ability: "Dex" },
  { key: "arcana", label: "Arcana", ability: "Int" },
  { key: "athletics", label: "Athletics", ability: "Str" },
  { key: "crafting", label: "Crafting", ability: "Int" },
  { key: "deception", label: "Deception", ability: "Cha" },
  { key: "diplomacy", label: "Diplomacy", ability: "Cha" },
  { key: "intimidation", label: "Intimidation", ability: "Cha" },
  { key: "medicine", label: "Medicine", ability: "Wis" },
  { key: "nature", label: "Nature", ability: "Wis" },
  { key: "occultism", label: "Occultism", ability: "Int" },
  { key: "performance", label: "Performance", ability: "Cha" },
  { key: "religion", label: "Religion", ability: "Wis" },
  { key: "society", label: "Society", ability: "Int" },
  { key: "stealth", label: "Stealth", ability: "Dex" },
  { key: "survival", label: "Survival", ability: "Wis" },
  { key: "thievery", label: "Thievery", ability: "Dex" },
];

function intMod(intScore: number): number {
  return Math.floor((intScore - 10) / 2);
}

export function SkillsStep({ state, update }: StepProps) {
  const {
    classInitialProfs,
    classTrainedCount,
    backgroundTrainedSkill,
    trainedSkills,
    additionalSkills,
    abilities,
  } = state;

  // Skills the class auto-grants at trained or higher (rank ≥ 2 in
  // initial_proficiencies map). Cannot be unchecked.
  const classGranted = new Set(
    SKILL_LIST.filter((s) => (classInitialProfs[s.key] ?? 0) >= 2).map((s) => s.key)
  );

  // Background skill is also locked-on (background gives 1 trained skill).
  const bgSkill = backgroundTrainedSkill?.toLowerCase() ?? "";
  const lockedSkills = new Set([...classGranted, ...(bgSkill ? [bgSkill] : [])]);

  // Free pick budget: class's trained_skill_count + INT modifier.
  const freePicks = Math.max(0, classTrainedCount + intMod(abilities.int));
  const userPicked = trainedSkills.filter((s) => !lockedSkills.has(s));
  const remaining = freePicks - userPicked.length;

  function toggleSkill(key: string) {
    if (lockedSkills.has(key)) return;
    if (trainedSkills.includes(key)) {
      update({ trainedSkills: trainedSkills.filter((s) => s !== key) });
    } else if (remaining > 0) {
      update({ trainedSkills: [...trainedSkills, key] });
    }
  }

  // ── additional skills (custom rank, e.g. lore, raised by feats) ──
  const [newSkillName, setNewSkillName] = useState("");

  function addAdditional() {
    const name = newSkillName.trim();
    if (!name) return;
    update({ additionalSkills: [...additionalSkills, { name, rank: 2 }] });
    setNewSkillName("");
  }

  function removeAdditional(index: number) {
    update({ additionalSkills: additionalSkills.filter((_, i) => i !== index) });
  }

  function setAdditionalRank(index: number, rank: number) {
    update({
      additionalSkills: additionalSkills.map((s, i) => (i === index ? { ...s, rank } : s)),
    });
  }

  return (
    <div className="space-y-5">
      <p className="text-sm text-muted-foreground">
        Pick {freePicks} trained skill{freePicks === 1 ? "" : "s"}. Skills locked-on come from your
        class
        {state.className ? ` (${state.className})` : ""}
        {bgSkill ? ` and background (${bgSkill})` : ""}.
      </p>

      <div className="rounded-lg border border-border bg-muted/30 p-3 flex items-center justify-between text-sm">
        <span>
          <span className="font-semibold">{userPicked.length}</span> of{" "}
          <span className="font-semibold">{freePicks}</span> free picks used
          {state.classId && (
            <span className="text-xs text-muted-foreground ml-2">
              ({state.classTrainedCount} class + {intMod(abilities.int)} INT mod)
            </span>
          )}
        </span>
        {remaining > 0 ? (
          <span className="text-xs text-amber-500">{remaining} remaining</span>
        ) : (
          <span className="text-xs text-emerald-500">Complete</span>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
        {SKILL_LIST.map((skill) => {
          const checked = trainedSkills.includes(skill.key);
          const locked = lockedSkills.has(skill.key);
          const disabledForBudget = !checked && !locked && remaining <= 0;
          return (
            <button
              key={skill.key}
              type="button"
              onClick={() => toggleSkill(skill.key)}
              disabled={locked || disabledForBudget}
              className={`flex items-center justify-between gap-2 p-2 rounded-md border transition-colors text-left
                ${
                  checked
                    ? "border-primary/50 bg-primary/5"
                    : "border-border bg-card hover:border-primary/30"
                }
                ${locked ? "cursor-default" : ""}
                ${disabledForBudget ? "opacity-40 cursor-not-allowed" : ""}`}
            >
              <span className="flex items-center gap-2 min-w-0">
                {locked ? (
                  <Lock size={12} className="text-muted-foreground shrink-0" />
                ) : checked ? (
                  <CheckCircle2 size={14} className="text-primary shrink-0" />
                ) : (
                  <Circle size={14} className="text-muted-foreground shrink-0" />
                )}
                <span className="text-sm truncate">{skill.label}</span>
              </span>
              <span className="text-[10px] uppercase tracking-wide text-muted-foreground/80 shrink-0">
                {skill.ability}
              </span>
            </button>
          );
        })}
      </div>

      {/* Additional skills (lore skills, skills raised by feats/items) */}
      <section>
        <h3 className="text-sm font-semibold mb-1">Additional skills</h3>
        <p className="text-xs text-muted-foreground mb-3">
          Lore skills, skills raised by an archetype or item, or anything not in the standard 16.
          Each is stored with its rank (Trained=2, Expert=4, Master=6, Legendary=8).
        </p>

        <div className="flex gap-2 mb-3">
          <input
            type="text"
            placeholder="e.g. Heraldry Lore, Underworld Lore"
            className="input flex-1 text-sm"
            value={newSkillName}
            onChange={(e) => setNewSkillName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addAdditional();
              }
            }}
          />
          <button type="button" onClick={addAdditional} className="btn-outline px-3">
            <Plus size={14} />
          </button>
        </div>

        {additionalSkills.length > 0 && (
          <div className="space-y-1.5">
            {additionalSkills.map((s, i) => (
              <div
                key={`${s.name}-${i}`}
                className="flex items-center gap-2 p-2 rounded-md border border-border"
              >
                <span className="text-sm flex-1 truncate">{s.name}</span>
                <select
                  value={s.rank}
                  onChange={(e) => setAdditionalRank(i, parseInt(e.target.value))}
                  className="input text-xs py-1"
                >
                  <option value={2}>Trained</option>
                  <option value={4}>Expert</option>
                  <option value={6}>Master</option>
                  <option value={8}>Legendary</option>
                </select>
                <button
                  type="button"
                  onClick={() => removeAdditional(i)}
                  className="text-muted-foreground hover:text-destructive p-1"
                  aria-label={`Remove ${s.name}`}
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
