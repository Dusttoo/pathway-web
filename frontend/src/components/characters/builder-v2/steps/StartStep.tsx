"use client";

import { ChevronDown } from "lucide-react";
import type { StepProps } from "../types";
import { OptionsStep } from "./OptionsStep";
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
  const { state, update } = props;

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

      <section className="space-y-4 border-t border-border pt-6">
        <div>
          <h3 className="text-lg font-semibold">Options</h3>
          <p className="text-sm text-muted-foreground">
            Choose optional rules now so later character choices reflect the right table setup.
          </p>
        </div>
        <OptionsStep {...props} />
      </section>
    </div>
  );
}
