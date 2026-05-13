"use client";

import { useEffect } from "react";
import { CheckCircle2, Heart, Info } from "lucide-react";
import type { AbilityBoostChoices, AbilityKey, BuilderState, StepProps } from "../types";

const ABILITIES: { key: AbilityKey; short: string; label: string }[] = [
  { key: "str", short: "STR", label: "Strength" },
  { key: "dex", short: "DEX", label: "Dexterity" },
  { key: "con", short: "CON", label: "Constitution" },
  { key: "int", short: "INT", label: "Intelligence" },
  { key: "wis", short: "WIS", label: "Wisdom" },
  { key: "cha", short: "CHA", label: "Charisma" },
];

const ABILITY_ALIASES: Record<string, AbilityKey> = {
  str: "str",
  strength: "str",
  dex: "dex",
  dexterity: "dex",
  con: "con",
  constitution: "con",
  int: "int",
  intelligence: "int",
  wis: "wis",
  wisdom: "wis",
  cha: "cha",
  charisma: "cha",
};

function abilityKey(value: string | null | undefined): AbilityKey | null {
  if (!value) return null;
  return ABILITY_ALIASES[value.trim().toLowerCase()] ?? null;
}

function abilityKeys(values: string[]): AbilityKey[] {
  return values.map((value) => abilityKey(value)).filter((value): value is AbilityKey => !!value);
}

function isFreeBoost(value: string): boolean {
  return ["free", "any", "choose"].includes(value.trim().toLowerCase());
}

function unique<T>(values: T[]): T[] {
  return [...new Set(values)];
}

function modOf(score: number): number {
  return Math.floor((score - 10) / 2);
}

function fmtMod(score: number): string {
  const m = modOf(score);
  return m >= 0 ? `+${m}` : `${m}`;
}

function applyBoost(score: number): number {
  return Math.min(18, score + (score >= 18 ? 1 : 2));
}

function calculateAbilities(state: BuilderState): Record<AbilityKey, number> {
  const next: Record<AbilityKey, number> = { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 };
  const fixedAncestryBoosts = abilityKeys(
    state.ancestryBoostOptions.filter((boost) => !isFreeBoost(boost))
  );
  const fixedAncestryFlaws = abilityKeys(
    state.ancestryFlawOptions.filter((flaw) => !isFreeBoost(flaw))
  );
  const classBoost = abilityKey(state.keyability);

  for (const flaw of fixedAncestryFlaws) next[flaw] = Math.max(8, next[flaw] - 2);
  for (const boost of [
    ...fixedAncestryBoosts,
    ...state.abilityBoostChoices.ancestryFree,
    ...state.abilityBoostChoices.background,
    ...(classBoost ? [classBoost] : []),
    ...state.abilityBoostChoices.free,
  ]) {
    next[boost] = applyBoost(next[boost]);
  }

  return next;
}

function sameAbilities(a: Record<AbilityKey, number>, b: Record<AbilityKey, number>): boolean {
  return ABILITIES.every(({ key }) => a[key] === b[key]);
}

function toggleChoice(
  choices: AbilityKey[],
  key: AbilityKey,
  limit: number,
  requiredFrom?: AbilityKey[]
): AbilityKey[] {
  if (choices.includes(key)) return choices.filter((choice) => choice !== key);
  if (choices.length >= limit) return choices;

  if (requiredFrom?.length && choices.length === 0 && !requiredFrom.includes(key)) {
    return choices;
  }

  return [...choices, key];
}

