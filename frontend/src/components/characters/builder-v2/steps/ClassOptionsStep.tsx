"use client";

import { useMemo, useState } from "react";
import { Check, Flame, Loader2, Plus, Search, Sparkles, X } from "lucide-react";
import { useFeats } from "@/lib/hooks/use-feats";
import type { ClassOptions, SelectedFeat, StepProps } from "../types";
import {
  classKey,
  classOptionConfigFor,
  classOptionSpecials,
  type ClassOptionField,
} from "../class-options";
import type { Tables } from "@/lib/types/database.types";
import { AonLink, valueFromMetadata } from "../AonLink";

type Feat = Tables<"feats"> & { aon_url?: string | null };

const KINETICIST_STARTING_IMPULSES = 2;
const KINETICIST_ELEMENTS = ["air", "earth", "fire", "metal", "water", "wood"];

function normalize(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function listValue(value: unknown): string[] {
  if (Array.isArray(value)) return value.flatMap(listValue);
  if (typeof value === "string") {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [];
}

function featTraits(feat: Feat): string[] {
  return listValue(feat.traits).map(normalize);
}

function titleCase(value: string): string {
  return value
    .split(/\s+/)
    .map((word) => (word ? word[0].toUpperCase() + word.slice(1) : word))
    .join(" ");
}

function isImpulse(feat: Feat): boolean {
  const traits = featTraits(feat);
  return traits.includes("impulse") || normalize(feat.name).includes("impulse");
}

function impulseMatchesElements(feat: Feat, elements: string[]): boolean {
  if (elements.length === 0) return true;
  const traits = new Set(featTraits(feat));
  return elements.some((element) => traits.has(normalize(element)));
}

function impulseSlotLabel(feat: Feat | undefined): string {
  if (!feat) return "Impulse Feat";
  const traits = new Set(featTraits(feat));
  const element = KINETICIST_ELEMENTS.find((name) => traits.has(name));
  return element ? `${titleCase(element)} Impulse Feat` : "Impulse Feat";
}

function updateOption(
  options: ClassOptions,
  key: keyof ClassOptions,
  value: string | string[]
): ClassOptions {
  return { ...options, [key]: value };
}

function optionValue(options: ClassOptions, field: ClassOptionField): string | string[] {
  const value = options[field.key];
  return field.multi ? (Array.isArray(value) ? value : []) : typeof value === "string" ? value : "";
}

function selectedImpulseIds(state: StepProps["state"]): Set<string> {
  return new Set(
    state.selectedFeats
      .filter((feat) => feat.feat_slot === "impulse" && feat.level_acquired === 1)
      .map((feat) => feat.feat_id)
  );
}

export function ClassOptionsStep({ state, update }: StepProps) {
  const config = classOptionConfigFor(state.className);
  const isKineticist = classKey(state.className) === "kineticist";
  const [searchQ, setSearchQ] = useState("");

  const kineticElements = state.classOptions.kineticElements ?? [];
  const impulseIds = selectedImpulseIds(state);
  const impulseCount = state.selectedFeats.filter((feat) => feat.feat_slot === "impulse").length;

  const { data: kineticistFeats, isLoading: featsLoading } = useFeats(
    {
      q: searchQ || undefined,
      feat_type: "class_feat",
      class: "Kineticist",
      level_max: 1,
      limit: 100,
    },
    { enabled: isKineticist }
  );

  const impulseFeats = useMemo(() => {
    const feats = kineticistFeats?.data ?? [];
    return feats
      .filter(isImpulse)
      .filter((feat) => impulseMatchesElements(feat, kineticElements))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [kineticElements, kineticistFeats?.data]);

  if (!config) {
    return (
      <div className="space-y-4">
        <div className="rounded-lg border border-border bg-muted/30 p-4">
          <h3 className="font-semibold">No required class setup detected</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {state.className || "This class"} does not currently need a dedicated setup screen.
            Continue to background and abilities.
          </p>
        </div>
        <NotesField state={state} update={update} />
      </div>
    );
  }

  function setOption(key: keyof ClassOptions, value: string | string[]) {
    update({ classOptions: updateOption(state.classOptions, key, value) });
  }

  function toggleMulti(field: ClassOptionField, item: string) {
    const current = optionValue(state.classOptions, field);
    const values = Array.isArray(current) ? current : [];
    const key = normalize(item);
    const exists = values.some((value) => normalize(value) === key);
    const next = exists ? values.filter((value) => normalize(value) !== key) : [...values, item];
    const gate = field.key === "kineticElements" ? state.classOptions.kineticGate : null;
    const maxElements = gate === "dual" ? 2 : gate === "single" ? 1 : 6;
    setOption(field.key, next.slice(0, maxElements));
  }

  function addImpulse(feat: Feat) {
    if (impulseIds.has(feat.id)) return;
    if (impulseCount >= KINETICIST_STARTING_IMPULSES) return;
    const selected: SelectedFeat = {
      feat_id: feat.id,
      feat_name: feat.name,
      feat_slot: "impulse",
      level_acquired: 1,
    };
    update({ selectedFeats: [...state.selectedFeats, selected] });
  }

  function removeImpulse(featId: string) {
    update({
      selectedFeats: state.selectedFeats.filter(
        (feat) => !(feat.feat_slot === "impulse" && feat.feat_id === featId)
      ),
    });
  }

  const selectedImpulseFeats = state.selectedFeats.filter((feat) => feat.feat_slot === "impulse");
  const specials = classOptionSpecials(state);

  return (
    <div className="space-y-5">
      <div className="rounded-lg border border-border bg-muted/30 p-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Sparkles size={18} className="text-primary" />
          {config.title}
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">{config.summary}</p>
      </div>

      <div className="space-y-4">
        {config.fields.map((field) => (
          <FieldControl
            key={String(field.key)}
            field={field}
            value={optionValue(state.classOptions, field)}
            onText={(value) => setOption(field.key, value)}
            onToggle={(value) => toggleMulti(field, value)}
          />
        ))}
      </div>

      {isKineticist && (
        <section className="space-y-3 rounded-lg border border-border p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h4 className="font-semibold flex items-center gap-2">
                <Flame size={16} className="text-primary" />
                Starting Impulses
              </h4>
              <p className="text-xs text-muted-foreground">
                Pick {KINETICIST_STARTING_IMPULSES} 1st-level impulse feats. Element choices filter
                the list.
              </p>
            </div>
            <span className="rounded-md border border-border px-3 py-1 text-sm">
              {selectedImpulseFeats.length} / {KINETICIST_STARTING_IMPULSES}
            </span>
          </div>

          <div className="relative">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
            />
            <input
              type="text"
              className="input w-full pl-8"
              placeholder="Search kineticist impulses..."
              value={searchQ}
              onChange={(event) => setSearchQ(event.target.value)}
            />
          </div>

          {selectedImpulseFeats.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {selectedImpulseFeats.map((feat) => {
                const fullFeat = kineticistFeats?.data?.find((row) => row.id === feat.feat_id);
                return (
                  <span
                    key={feat.feat_id}
                    className="inline-flex items-center gap-2 rounded-md bg-primary/10 text-primary px-2.5 py-1.5 text-xs"
                  >
                    <span className="text-muted-foreground">{impulseSlotLabel(fullFeat)}</span>
                    <span className="font-medium">{feat.feat_name}</span>
                    <button
                      type="button"
                      onClick={() => removeImpulse(feat.feat_id)}
                      className="hover:text-destructive"
                      aria-label={`Remove ${feat.feat_name}`}
                    >
                      <X size={11} />
                    </button>
                  </span>
                );
              })}
            </div>
          )}

          <div className="max-h-80 overflow-y-auto rounded-md border border-border divide-y divide-border">
            {featsLoading && (
              <div className="p-4 flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 size={14} className="animate-spin" /> Loading impulses...
              </div>
            )}
            {!featsLoading && impulseFeats.length === 0 && (
              <div className="p-4 text-sm text-muted-foreground">
                No impulse feats found for the current filters.
              </div>
            )}
            {impulseFeats.map((feat) => {
              const added = impulseIds.has(feat.id);
              const full = selectedImpulseFeats.length >= KINETICIST_STARTING_IMPULSES;
              const aonUrl =
                (feat as Feat).aon_url || valueFromMetadata(feat.feat_metadata, "aon_url");
              return (
                <div key={feat.id} className="p-3 flex items-start gap-3 hover:bg-muted/30">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium text-sm">{feat.name}</span>
                      <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded">
                        Level {feat.level}
                      </span>
                    </div>
                    {feat.description && (
                      <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                        {feat.description}
                      </p>
                    )}
                    <AonLink
                      name={feat.name}
                      url={aonUrl}
                      isOfficial={feat.is_official}
                      className="mt-1"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => addImpulse(feat)}
                    disabled={added || full}
                    className="btn-outline px-2 py-1 text-xs disabled:opacity-40 flex items-center gap-1 shrink-0"
                  >
                    {added ? (
                      "Added"
                    ) : full ? (
                      "Full"
                    ) : (
                      <>
                        <Plus size={12} /> Add
                      </>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </section>
      )}

      <NotesField state={state} update={update} />

      {specials.length > 0 && (
        <section className="rounded-lg border border-border p-3 bg-muted/20">
          <h4 className="text-sm font-semibold mb-2">Will be saved as special abilities</h4>
          <ul className="space-y-1 text-sm text-muted-foreground">
            {specials.map((special) => (
              <li key={special}>- {special}</li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function FieldControl({
  field,
  value,
  onText,
  onToggle,
}: {
  field: ClassOptionField;
  value: string | string[];
  onText: (value: string) => void;
  onToggle: (value: string) => void;
}) {
  const selected = Array.isArray(value) ? value : [];
  const selectedKeys = new Set(selected.map(normalize));

  return (
    <section className="space-y-2">
      <div>
        <label className="block text-sm font-semibold">{field.label}</label>
        <p className="text-xs text-muted-foreground">{field.description}</p>
      </div>
      {field.options ? (
        <div className="flex flex-wrap gap-2">
          {field.options.map((option) => {
            const active = field.multi
              ? selectedKeys.has(normalize(option))
              : normalize(value as string) === normalize(option);
            return (
              <button
                key={option}
                type="button"
                onClick={() => (field.multi ? onToggle(option) : onText(option))}
                className={`rounded-full border px-3 py-1.5 text-sm transition-colors inline-flex items-center gap-1.5 ${
                  active
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-muted/30 text-muted-foreground hover:border-primary/40"
                }`}
              >
                {active && <Check size={12} />}
                {option}
              </button>
            );
          })}
        </div>
      ) : (
        <input
          type="text"
          className="input w-full"
          placeholder={field.placeholder ?? field.label}
          value={typeof value === "string" ? value : ""}
          onChange={(event) => onText(event.target.value)}
        />
      )}
    </section>
  );
}

function NotesField({ state, update }: Pick<StepProps, "state" | "update">) {
  return (
    <section className="space-y-2">
      <label className="block text-sm font-semibold">Additional class notes</label>
      <textarea
        className="input w-full min-h-20"
        placeholder="Record any class-specific setup the builder does not model yet."
        value={state.classOptions.notes ?? ""}
        onChange={(event) =>
          update({ classOptions: { ...state.classOptions, notes: event.target.value } })
        }
      />
    </section>
  );
}
