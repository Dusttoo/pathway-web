"use client";

import { Plus, Trash2 } from "lucide-react";
import type { StepProps } from "./types";

type Ability = "str" | "dex" | "con" | "int" | "wis" | "cha";

const ABILITIES: { key: Ability; label: string }[] = [
  { key: "str", label: "STR" },
  { key: "dex", label: "DEX" },
  { key: "con", label: "CON" },
  { key: "int", label: "INT" },
  { key: "wis", label: "WIS" },
  { key: "cha", label: "CHA" },
];

const SKILL_LIST: { key: string; label: string }[] = [
  { key: "acrobatics",   label: "Acrobatics"   },
  { key: "arcana",       label: "Arcana"        },
  { key: "athletics",    label: "Athletics"     },
  { key: "crafting",     label: "Crafting"      },
  { key: "deception",    label: "Deception"     },
  { key: "diplomacy",    label: "Diplomacy"     },
  { key: "intimidation", label: "Intimidation"  },
  { key: "medicine",     label: "Medicine"      },
  { key: "nature",       label: "Nature"        },
  { key: "occultism",    label: "Occultism"     },
  { key: "performance",  label: "Performance"   },
  { key: "religion",     label: "Religion"      },
  { key: "society",      label: "Society"       },
  { key: "stealth",      label: "Stealth"       },
  { key: "survival",     label: "Survival"      },
  { key: "thievery",     label: "Thievery"      },
];

function abilityMod(score: number) {
  const mod = Math.floor((score - 10) / 2);
  return mod >= 0 ? `+${mod}` : `${mod}`;
}

function abilityName(key: Ability): string {
  return ABILITIES.find((ability) => ability.key === key)?.label ?? key.toUpperCase();
}

