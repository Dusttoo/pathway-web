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

function rankLabel(rank: number): string {
  if (rank >= 8) return "Legendary";
  if (rank >= 6) return "Master";
  if (rank >= 4) return "Expert";
  if (rank >= 2) return "Trained";
  return "Untrained";
}

export function SkillsStep({ state, update }: StepProps) {
  const {
    classInitialProfs,
    classTrainedCount,
    backgroundTrainedSkill,
    trainedSkills,
    additionalSkills,
    customProficiencies,
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
  const standardPicked = trainedSkills.filter((s) => !lockedSkills.has(s));
  const additionalPicked = additionalSkills.filter((s) => s.name.trim() && s.rank >= 2);
  const usedPicks = standardPicked.length + additionalPicked.length;
  const remaining = freePicks - usedPicks;

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
  const [newSkillRank, setNewSkillRank] = useState(2);
  const [newProficiencyType, setNewProficiencyType] = useState<"weapon" | "armor">("weapon");
  const [newProficiencyName, setNewProficiencyName] = useState("");
  const [newProficiencyRank, setNewProficiencyRank] = useState(2);

  function addAdditional() {
    const name = newSkillName.trim();
    if (!name) return;
    if (newSkillRank >= 2 && remaining <= 0) return;
    update({ additionalSkills: [...additionalSkills, { name, rank: newSkillRank }] });
    setNewSkillName("");
    setNewSkillRank(2);
  }

  function removeAdditional(index: number) {
    update({ additionalSkills: additionalSkills.filter((_, i) => i !== index) });
  }

  function setAdditionalRank(index: number, rank: number) {
    update({
      additionalSkills: additionalSkills.map((s, i) => (i === index ? { ...s, rank } : s)),
    });
  }

  function setAdditionalName(index: number, name: string) {
    update({
      additionalSkills: additionalSkills.map((s, i) => (i === index ? { ...s, name } : s)),
    });
  }

  function addCustomProficiency() {
    const name = newProficiencyName.trim();
    if (!name) return;
    update({
      customProficiencies: [
        ...customProficiencies,
        { type: newProficiencyType, name, rank: newProficiencyRank },
      ],
    });
    setNewProficiencyName("");
    setNewProficiencyRank(2);
  }

  function removeCustomProficiency(index: number) {
    update({ customProficiencies: customProficiencies.filter((_, i) => i !== index) });
  }

  function setCustomProficiencyName(index: number, name: string) {
    update({
      customProficiencies: customProficiencies.map((prof, i) =>
        i === index ? { ...prof, name } : prof
      ),
    });
  }

  function setCustomProficiencyRank(index: number, rank: number) {
    update({
      customProficiencies: customProficiencies.map((prof, i) =>
        i === index ? { ...prof, rank } : prof
      ),
    });
  }

  function setCustomProficiencyType(index: number, type: "weapon" | "armor") {
    update({
      customProficiencies: customProficiencies.map((prof, i) =>
        i === index ? { ...prof, type } : prof
      ),
    });
  }

  return (
    <div className="space-y-5">
      <p className="text-sm text-muted-foreground">
        Pick {freePicks} trained skill{freePicks === 1 ? "" : "s"}. Additional Lore/custom skills
        count as picks when set to Trained or higher. Skills locked-on come from your class
        {state.className ? ` (${state.className})` : ""}
        {bgSkill ? ` and background (${bgSkill})` : ""}.
      </p>

      <div className="rounded-lg border border-border bg-muted/30 p-3 flex items-center justify-between text-sm">
        <span>
          <span className="font-semibold">{usedPicks}</span> of{" "}
          <span className="font-semibold">{freePicks}</span> free picks used
          {state.classId && (
            <span className="text-xs text-muted-foreground ml-2">
              ({state.classTrainedCount} class + {intMod(abilities.int)} INT mod)
            </span>
          )}
          {additionalPicked.length > 0 && (
            <span className="text-xs text-muted-foreground ml-2">
              ({standardPicked.length} standard + {additionalPicked.length} additional)
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

        <div className="grid grid-cols-1 gap-2 mb-3 sm:grid-cols-[1fr_10rem_auto]">
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
          <select
            value={newSkillRank}
            onChange={(e) => setNewSkillRank(parseInt(e.target.value, 10))}
            className="input text-sm"
            aria-label="Additional skill rank"
          >
            <option value={2}>Trained</option>
            <option value={4}>Expert</option>
            <option value={6}>Master</option>
            <option value={8}>Legendary</option>
          </select>
          <button
            type="button"
            onClick={addAdditional}
            disabled={!newSkillName.trim() || (newSkillRank >= 2 && remaining <= 0)}
            className="btn-outline px-3 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Plus size={14} />
          </button>
        </div>
        {newSkillName.trim() && (
          <p className="mb-3 text-xs text-muted-foreground">
            Adding <span className="font-semibold text-foreground">{newSkillName.trim()}</span> as{" "}
            <span className="font-semibold text-foreground">{rankLabel(newSkillRank)}</span> will
            use 1 free pick.
          </p>
        )}

        {additionalSkills.length > 0 ? (
          <div className="space-y-2">
            {additionalSkills.map((s, i) => (
              <div
                key={`${s.name}-${i}`}
                className="grid grid-cols-[auto_1fr_auto] gap-2 rounded-md border border-border bg-card p-2 sm:grid-cols-[auto_minmax(14rem,1fr)_10rem_auto] sm:items-end"
              >
                <CheckCircle2 size={14} className="mt-8 shrink-0 text-primary sm:mt-0 sm:mb-3" />
                <label className="col-span-2 block min-w-0 sm:col-span-1">
                  <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Skill
                  </span>
                  <input
                    type="text"
                    value={s.name}
                    onChange={(e) => setAdditionalName(i, e.target.value)}
                    placeholder="Skill name, e.g. Underworld Lore"
                    className="input text-sm"
                    aria-label={`Additional skill ${i + 1} name`}
                  />
                </label>
                <label className="col-span-2 block sm:col-span-1">
                  <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Rank
                  </span>
                  <select
                    value={s.rank}
                    onChange={(e) => setAdditionalRank(i, parseInt(e.target.value))}
                    className="input text-xs py-2"
                    aria-label={`Additional skill ${i + 1} rank`}
                  >
                    <option value={2}>Trained</option>
                    <option value={4}>Expert</option>
                    <option value={6}>Master</option>
                    <option value={8}>Legendary</option>
                  </select>
                </label>
                <button
                  type="button"
                  onClick={() => removeAdditional(i)}
                  className="col-start-3 row-start-1 self-start p-1 text-muted-foreground hover:text-destructive sm:col-start-auto sm:row-start-auto sm:mb-2 sm:self-end"
                  aria-label={`Remove ${s.name}`}
                >
                  <X size={14} />
                </button>
                <span className="col-span-full ml-6 text-xs text-muted-foreground sm:hidden">
                  Current rank: {rankLabel(s.rank)}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="rounded-md border border-dashed border-border p-3 text-xs text-muted-foreground">
            No additional skills added yet.
          </p>
        )}
      </section>

      <section>
        <h3 className="text-sm font-semibold mb-1">Weapon & armor proficiencies</h3>
        <p className="text-xs text-muted-foreground mb-3">
          Add specific weapon or armor training from ancestry feats, deity favored weapons,
          archetypes, class features, or campaign options.
        </p>

        <div className="grid grid-cols-1 gap-2 mb-3 sm:grid-cols-[8rem_1fr_10rem_auto]">
          <select
            value={newProficiencyType}
            onChange={(e) => setNewProficiencyType(e.target.value as "weapon" | "armor")}
            className="input text-sm"
            aria-label="Custom proficiency type"
          >
            <option value="weapon">Weapon</option>
            <option value="armor">Armor</option>
          </select>
          <input
            type="text"
            placeholder={
              newProficiencyType === "weapon"
                ? "e.g. Longsword, deity favored weapon"
                : "e.g. Hellknight plate, ancestral armor"
            }
            className="input flex-1 text-sm"
            value={newProficiencyName}
            onChange={(e) => setNewProficiencyName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addCustomProficiency();
              }
            }}
          />
          <select
            value={newProficiencyRank}
            onChange={(e) => setNewProficiencyRank(parseInt(e.target.value, 10))}
            className="input text-sm"
            aria-label="Custom proficiency rank"
          >
            <option value={2}>Trained</option>
            <option value={4}>Expert</option>
            <option value={6}>Master</option>
            <option value={8}>Legendary</option>
          </select>
          <button
            type="button"
            onClick={addCustomProficiency}
            disabled={!newProficiencyName.trim()}
            className="btn-outline px-3 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Plus size={14} />
          </button>
        </div>

        {customProficiencies.length > 0 ? (
          <div className="space-y-2">
            {customProficiencies.map((prof, i) => (
              <div
                key={`${prof.type}-${prof.name}-${i}`}
                className="grid grid-cols-[auto_1fr_auto] gap-2 rounded-md border border-border bg-card p-2 sm:grid-cols-[auto_8rem_minmax(14rem,1fr)_10rem_auto] sm:items-end"
              >
                <CheckCircle2 size={14} className="mt-8 shrink-0 text-primary sm:mt-0 sm:mb-3" />
                <label className="col-span-2 block sm:col-span-1">
                  <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Type
                  </span>
                  <select
                    value={prof.type}
                    onChange={(e) =>
                      setCustomProficiencyType(i, e.target.value as "weapon" | "armor")
                    }
                    className="input text-sm"
                    aria-label={`Custom proficiency ${i + 1} type`}
                  >
                    <option value="weapon">Weapon</option>
                    <option value="armor">Armor</option>
                  </select>
                </label>
                <label className="col-span-2 block min-w-0 sm:col-span-1">
                  <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Name
                  </span>
                  <input
                    type="text"
                    value={prof.name}
                    onChange={(e) => setCustomProficiencyName(i, e.target.value)}
                    placeholder="Specific weapon or armor"
                    className="input text-sm"
                    aria-label={`Custom proficiency ${i + 1} name`}
                  />
                </label>
                <label className="col-span-2 block sm:col-span-1">
                  <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Rank
                  </span>
                  <select
                    value={prof.rank}
                    onChange={(e) => setCustomProficiencyRank(i, parseInt(e.target.value, 10))}
                    className="input text-xs py-2"
                    aria-label={`Custom proficiency ${i + 1} rank`}
                  >
                    <option value={2}>Trained</option>
                    <option value={4}>Expert</option>
                    <option value={6}>Master</option>
                    <option value={8}>Legendary</option>
                  </select>
                </label>
                <button
                  type="button"
                  onClick={() => removeCustomProficiency(i)}
                  className="col-start-3 row-start-1 self-start p-1 text-muted-foreground hover:text-destructive sm:col-start-auto sm:row-start-auto sm:mb-2 sm:self-end"
                  aria-label={`Remove ${prof.name}`}
                >
                  <X size={14} />
                </button>
                <span className="col-span-full ml-6 text-xs text-muted-foreground sm:hidden">
                  Current rank: {rankLabel(prof.rank)}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="rounded-md border border-dashed border-border p-3 text-xs text-muted-foreground">
            No specific weapon or armor proficiencies added yet.
          </p>
        )}
      </section>
    </div>
  );
}
