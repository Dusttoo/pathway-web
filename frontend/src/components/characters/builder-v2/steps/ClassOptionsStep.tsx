"use client";

import { useMemo, useState } from "react";
import { Check, Flame, Loader2, Plus, Search, Sparkles, X } from "lucide-react";
import { useClassDetail } from "@/lib/hooks/use-builder-data";
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
type ClassRow = Tables<"character_classes">;
type UnknownRecord = Record<string, unknown>;

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

function objectValue(value: unknown): UnknownRecord {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as UnknownRecord)
    : {};
}

function stringValue(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function numberValue(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function labelValue(value: string): string {
  return value
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[_:-]+/g, " ")
    .trim()
    .split(/\s+/)
    .map((word) => (word ? word[0].toUpperCase() + word.slice(1) : word))
    .join(" ");
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
  const { data: classDetail, isLoading: classDetailLoading } = useClassDetail(state.classId || null);

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
        <ClassSummaryPanel
          classDetail={classDetail}
          className={state.className}
          level={state.level}
          loading={classDetailLoading}
        />
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

function proficiencyLabel(rank: number): string {
  if (rank >= 8) return "Legendary";
  if (rank >= 6) return "Master";
  if (rank >= 4) return "Expert";
  if (rank >= 2) return "Trained";
  return "Untrained";
}

function proficiencyName(key: string): string {
  const names: Record<string, string> = {
    classDC: "Class DC",
    perception: "Perception",
    fortitude: "Fortitude",
    reflex: "Reflex",
    will: "Will",
    light: "Light Armor",
    medium: "Medium Armor",
    heavy: "Heavy Armor",
    unarmored: "Unarmored Defense",
    simple: "Simple Weapons",
    martial: "Martial Weapons",
    advanced: "Advanced Weapons",
    unarmed: "Unarmed Attacks",
    castingArcane: "Arcane Spellcasting",
    castingDivine: "Divine Spellcasting",
    castingOccult: "Occult Spellcasting",
    castingPrimal: "Primal Spellcasting",
  };
  if (key.startsWith("lore:")) return `${labelValue(key.slice(5))} Lore`;
  return names[key] ?? labelValue(key);
}

function classFeatures(value: unknown): Array<{ level: number | null; name: string; description: string }> {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (typeof item === "string") return { level: null, name: item, description: "" };
      const row = objectValue(item);
      const level = numberValue(row.level);
      const name =
        stringValue(row.name) ||
        stringValue(row.title) ||
        stringValue(row.feature) ||
        stringValue(row.label);
      const description =
        stringValue(row.description) || stringValue(row.summary) || stringValue(row.text);
      return name ? { level, name, description } : null;
    })
    .filter((item): item is { level: number | null; name: string; description: string } => !!item)
    .sort((a, b) => (a.level ?? 999) - (b.level ?? 999) || a.name.localeCompare(b.name));
}

function advancementRows(value: unknown): Array<{ level: string; text: string }> {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (Array.isArray(item)) {
        const level = item[0] == null ? "" : String(item[0]);
        const text = item
          .slice(1)
          .map((part) => String(part ?? "").trim())
          .filter(Boolean)
          .join(" - ");
        return level && text ? { level, text } : null;
      }
      const row = objectValue(item);
      const level = String(row.level ?? row.Level ?? "").trim();
      const text =
        stringValue(row.features) ||
        stringValue(row.feature) ||
        stringValue(row.benefits) ||
        stringValue(row.text) ||
        stringValue(row.description);
      return level && text ? { level, text } : null;
    })
    .filter((item): item is { level: string; text: string } => !!item);
}

function currentSpellSlots(value: unknown, level: number): string[] {
  if (!Array.isArray(value)) return [];
  const exact = value
    .map(objectValue)
    .find((row) => numberValue(row.level) === level || String(row.level ?? "") === String(level));
  if (!exact) return [];
  return Object.entries(exact)
    .filter(([key, slotValue]) => key !== "level" && numberValue(slotValue) !== null)
    .map(([key, slotValue]) => `${labelValue(key)}: ${slotValue}`);
}

function pdfSection(meta: UnknownRecord, key: string): string {
  return stringValue(meta[key]);
}

