"use client";

import type { ReactNode } from "react";
import type { StepProps } from "../types";

const PERSONALITY_FIELDS: {
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

export function DescriptionStep({ state, update }: StepProps) {
  return (
    <div className="space-y-7">
      <p className="text-sm text-muted-foreground">
        Physical details and roleplay notes live together here. None are required, so fill in as
        much as you want for the sheet&apos;s description and personality panels.
      </p>

      <section className="space-y-4">
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Physical Description
          </h3>
          <p className="text-xs text-muted-foreground mt-1">
            Appearance, portrait, and notable visual details.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <Field label="Height" placeholder="5'8&quot;">
            <input
              className="input w-full"
              type="text"
              value={state.height}
              onChange={(e) => update({ height: e.target.value })}
            />
          </Field>
          <Field label="Weight" placeholder="160 lb">
            <input
              className="input w-full"
              type="text"
              value={state.weight}
              onChange={(e) => update({ weight: e.target.value })}
            />
          </Field>
          <Field label="Eyes" placeholder="Hazel">
            <input
              className="input w-full"
              type="text"
              value={state.eyes}
              onChange={(e) => update({ eyes: e.target.value })}
            />
          </Field>
          <Field label="Hair" placeholder="Black, braided">
            <input
              className="input w-full"
              type="text"
              value={state.hair}
              onChange={(e) => update({ hair: e.target.value })}
            />
          </Field>
          <Field label="Skin" placeholder="Olive">
            <input
              className="input w-full"
              type="text"
              value={state.skin}
              onChange={(e) => update({ skin: e.target.value })}
            />
          </Field>
          <Field label="Portrait URL" placeholder="https://...">
            <input
              className="input w-full"
              type="url"
              value={state.portraitUrl}
              onChange={(e) => update({ portraitUrl: e.target.value })}
            />
          </Field>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Distinguishing features</label>
          <textarea
            className="input w-full min-h-[100px] resize-y"
            placeholder="Scar across the left brow, missing two fingers on the right hand, eyes that briefly glow in moonlight..."
            value={state.distinguishingFeatures}
            onChange={(e) => update({ distinguishingFeatures: e.target.value })}
          />
        </div>

        {state.portraitUrl && (
          <div className="card p-3 bg-muted/30">
            <p className="text-xs text-muted-foreground mb-2">Portrait preview</p>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={state.portraitUrl}
              alt="Portrait preview"
              className="rounded-md max-h-48 object-contain border border-border bg-background"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).style.display = "none";
              }}
            />
          </div>
        )}
      </section>

      <section className="space-y-4 border-t border-border pt-6">
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Personality
          </h3>
          <p className="text-xs text-muted-foreground mt-1">
            Roleplay prompts, goals, flaws, and backstory.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {PERSONALITY_FIELDS.map(({ key, label, placeholder }) => (
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
      </section>
    </div>
  );
}

function Field({
  label,
  placeholder,
  children,
}: {
  label: string;
  placeholder?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1">
        {label} <span className="text-xs text-muted-foreground font-normal">(optional)</span>
      </label>
      {children}
      {placeholder && <p className="sr-only">Placeholder: {placeholder}</p>}
    </div>
  );
}
