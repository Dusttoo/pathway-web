"use client";

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

export function AbilitySkillStep({ state, update, onNext, onBack }: StepProps) {
  const { classInitialProfs, classTrainedCount, trainedSkills, abilities } = state;

  // Skills already trained by the class (rank >= 2 from initial_proficiencies)
  const classTrainedSkills = new Set(
    SKILL_LIST.filter((s) => (classInitialProfs[s.key] ?? 0) >= 2).map((s) => s.key),
  );

  // Skills the user has explicitly selected (beyond class-granted)
  const userSelected = new Set(trainedSkills.filter((s) => !classTrainedSkills.has(s)));
  const remaining    = classTrainedCount - userSelected.size;

  function toggleSkill(key: string) {
    if (classTrainedSkills.has(key)) return; // class-granted, immutable
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
          Class-granted skills are pre-selected. Choose {classTrainedCount} additional skill{classTrainedCount !== 1 ? "s" : ""} to train.
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-1">
          {SKILL_LIST.map(({ key, label }) => {
            const fromClass = classTrainedSkills.has(key);
            const checked   = fromClass || trainedSkills.includes(key);
            return (
              <button
                key={key}
                type="button"
                onClick={() => toggleSkill(key)}
                disabled={fromClass || (!checked && remaining <= 0)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm text-left transition-colors ${
                  fromClass
                    ? "bg-primary/10 text-primary cursor-default"
                    : checked
                      ? "bg-primary text-primary-foreground"
                      : remaining > 0
                        ? "bg-muted hover:bg-muted/70 text-foreground"
                        : "bg-muted text-muted-foreground/50 cursor-not-allowed"
                }`}
              >
                <span className="flex-1">{label}</span>
                {fromClass && (
                  <span className="text-[10px] opacity-70 shrink-0">class</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex justify-between pt-2">
        <button type="button" onClick={onBack} className="btn-outline px-6">← Back</button>
        <button type="button" onClick={onNext} className="btn-primary px-6">Next →</button>
      </div>
    </div>
  );
}
