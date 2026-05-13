"use client";

import { PawPrint, Bird, Bot, Sparkles } from "lucide-react";
import type { StepProps, BuilderState } from "../types";

type CompanionType = BuilderState["companionType"];

const COMPANION_OPTIONS: {
  value: NonNullable<Exclude<CompanionType, "">>;
  label: string;
  description: string;
  icon: typeof PawPrint;
  subtypePlaceholder: string;
}[] = [
  {
    value: "animal",
    label: "Animal Companion",
    description:
      "A non-magical mount or partner. Druids, Rangers, and Cavaliers grant one by default.",
    icon: PawPrint,
    subtypePlaceholder: "e.g. Wolf, Riding Pony, Snapping Turtle",
  },
  {
    value: "familiar",
    label: "Familiar",
    description: "A small magical creature granted by Wizard, Witch, and similar features.",
    icon: Bird,
    subtypePlaceholder: "e.g. Cat, Raven, Spider",
  },
  {
    value: "construct",
    label: "Construct / Innovation",
    description: "An Inventor's innovation, an animated guardian, or similar built companion.",
    icon: Bot,
    subtypePlaceholder: "e.g. Pistol, Armor, Robotic Companion",
  },
  {
    value: "eidolon",
    label: "Eidolon",
    description: "A Summoner's bound extraplanar partner.",
    icon: Sparkles,
    subtypePlaceholder: "e.g. Angel, Beast, Plant",
  },
];

export function CompanionStep({ state, update }: StepProps) {
  function pick(value: (typeof COMPANION_OPTIONS)[number]["value"]) {
    update({ companionType: state.companionType === value ? "" : value });
  }

  return (
    <div className="space-y-5">
      <p className="text-sm text-muted-foreground">
        Your class grants a companion. Pick a type below and give it a name; the bot tracks the
        companion separately once the character is in play.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {COMPANION_OPTIONS.map((opt) => {
          const selected = state.companionType === opt.value;
          const Icon = opt.icon;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => pick(opt.value)}
              className={`text-left p-4 rounded-lg border-2 transition-all flex gap-3
                ${
                  selected
                    ? "border-primary bg-primary/5 shadow-md shadow-primary/10"
                    : "border-border hover:border-primary/40 hover:bg-muted/40"
                }`}
            >
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                  selected ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"
                }`}
              >
                <Icon size={20} />
              </div>
              <div>
                <h3 className="font-semibold mb-1">{opt.label}</h3>
                <p className="text-xs text-muted-foreground">{opt.description}</p>
              </div>
            </button>
          );
        })}
      </div>

      {state.companionType && (
        <div className="card p-4 space-y-3 bg-muted/30">
          <div>
            <label className="block text-sm font-medium mb-1">Companion name</label>
            <input
              className="input w-full"
              type="text"
              placeholder="e.g. Shadow, Whisper, Pebble"
              value={state.companionName}
              onChange={(e) => update({ companionName: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Subtype / species</label>
            <input
              className="input w-full"
              type="text"
              placeholder={
                COMPANION_OPTIONS.find((o) => o.value === state.companionType)?.subtypePlaceholder
              }
              value={state.companionSubtype}
              onChange={(e) => update({ companionSubtype: e.target.value })}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Free-text for now. A future iteration will offer Nethys-backed companion stat blocks.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
