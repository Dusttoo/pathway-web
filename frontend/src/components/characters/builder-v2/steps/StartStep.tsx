"use client";

import { useState } from "react";
import { ChevronDown, Settings2 } from "lucide-react";
import type { StepProps } from "../types";
import { OptionsStep } from "./OptionsStep";
import { Term } from "../glossary";
import { NumberStepper } from "@/components/characters/NumberStepper";

const ALIGNMENTS = [
  { value: "LG", label: "Lawful Good" },
  { value: "LN", label: "Lawful Neutral" },
  { value: "LE", label: "Lawful Evil" },
  { value: "NG", label: "Neutral Good" },
  { value: "N", label: "True Neutral" },
  { value: "NE", label: "Neutral Evil" },
  { value: "CG", label: "Chaotic Good" },
  { value: "CN", label: "Chaotic Neutral" },
  { value: "CE", label: "Chaotic Evil" },
];

export function StartStep(props: StepProps) {
  const { state, update, beginnerMode } = props;
  // In Beginner Mode the variant rules are tucked away and closed by default
  // so a new player isn't confronted with GM-level toggles on screen one.
  const [advancedOpen, setAdvancedOpen] = useState(beginnerMode === false);

  return (
    <div className="space-y-8">
      <section className="space-y-5">
        <p className="text-sm text-muted-foreground">
          The basics of who your character is. You can change any of these later.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-1">
              Character Name <span className="text-destructive">*</span>
            </label>
            <input
              className="input w-full"
              type="text"
              placeholder="e.g. Seraphina Blackwood"
              value={state.name}
              onChange={(e) => update({ name: e.target.value })}
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Level</label>
            <NumberStepper
              className="w-full"
              min={1}
              max={20}
              value={state.level}
              onCommit={(level) => update({ level })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Alignment</label>
            <div className="relative">
              <select
                className="input w-full appearance-none pr-8"
                value={state.alignment}
                onChange={(e) => update({ alignment: e.target.value })}
              >
                {ALIGNMENTS.map((a) => (
                  <option key={a.value} value={a.value}>
                    {a.label} ({a.value})
                  </option>
                ))}
              </select>
              <ChevronDown
                size={14}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Gender <span className="text-xs text-muted-foreground font-normal">(optional)</span>
            </label>
            <input
              className="input w-full"
              type="text"
              placeholder="Not set"
              value={state.gender}
              onChange={(e) => update({ gender: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Age <span className="text-xs text-muted-foreground font-normal">(optional)</span>
            </label>
            <input
              className="input w-full"
              type="text"
              placeholder="Not set"
              value={state.age}
              onChange={(e) => update({ age: e.target.value })}
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-1">
              Deity <span className="text-xs text-muted-foreground font-normal">(optional)</span>
            </label>
            <input
              className="input w-full"
              type="text"
              placeholder="e.g. Sarenrae, Pharasma - leave blank if none"
              value={state.deity}
              onChange={(e) => update({ deity: e.target.value })}
            />
          </div>
        </div>

        {!state.name.trim() && (
          <p className="text-xs text-amber-500/80">A name is required before continuing.</p>
        )}
      </section>

      <section className="border-t border-border pt-6">
        <button
          type="button"
          onClick={() => setAdvancedOpen((open) => !open)}
          className="flex w-full items-center justify-between gap-3 rounded-lg border border-border bg-muted/20 px-4 py-3 text-left"
        >
          <span className="flex items-center gap-2">
            <Settings2 size={16} className="text-muted-foreground" />
            <span>
              <span className="block text-sm font-semibold">Advanced: optional table rules</span>
              <span className="block text-xs text-muted-foreground">
                {beginnerMode
                  ? "Leave these closed unless your Game Master told you to turn one on."
                  : "Free Archetype, Automatic Bonus Progression, Mythic, and more."}
              </span>
            </span>
          </span>
          <ChevronDown
            size={18}
            className={`shrink-0 text-muted-foreground transition-transform ${advancedOpen ? "rotate-180" : ""}`}
          />
        </button>

        {advancedOpen && (
          <div className="mt-4 space-y-4">
            <p className="text-sm text-muted-foreground">
              These are <Term k="variantRules">variant rules</Term> — optional tweaks a GM can
              switch on. Most tables use none of them. Setting them now makes sure later steps
              show the right choices.
            </p>
            <OptionsStep {...props} />
          </div>
        )}
      </section>
    </div>
  );
}