export function AbilitySkillStep({ state, update, onNext, onBack }: StepProps) {
  const {
    classInitialProfs,
    classTrainedCount,
    backgroundTrainedSkill,
    trainedSkills,
    abilities,
    additionalSkills,
    customFeats,
    customSpecials,
    customAttacks,
    level,
  } = state;

  // Skills auto-granted by the class (rank >= 2 in initial_proficiencies)
  const classGrantedSkills = new Set(
    SKILL_LIST.filter((s) => (classInitialProfs[s.key] ?? 0) >= 2).map((s) => s.key),
  );

  // Background-granted skill (rank 2, also locked)
  const bgSkill = backgroundTrainedSkill.toLowerCase();

  // All locked skills (cannot be toggled by user)
  const lockedSkills = new Set([...classGrantedSkills, ...(bgSkill ? [bgSkill] : [])]);

  // INT modifier adds to the free-pick budget
  const intMod      = Math.floor((abilities.int - 10) / 2);
  const freePicks   = Math.max(0, classTrainedCount + intMod);

  // User-selected = checked but not locked
  const userSelected = new Set(trainedSkills.filter((s) => !lockedSkills.has(s)));
  const remaining    = freePicks - userSelected.size;

  function toggleSkill(key: string) {
    if (lockedSkills.has(key)) return; // class/background-granted, immutable
    if (trainedSkills.includes(key)) {
      update({ trainedSkills: trainedSkills.filter((s) => s !== key) });
    } else if (remaining > 0) {
      update({ trainedSkills: [...trainedSkills, key] });
    }
  }

  function setAbility(key: Ability, raw: string) {
    const val = Math.max(8, Math.min(20, parseInt(raw) || 10));
    update({ abilities: { ...abilities, [key]: val } });
  }

  function toggleAncestryBoost(key: Ability) {
    const selected = state.selectedAncestryBoosts.includes(key);
    if (selected) {
      update({ selectedAncestryBoosts: state.selectedAncestryBoosts.filter((item) => item !== key) });
    } else if (state.selectedAncestryBoosts.length < 2) {
      update({ selectedAncestryBoosts: [...state.selectedAncestryBoosts, key] });
    }
  }

  function applyAncestryBoosts() {
    const boosts =
      state.ancestryBoostMode === "printed"
        ? [...state.printedAncestryBoosts, ...state.selectedAncestryBoosts]
        : state.selectedAncestryBoosts;
    const flaws = state.ancestryBoostMode === "printed" ? state.selectedAncestryFlaws : [];
    const next = { ...abilities };
    for (const boost of boosts) next[boost] = Math.min(20, next[boost] + 2);
    for (const flaw of flaws) next[flaw] = Math.max(8, next[flaw] - 2);
    update({ abilities: next });
  }

  function updateAdditionalSkill(index: number, patch: Partial<{ name: string; rank: number }>) {
    update({
      additionalSkills: additionalSkills.map((skill, i) =>
        i === index ? { ...skill, ...patch } : skill
      ),
    });
  }

  function updateCustomFeat(index: number, patch: Partial<{ name: string; featType: string; level: number }>) {
    update({
      customFeats: customFeats.map((feat, i) =>
        i === index ? { ...feat, ...patch } : feat
      ),
    });
  }

  function updateCustomAttack(index: number, patch: Partial<{ name: string; bonus: string; damage: string; traits: string }>) {
    update({
      customAttacks: customAttacks.map((attack, i) =>
        i === index ? { ...attack, ...patch } : attack
      ),
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold mb-1">Ability Scores & Skills</h2>
        <p className="text-sm text-muted-foreground">
          Enter your final scores after applying all ancestry, background, and class boosts.
        </p>
      </div>

      {/* Ability scores */}
      <div>
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Ability Scores</h3>
        <div className="mb-3 rounded-lg border border-border bg-muted/20 p-3 space-y-3">
          <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="text-sm font-semibold">Ancestry Ability Boosts</p>
              <p className="text-xs text-muted-foreground">
                Printed boosts: {state.printedAncestryBoosts.length ? state.printedAncestryBoosts.map(abilityName).join(", ") : "None recorded"}.
                {" "}Printed flaws: {state.printedAncestryFlaws.length ? state.printedAncestryFlaws.map(abilityName).join(", ") : "None"}.
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => update({ ancestryBoostMode: "remaster", selectedAncestryBoosts: [], selectedAncestryFlaws: [] })}
                className={`px-3 py-1 rounded-md text-xs ${state.ancestryBoostMode === "remaster" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
              >
                Remaster 2 Free
              </button>
              <button
                type="button"
                onClick={() => update({ ancestryBoostMode: "printed", selectedAncestryBoosts: [], selectedAncestryFlaws: state.printedAncestryFlaws })}
                className={`px-3 py-1 rounded-md text-xs ${state.ancestryBoostMode === "printed" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
              >
                Printed
              </button>
            </div>
          </div>
          {state.ancestryBoostMode === "remaster" && (
            <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
              {ABILITIES.map(({ key, label }) => {
                const active = state.selectedAncestryBoosts.includes(key);
                const disabled = !active && state.selectedAncestryBoosts.length >= 2;
                return (
                  <button
                    key={key}
                    type="button"
                    disabled={disabled}
                    onClick={() => toggleAncestryBoost(key)}
                    className={`rounded-md px-3 py-2 text-sm font-mono ${
                      active
                        ? "bg-primary text-primary-foreground"
                        : disabled
                          ? "bg-muted text-muted-foreground/40"
                          : "bg-muted text-muted-foreground hover:bg-muted/70"
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          )}
          <button
            type="button"
            onClick={applyAncestryBoosts}
            disabled={state.ancestryBoostMode === "remaster" && state.selectedAncestryBoosts.length !== 2}
            className="btn-outline text-sm disabled:opacity-50"
          >
            Apply ancestry boosts to current scores
          </button>
        </div>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
          {ABILITIES.map(({ key, label }) => (
            <div key={key} className="flex flex-col items-center gap-1">
              <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">
                {label}
              </label>
              <input
                className="input w-full text-center font-mono text-lg py-2"
                type="number"
                min={8}
                max={20}
                value={abilities[key]}
                onChange={(e) => setAbility(key, e.target.value)}
              />
              <span className="text-sm font-bold tabular-nums text-primary">
                {abilityMod(abilities[key])}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Skill training */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Skill Training</h3>
          <span className={`text-xs px-2 py-0.5 rounded-full ${remaining > 0 ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
            {remaining > 0 ? `${remaining} pick${remaining !== 1 ? "s" : ""} remaining` : "All skills selected"}
          </span>
        </div>
        <p className="text-xs text-muted-foreground mb-3">
          Class- and background-granted skills are pre-selected.
          Choose <strong>{freePicks}</strong> free skill{freePicks !== 1 ? "s" : ""} to train
          {intMod !== 0 && (
            <span className="text-muted-foreground"> (class base {classTrainedCount} {intMod > 0 ? "+" : "−"} INT {Math.abs(intMod)})</span>
          )}.
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-1">
          {SKILL_LIST.map(({ key, label }) => {
            const fromClass      = classGrantedSkills.has(key);
            const fromBackground = bgSkill === key;
            const isLocked       = fromClass || fromBackground;
            const checked        = isLocked || trainedSkills.includes(key);
            const badge          = fromClass ? "class" : fromBackground ? "bg" : null;
            return (
              <button
                key={key}
                type="button"
                onClick={() => toggleSkill(key)}
                disabled={isLocked || (!checked && remaining <= 0)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm text-left transition-colors ${
                  isLocked
                    ? "bg-primary/10 text-primary cursor-default"
                    : checked
                      ? "bg-primary text-primary-foreground"
                      : remaining > 0
                        ? "bg-muted hover:bg-muted/70 text-foreground"
                        : "bg-muted text-muted-foreground/50 cursor-not-allowed"
                }`}
              >
                <span className="flex-1">{label}</span>
                {badge && (
                  <span className="text-[10px] opacity-70 shrink-0">{badge}</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Additional skill proficiencies */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Additional Skills</h3>
            <p className="text-xs text-muted-foreground mt-1">
              Add unlimited homebrew, lore, campaign, or vehicle skills beyond the class picks above.
            </p>
          </div>
          <button
            type="button"
            onClick={() => update({ additionalSkills: [...additionalSkills, { name: "", rank: 2 }] })}
            className="btn-outline text-sm flex items-center gap-1.5"
          >
            <Plus size={14} />
            Add Skill
          </button>
        </div>

        {additionalSkills.length > 0 && (
          <div className="space-y-2">
            {additionalSkills.map((skill, index) => (
              <div key={index} className="grid grid-cols-[1fr_150px_auto] gap-2 items-center">
                <input
                  className="input text-sm"
                  value={skill.name}
                  onChange={(e) => updateAdditionalSkill(index, { name: e.target.value })}
                  placeholder="e.g. Airship Lore, Piloting, Dragonmark Lore"
                />
                <select
                  className="input text-sm"
                  value={skill.rank}
                  onChange={(e) => updateAdditionalSkill(index, { rank: Number(e.target.value) })}
                >
                  <option value={2}>Trained</option>
                  <option value={3}>Expert</option>
                  <option value={4}>Master</option>
                  <option value={5}>Legendary</option>
                </select>
                <button
                  type="button"
                  onClick={() => update({ additionalSkills: additionalSkills.filter((_, i) => i !== index) })}
                  className="p-2 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                  title="Remove skill"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Custom feats */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Custom Feats</h3>
            <p className="text-xs text-muted-foreground mt-1">
              Add unlimited homebrew ancestry, class, skill, general, or campaign feats.
            </p>
          </div>
          <button
            type="button"
            onClick={() => update({ customFeats: [...customFeats, { name: "", featType: "Ancestry", level }] })}
            className="btn-outline text-sm flex items-center gap-1.5"
          >
            <Plus size={14} />
            Add Feat
          </button>
        </div>

        {customFeats.length > 0 && (
          <div className="space-y-2">
            {customFeats.map((feat, index) => (
              <div key={index} className="grid grid-cols-[1fr_150px_100px_auto] gap-2 items-center">
                <input
                  className="input text-sm"
                  value={feat.name}
                  onChange={(e) => updateCustomFeat(index, { name: e.target.value })}
                  placeholder="e.g. Stormmarked Cantrip"
                />
                <select
                  className="input text-sm"
                  value={feat.featType}
                  onChange={(e) => updateCustomFeat(index, { featType: e.target.value })}
                >
                  {["Ancestry", "Class", "Skill", "General", "Archetype", "Other"].map((type) => (
                    <option key={type}>{type}</option>
                  ))}
                </select>
                <input
                  className="input text-sm"
                  type="number"
                  min={1}
                  value={feat.level}
                  onChange={(e) => updateCustomFeat(index, { level: Math.max(1, Number(e.target.value) || 1) })}
                  aria-label="Feat level"
                />
                <button
                  type="button"
                  onClick={() => update({ customFeats: customFeats.filter((_, i) => i !== index) })}
                  className="p-2 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                  title="Remove feat"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Special abilities */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Special Abilities</h3>
            <p className="text-xs text-muted-foreground mt-1">
              Add unlimited custom features, ancestry powers, granted abilities, or other character specials.
            </p>
          </div>
          <button
            type="button"
            onClick={() => update({ customSpecials: [...customSpecials, ""] })}
            className="btn-outline text-sm flex items-center gap-1.5"
          >
            <Plus size={14} />
            Add Ability
          </button>
        </div>

        {customSpecials.length > 0 && (
          <div className="space-y-2">
            {customSpecials.map((special, index) => (
              <div key={index} className="grid grid-cols-[1fr_auto] gap-2 items-start">
                <textarea
                  className="input text-sm min-h-[70px] resize-y"
                  value={special}
                  onChange={(e) => update({
                    customSpecials: customSpecials.map((item, i) => i === index ? e.target.value : item),
                  })}
                  placeholder="e.g. Storm Sigil: You can feel shifts in nearby weather and elemental pressure."
                />
                <button
                  type="button"
                  onClick={() => update({ customSpecials: customSpecials.filter((_, i) => i !== index) })}
                  className="p-2 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                  title="Remove ability"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Custom attacks */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Custom Attacks</h3>
            <p className="text-xs text-muted-foreground mt-1">
              Add unlimited strikes, spell attacks, special attacks, or campaign-specific attack options.
            </p>
          </div>
          <button
            type="button"
            onClick={() => update({ customAttacks: [...customAttacks, { name: "", bonus: "", damage: "", traits: "" }] })}
            className="btn-outline text-sm flex items-center gap-1.5"
          >
            <Plus size={14} />
            Add Attack
          </button>
        </div>

        {customAttacks.length > 0 && (
          <div className="space-y-3">
            {customAttacks.map((attack, index) => (
              <div key={index} className="border border-border rounded-lg p-3 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Attack {index + 1}</span>
                  <button
                    type="button"
                    onClick={() => update({ customAttacks: customAttacks.filter((_, i) => i !== index) })}
                    className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                    title="Remove attack"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  <input
                    className="input text-sm"
                    value={attack.name}
                    onChange={(e) => updateCustomAttack(index, { name: e.target.value })}
                    placeholder="Name, e.g. Storm Saber"
                  />
                  <input
                    className="input text-sm"
                    value={attack.bonus}
                    onChange={(e) => updateCustomAttack(index, { bonus: e.target.value })}
                    placeholder="Bonus, e.g. +9"
                  />
                  <input
                    className="input text-sm"
                    value={attack.damage}
                    onChange={(e) => updateCustomAttack(index, { damage: e.target.value })}
                    placeholder="Damage, e.g. 1d8+4 slashing"
                  />
                </div>
                <input
                  className="input text-sm"
                  value={attack.traits}
                  onChange={(e) => updateCustomAttack(index, { traits: e.target.value })}
                  placeholder="Traits, e.g. magical, agile, finesse"
                />
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex justify-between pt-2">
        <button type="button" onClick={onBack} className="btn-outline px-6">← Back</button>
        <button type="button" onClick={onNext} className="btn-primary px-6">Next →</button>
      </div>
    </div>
  );
}