export function AbilitiesStep({ state, update }: StepProps) {
  const calculated = calculateAbilities(state);
  const { ancestryHp, classHp, level } = state;
  const conMod = modOf(calculated.con);
  const maxHp = ancestryHp + (classHp + conMod) * level;
  const fixedAncestryBoosts = abilityKeys(
    state.ancestryBoostOptions.filter((boost) => !isFreeBoost(boost))
  );
  const ancestryFreeSlots =
    state.ancestryBoostOptions.length > 0
      ? state.ancestryBoostOptions.filter(isFreeBoost).length
      : 2;
  const fixedAncestryFlaws = abilityKeys(
    state.ancestryFlawOptions.filter((flaw) => !isFreeBoost(flaw))
  );
  const backgroundOptions = unique(abilityKeys(state.backgroundBoostOptions));
  const classBoost = abilityKey(state.keyability);
  const backgroundHasRequired =
    backgroundOptions.length === 0
      ? state.abilityBoostChoices.background.length > 0
      : state.abilityBoostChoices.background.some((choice) => backgroundOptions.includes(choice));
  const complete =
    state.abilityBoostChoices.ancestryFree.length === ancestryFreeSlots &&
    state.abilityBoostChoices.background.length === 2 &&
    backgroundHasRequired &&
    state.abilityBoostChoices.free.length === 4 &&
    !!classBoost;

  useEffect(() => {
    if (!sameAbilities(state.abilities, calculated)) {
      update({ abilities: calculated });
    }
  }, [calculated, state.abilities, update]);

  function setChoices(patch: Partial<AbilityBoostChoices>) {
    const abilityBoostChoices = { ...state.abilityBoostChoices, ...patch };
    const nextState = { ...state, abilityBoostChoices };
    update({ abilityBoostChoices, abilities: calculateAbilities(nextState) });
  }

  function toggleAncestry(key: AbilityKey) {
    setChoices({
      ancestryFree: toggleChoice(state.abilityBoostChoices.ancestryFree, key, ancestryFreeSlots),
    });
  }

  function toggleBackground(key: AbilityKey) {
    setChoices({
      background: toggleChoice(state.abilityBoostChoices.background, key, 2, backgroundOptions),
    });
  }

  function toggleFree(key: AbilityKey) {
    setChoices({ free: toggleChoice(state.abilityBoostChoices.free, key, 4) });
  }

  return (
    <div className="space-y-5">
      <div className="rounded-lg border border-border bg-muted/30 p-3 flex items-start gap-2 text-sm text-muted-foreground">
        <Info size={16} className="shrink-0 mt-0.5 text-primary" />
        <p>
          Pick boosts instead of typing final numbers. Scores start at 10, ancestry flaws apply
          first, each boost raises a score by 2, and creation scores are capped at 18.
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {ABILITIES.map(({ key, short, label }) => {
          const score = calculated[key];
          const mod = modOf(score);
          const isKey = classBoost === key;
          return (
            <div
              key={key}
              className={`card p-4 transition-colors ${
                isKey ? "border-primary/50 bg-primary/5" : ""
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                    {label}
                  </p>
                  <p className="text-sm font-bold">{short}</p>
                </div>
                {isKey && (
                  <span className="text-[10px] uppercase bg-primary/15 text-primary px-1.5 py-0.5 rounded">
                    Key
                  </span>
                )}
              </div>
              <p className="text-center text-3xl font-bold font-mono">{score}</p>
              <p
                className={`text-center text-sm font-mono ${
                  mod > 0
                    ? "text-emerald-400"
                    : mod < 0
                      ? "text-amber-400"
                      : "text-muted-foreground"
                }`}
              >
                Mod {fmtMod(score)}
              </p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <BoostPanel
          title="Ancestry"
          status={`${state.abilityBoostChoices.ancestryFree.length}/${ancestryFreeSlots} free boosts`}
          note={
            fixedAncestryBoosts.length || fixedAncestryFlaws.length
              ? `Fixed: ${fixedAncestryBoosts.map((b) => b.toUpperCase()).join(", ") || "none"}${
                  fixedAncestryFlaws.length
                    ? ` · Flaw: ${fixedAncestryFlaws.map((b) => b.toUpperCase()).join(", ")}`
                    : ""
                }`
              : "No fixed ancestry boosts found for this ancestry."
          }
          selected={state.abilityBoostChoices.ancestryFree}
          limit={ancestryFreeSlots}
          disabledKeys={fixedAncestryBoosts}
          onToggle={toggleAncestry}
        />
        <BoostPanel
          title="Background"
          status={`${state.abilityBoostChoices.background.length}/2 boosts`}
          note={
            backgroundOptions.length
              ? `First pick must be one of: ${backgroundOptions.map((b) => b.toUpperCase()).join(", ")}`
              : "Pick two different boosts for this background."
          }
          selected={state.abilityBoostChoices.background}
          limit={2}
          required={backgroundOptions}
          onToggle={toggleBackground}
        />
        <BoostPanel
          title="Class"
          status={classBoost ? "1/1 key boost" : "0/1 key boost"}
          note={
            classBoost
              ? `${state.className || "Your class"} boosts ${classBoost.toUpperCase()}.`
              : "Pick a class key attribute on the Class step."
          }
          selected={classBoost ? [classBoost] : []}
          limit={1}
          locked
          onToggle={() => undefined}
        />
        <BoostPanel
          title="Four Free Boosts"
          status={`${state.abilityBoostChoices.free.length}/4 boosts`}
          note="Choose four different ability scores."
          selected={state.abilityBoostChoices.free}
          limit={4}
          onToggle={toggleFree}
        />
      </div>

      {!complete && (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 text-sm text-amber-300">
          Finish every boost budget before creating the character. The builder will keep your
          current picks while you jump between tabs.
        </div>
      )}

      <div className="card p-4 bg-muted/30 grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
        <Stat label="Estimated HP" hint={`${ancestryHp} + (${classHp}+${conMod}) x ${level}`}>
          <span className="text-emerald-400 font-bold flex items-center gap-1">
            <Heart size={14} /> {maxHp}
          </span>
        </Stat>
        <Stat label="Initiative (Perception)" hint="Wis-based">
          <span className="font-mono">{fmtMod(calculated.wis)}</span>
        </Stat>
        <Stat label="Class DC" hint={classBoost ? `10 + ${classBoost}` : "none"}>
          <span className="font-mono">{classBoost ? 10 + modOf(calculated[classBoost]) : "-"}</span>
        </Stat>
        <Stat label="Free skill picks" hint="Class trained + INT mod">
          <span className="font-mono">
            {Math.max(0, state.classTrainedCount + modOf(calculated.int))}
          </span>
        </Stat>
      </div>
    </div>
  );
}

function BoostPanel({
  title,
  status,
  note,
  selected,
  required = [],
  disabledKeys = [],
  limit,
  locked = false,
  onToggle,
}: {
  title: string;
  status: string;
  note: string;
  selected: AbilityKey[];
  required?: AbilityKey[];
  disabledKeys?: AbilityKey[];
  limit: number;
  locked?: boolean;
  onToggle: (key: AbilityKey) => void;
}) {
  return (
    <div className="rounded-lg border border-border p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold">{title}</h3>
          <p className="text-xs text-muted-foreground">{note}</p>
        </div>
        <span className="text-xs rounded bg-muted px-2 py-1 text-muted-foreground">{status}</span>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {ABILITIES.map(({ key, short }) => {
          const active = selected.includes(key);
          const disabled =
            locked ||
            disabledKeys.includes(key) ||
            (!active && selected.length >= limit) ||
            (!active && required.length > 0 && selected.length === 0 && !required.includes(key));
          return (
            <button
              key={key}
              type="button"
              disabled={disabled}
              onClick={() => onToggle(key)}
              className={`h-11 rounded-md border text-sm font-semibold transition-colors flex items-center justify-center gap-1 ${
                active
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-background hover:border-primary/50 disabled:opacity-35 disabled:hover:border-border"
              }`}
            >
              {active && <CheckCircle2 size={14} />}
              {short}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function Stat({
  label,
  hint,
  children,
}: {
  label: string;
  hint: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="text-[10px] uppercase text-muted-foreground tracking-wide">{label}</p>
      <div className="text-base mt-0.5">{children}</div>
      <p className="text-[10px] text-muted-foreground/70 mt-0.5">{hint}</p>
    </div>
  );
}