function ClassSummaryPanel({
  classDetail,
  className,
  level,
  loading,
}: {
  classDetail: ClassRow | undefined;
  className: string;
  level: number;
  loading: boolean;
}) {
  if (loading && !classDetail) {
    return (
      <div className="rounded-lg border border-border bg-muted/30 p-4 flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 size={14} className="animate-spin" />
        Loading class details...
      </div>
    );
  }

  if (!classDetail) {
    return (
      <div className="rounded-lg border border-border bg-muted/30 p-4">
        <h3 className="font-semibold">{className || "Class"} overview</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Class details are not available yet. You can still continue and add notes below.
        </p>
      </div>
    );
  }

  const meta = objectValue(classDetail.class_metadata);
  const profs = objectValue(classDetail.initial_proficiencies);
  const features = classFeatures(classDetail.class_features);
  const advancement = advancementRows(meta.advancement);
  const keyAttrs = listValue(classDetail.key_attribute).map((attr) => attr.toUpperCase());
  const trainedSkillCount = numberValue(meta.trained_skill_count);
  const spellcastingTradition = stringValue(meta.spellcasting_tradition);
  const spellcastingType = stringValue(meta.spellcasting_type);
  const focusPoints = numberValue(meta.focus_points);
  const cantripsKnown = numberValue(meta.cantrips_known);
  const dirge = objectValue(meta.dirge);
  const keyTerms = Array.isArray(meta.key_terms) ? meta.key_terms.map(objectValue) : [];
  const slots = currentSpellSlots(meta.spell_slot_progression, level);
  const pdfSections = [
    ["Advancement Table", pdfSection(meta, "advancement_text")],
    ["Class Feature Details", pdfSection(meta, "feature_details_text")],
    ["Class Feats", pdfSection(meta, "class_feats_text")],
    ["Focus and Special Spells", pdfSection(meta, "focus_spells_text")],
  ].filter((section): section is [string, string] => Boolean(section[1]));

  const proficiencyEntries = Object.entries(profs)
    .map(([key, value]) => ({ key, rank: numberValue(value) }))
    .filter((entry): entry is { key: string; rank: number } => entry.rank !== null && entry.rank > 0)
    .sort((a, b) => proficiencyName(a.key).localeCompare(proficiencyName(b.key)));

  return (
    <section className="space-y-4 rounded-lg border border-border bg-muted/20 p-4">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-lg font-semibold">What {classDetail.name} gives you</h3>
          {classDetail.source && (
            <span className="rounded-md bg-primary/10 px-2 py-0.5 text-xs text-primary">
              {classDetail.source}
            </span>
          )}
        </div>
        {classDetail.description && (
          <p className="mt-2 text-sm text-muted-foreground">{classDetail.description}</p>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryStat label="Hit Points" value={`${classDetail.class_hp} per level`} />
        <SummaryStat label="Key Attribute" value={keyAttrs.length ? keyAttrs.join(" or ") : "Any"} />
        <SummaryStat
          label="Spellcasting"
          value={
            classDetail.is_spellcaster
              ? [spellcastingType, spellcastingTradition].filter(Boolean).join(" ")
              : "None"
          }
        />
        <SummaryStat
          label="Skills"
          value={
            trainedSkillCount == null
              ? "Class trained skills"
              : `${trainedSkillCount} choices plus class skills`
          }
        />
      </div>

      {(focusPoints != null || cantripsKnown != null || Object.keys(dirge).length > 0) && (
        <div className="rounded-lg border border-border bg-background/40 p-3">
          <h4 className="text-sm font-semibold">Spellcasting and Class Engine</h4>
          <div className="mt-2 flex flex-wrap gap-2 text-xs">
            {focusPoints != null && <InfoPill label="Focus Points" value={String(focusPoints)} />}
            {cantripsKnown != null && <InfoPill label="Cantrips" value={String(cantripsKnown)} />}
            {Object.entries(dirge).map(([key, value]) => (
              <InfoPill key={key} label={labelValue(key)} value={String(value)} />
            ))}
            {slots.map((slot) => (
              <InfoPill key={slot} label={`Level ${level} Slots`} value={slot} />
            ))}
          </div>
        </div>
      )}

      {proficiencyEntries.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold">Starting Proficiencies</h4>
          <div className="mt-2 flex flex-wrap gap-2">
            {proficiencyEntries.map(({ key, rank }) => (
              <span
                key={key}
                className="rounded-md border border-border bg-background/50 px-2.5 py-1 text-xs"
              >
                <span className="font-medium">{proficiencyName(key)}</span>{" "}
                <span className="text-muted-foreground">{proficiencyLabel(rank)}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {features.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold">Class Features</h4>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            {features.map((feature) => (
              <div
                key={`${feature.level ?? "x"}-${feature.name}`}
                className="rounded-md border border-border bg-background/40 p-3"
              >
                <div className="flex items-center gap-2 text-sm font-medium">
                  {feature.level != null && (
                    <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] text-primary">
                      Level {feature.level}
                    </span>
                  )}
                  <span>{feature.name}</span>
                </div>
                {feature.description && (
                  <p className="mt-1 text-xs text-muted-foreground">{feature.description}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {keyTerms.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold">Key Terms</h4>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            {keyTerms.map((term, index) => {
              const name = stringValue(term.name) || stringValue(term.term) || `Term ${index + 1}`;
              const text =
                stringValue(term.description) || stringValue(term.summary) || stringValue(term.text);
              return (
                <div key={`${name}-${index}`} className="rounded-md border border-border p-3">
                  <p className="text-sm font-medium">{name}</p>
                  {text && <p className="mt-1 text-xs text-muted-foreground">{text}</p>}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {advancement.length > 0 && (
        <details className="rounded-lg border border-border bg-background/40 p-3">
          <summary className="cursor-pointer text-sm font-semibold">Level-by-Level Advancement</summary>
          <div className="mt-3 max-h-72 overflow-y-auto divide-y divide-border rounded-md border border-border">
            {advancement.map((row) => (
              <div key={`${row.level}-${row.text}`} className="grid grid-cols-[4rem_1fr] gap-3 p-2 text-sm">
                <span className="font-medium">Level {row.level}</span>
                <span className="text-muted-foreground">{row.text}</span>
              </div>
            ))}
          </div>
        </details>
      )}

      {pdfSections.map(([title, text]) => (
        <details key={title} className="rounded-lg border border-border bg-background/40 p-3">
          <summary className="cursor-pointer text-sm font-semibold">{title}</summary>
          <div className="mt-3 max-h-96 overflow-y-auto whitespace-pre-wrap text-sm text-muted-foreground">
            {text}
          </div>
        </details>
      ))}
    </section>
  );
}

function SummaryStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-background/40 p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-semibold capitalize">{value || "None"}</p>
    </div>
  );
}

function InfoPill({ label, value }: { label: string; value: string }) {
  return (
    <span className="rounded-md bg-primary/10 px-2 py-1 text-primary">
      <span className="font-medium">{label}:</span> {value}
    </span>
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
