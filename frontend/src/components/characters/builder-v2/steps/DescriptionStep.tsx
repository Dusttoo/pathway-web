"use client";

import type { StepProps } from "../types";

export function DescriptionStep({ state, update }: StepProps) {
  return (
    <div className="space-y-5">
      <p className="text-sm text-muted-foreground">
        Physical details. None are required — fill in as much as you want for the sheet&apos;s
        Description panel.
      </p>

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
        <Field label="Portrait URL" placeholder="https://…">
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
          placeholder="Scar across the left brow, missing two fingers on the right hand, eyes that briefly glow in moonlight…"
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
  children: React.ReactNode;
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
