"use client";

import type { StepProps } from "../types";

const FIELDS: {
  key: "personalityTraits" | "ideals" | "bonds" | "flaws";
  label: string;
  placeholder: string;
}[] = [
  {
    key: "personalityTraits",
    label: "Personality Traits",
    placeholder:
      "e.g. Quick to anger but quicker to forgive. Always speaks softly around children.",
  },
  {
    key: "ideals",
    label: "Ideals",
    placeholder: "What drives you. e.g. Knowledge: there is always more to learn.",
  },
  {
    key: "bonds",
    label: "Bonds",
    placeholder: "People, places, or oaths you'd die for. e.g. My twin sister, lost in the war.",
  },
  {
    key: "flaws",
    label: "Flaws",
    placeholder: "Where you fall short. e.g. Cannot resist a good wager.",
  },
];

export function PersonalityStep({ state, update }: StepProps) {
  return (
    <div className="space-y-5">
      <p className="text-sm text-muted-foreground">
        Who is your character beyond the stat block? Use the prompts below or skip the lot — they
        live on the sheet for your table to read.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {FIELDS.map(({ key, label, placeholder }) => (
          <div key={key}>
            <label className="block text-sm font-medium mb-1">{label}</label>
            <textarea
              className="input w-full min-h-[80px] resize-y text-sm"
              placeholder={placeholder}
              value={state[key]}
              onChange={(e) => update({ [key]: e.target.value })}
            />
          </div>
        ))}
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">
          Backstory <span className="text-xs text-muted-foreground font-normal">(optional)</span>
        </label>
        <textarea
          className="input w-full min-h-[160px] resize-y text-sm"
          placeholder="A few paragraphs of where your character came from, what they want, and what's at stake."
          value={state.backstory}
          onChange={(e) => update({ backstory: e.target.value })}
        />
        <p className="text-xs text-muted-foreground mt-1">
          {state.backstory.length} character{state.backstory.length === 1 ? "" : "s"}
        </p>
      </div>
    </div>
  );
}
