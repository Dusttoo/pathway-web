"use client";

import { useMemo, useState } from "react";
import { Check, Languages, Plus, RotateCcw, X } from "lucide-react";
import type { StepProps } from "../types";

const COMMON_LANGUAGES = [
  "Common",
  "Draconic",
  "Dwarven",
  "Elven",
  "Fey",
  "Gnomish",
  "Goblin",
  "Halfling",
  "Jotun",
  "Orcish",
  "Sakvroth",
  "Aklo",
  "Chthonian",
  "Diabolic",
  "Empyrean",
  "Necril",
  "Petran",
  "Pyric",
  "Sussuran",
  "Thalassic",
  "Wildsong",
];

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

function uniqueSorted(values: string[]): string[] {
  const byKey = new Map<string, string>();
  for (const value of values) {
    const trimmed = value.trim();
    if (!trimmed) continue;
    const key = normalize(trimmed);
    if (!byKey.has(key)) byKey.set(key, trimmed);
  }
  return [...byKey.values()].sort((a, b) => a.localeCompare(b));
}

function abilityMod(score: number): number {
  return Math.floor((score - 10) / 2);
}

export function LanguagesStep({ state, update }: StepProps) {
  const [customLanguage, setCustomLanguage] = useState("");
  const selected = useMemo(() => uniqueSorted(state.languages), [state.languages]);
  const selectedKeys = useMemo(() => new Set(selected.map(normalize)), [selected]);
  const languageOptions = useMemo(
    () => uniqueSorted([...COMMON_LANGUAGES, ...state.defaultLanguages, ...selected]),
    [selected, state.defaultLanguages]
  );
  const intelligenceBonus = Math.max(0, abilityMod(state.abilities.int));
  const bonusSlots = state.ancestryBonusLanguages + intelligenceBonus;
  const extraSelected = Math.max(0, selected.length - state.defaultLanguages.length);

  function setLanguages(next: string[]) {
    update({ languages: uniqueSorted(next) });
  }

  function toggle(language: string) {
    if (selectedKeys.has(normalize(language))) {
      setLanguages(selected.filter((value) => normalize(value) !== normalize(language)));
    } else {
      setLanguages([...selected, language]);
    }
  }

  function addCustom() {
    const language = customLanguage.trim();
    if (!language) return;
    setLanguages([...selected, language]);
    setCustomLanguage("");
  }

  return (
    <div className="space-y-5">
      <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-2">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Languages size={18} className="text-primary" />
          Languages
        </h3>
        <p className="text-sm text-muted-foreground">
          Start with the languages granted by your ancestry, then add any bonus, background, class,
          or campaign languages your table allows.
        </p>
        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
          <span className="rounded bg-background px-2 py-1">
            Ancestry defaults:{" "}
            <strong className="text-foreground">
              {state.defaultLanguages.length ? state.defaultLanguages.join(", ") : "none"}
            </strong>
          </span>
          <span className="rounded bg-background px-2 py-1">
            Bonus language slots:{" "}
            <strong className="text-foreground">{state.ancestryBonusLanguages}</strong>
          </span>
          <span className="rounded bg-background px-2 py-1">
            INT bonus: <strong className="text-foreground">+{intelligenceBonus}</strong>
          </span>
          <span className="rounded bg-background px-2 py-1">
            Suggested extra picks:{" "}
            <strong className="text-foreground">
              {extraSelected} / {bonusSlots}
            </strong>
          </span>
        </div>
      </div>

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h4 className="text-sm font-semibold">Select known languages</h4>
            <p className="text-xs text-muted-foreground">
              Use the chips below, or add a custom language if your campaign needs one.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setLanguages(state.defaultLanguages)}
            className="btn-outline px-3 py-1.5 text-xs flex items-center gap-1"
          >
            <RotateCcw size={12} />
            Reset
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          {languageOptions.map((language) => {
            const active = selectedKeys.has(normalize(language));
            return (
              <button
                key={language}
                type="button"
                onClick={() => toggle(language)}
                className={`rounded-full border px-3 py-1.5 text-sm transition-colors inline-flex items-center gap-1.5 ${
                  active
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-muted/30 text-muted-foreground hover:border-primary/40"
                }`}
              >
                {active && <Check size={12} />}
                {language}
              </button>
            );
          })}
        </div>
      </section>

      <section className="grid gap-2 sm:grid-cols-[1fr_auto]">
        <input
          type="text"
          className="input w-full"
          placeholder="Add custom language, e.g. Riedran, Daelkyr, Thieves' Cant"
          value={customLanguage}
          onChange={(event) => setCustomLanguage(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              addCustom();
            }
          }}
        />
        <button
          type="button"
          onClick={addCustom}
          disabled={!customLanguage.trim()}
          className="btn-primary px-4 flex items-center justify-center gap-2 disabled:opacity-40"
        >
          <Plus size={15} />
          Add
        </button>
      </section>

      <section className="rounded-lg border border-border p-3">
        <h4 className="text-sm font-semibold mb-2">Selected languages ({selected.length})</h4>
        {selected.length ? (
          <div className="flex flex-wrap gap-2">
            {selected.map((language) => (
              <span
                key={language}
                className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-xs"
              >
                {language}
                <button
                  type="button"
                  onClick={() => toggle(language)}
                  className="text-muted-foreground hover:text-destructive"
                  aria-label={`Remove ${language}`}
                >
                  <X size={11} />
                </button>
              </span>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No languages selected yet.</p>
        )}
      </section>
    </div>
  );
}
