"use client";

import { Heart, Info, Minus, Plus } from "lucide-react";
import type { AbilityKey, StepProps } from "../types";

type Ability = AbilityKey;

const ABILITIES: { key: Ability; short: string; label: string }[] = [
  { key: "str", short: "STR", label: "Strength" },
  { key: "dex", short: "DEX", label: "Dexterity" },
  { key: "con", short: "CON", label: "Constitution" },
  { key: "int", short: "INT", label: "Intelligence" },
  { key: "wis", short: "WIS", label: "Wisdom" },
  { key: "cha", short: "CHA", label: "Charisma" },
];

function modOf(score: number): number {
  return Math.floor((score - 10) / 2);
}

function fmtMod(score: number): string {
  const m = modOf(score);
  return m >= 0 ? `+${m}` : `${m}`;
}

function abilityName(key: Ability): string {
  return ABILITIES.find((ability) => ability.key === key)?.label ?? key.toUpperCase();
}

export function AbilitiesStep({ state, update }: StepProps) {
  const { abilities, ancestryHp, classHp, level } = state;
  const conMod = modOf(abilities.con);
  const maxHp = ancestryHp + (classHp + conMod) * level;

  function setAbility(key: Ability, raw: number) {
    const clamped = Math.max(8, Math.min(20, Math.round(raw)));
    update({ abilities: { ...abilities, [key]: clamped } });
  }

  function bump(key: Ability, delta: number) {
    setAbility(key, abilities[key] + delta);
  }

  function toggleAncestryBoost(key: Ability) {
    const selected = state.selectedAncestryBoosts.includes(key);
    const maxBoosts = state.ancestryBoostMode === "remaster" && state.selectedAncestryFlaws.length ? 3 : 2;
    if (selected) {
      update({ selectedAncestryBoosts: state.selectedAncestryBoosts.filter((item) => item !== key) });
    } else if (state.selectedAncestryBoosts.length < maxBoosts) {
      update({ selectedAncestryBoosts: [...state.selectedAncestryBoosts, key] });
    }
  }

  function toggleAncestryFlaw(key: Ability) {
    if (state.ancestryBoostMode !== "remaster") return;
    const selected = state.selectedAncestryFlaws.includes(key);
    if (selected) {
      update({
        selectedAncestryFlaws: [],
        selectedAncestryBoosts: state.selectedAncestryBoosts.slice(0, 2),
      });
    } else if (!state.selectedAncestryBoosts.includes(key)) {
      update({ selectedAncestryFlaws: [key] });
    }
  }

  function applyAncestryBoosts() {
    const boosts =
      state.ancestryBoostMode === "printed"
        ? [...state.printedAncestryBoosts, ...state.selectedAncestryBoosts]
        : state.selectedAncestryBoosts;
    const flaws = state.selectedAncestryFlaws;
    const next = { ...abilities };
    for (const boost of boosts) next[boost] = Math.min(20, next[boost] + 2);
    for (const flaw of flaws) next[flaw] = Math.max(8, next[flaw] - 2);
    update({ abilities: next });
  }

  const printedBoostText = state.printedAncestryBoosts.length
    ? state.printedAncestryBoosts.map(abilityName).join(", ")
    : "None recorded";
  const printedFlawText = state.printedAncestryFlaws.length
    ? state.printedAncestryFlaws.map(abilityName).join(", ")
    : "None";

  return (
    <div className="space-y-5">
      <div className="rounded-lg border border-border bg-muted/30 p-3 flex items-start gap-2 text-sm text-muted-foreground">
        <Info size={16} className="shrink-0 mt-0.5 text-primary" />
        <p>
          Enter your <span className="font-medium text-foreground">final scores</span> after
          applying ancestry boosts/flaws, background boosts, class key-ability boost, and your four
          free boosts. The full PF2e boost UI lands in a follow-up — for now the math is on you.
          Scores clamp to 8&ndash;20 (the cap at character creation, before mid-campaign boosts).
        </p>
      </div>

      <div className="rounded-lg border border-border bg-muted/20 p-3 space-y-3">
        <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
          <div>
            <h3 className="text-sm font-semibold">Ancestry Ability Boosts</h3>
            <p className="text-xs text-muted-foreground mt-1">
              Printed boosts: {printedBoostText}. Printed flaws: {printedFlawText}.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() =>
                update({
                  ancestryBoostMode: "remaster",
                  selectedAncestryBoosts: [],
                  selectedAncestryFlaws: [],
                })
              }
              className={`px-3 py-1 rounded-md text-xs ${
                state.ancestryBoostMode === "remaster"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              Remaster 2 Free
            </button>
            <button
              type="button"
              onClick={() =>
                update({
                  ancestryBoostMode: "printed",
                  selectedAncestryBoosts: [],
                  selectedAncestryFlaws: state.printedAncestryFlaws,
                })
              }
              className={`px-3 py-1 rounded-md text-xs ${
                state.ancestryBoostMode === "printed"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              Printed
            </button>
          </div>
        </div>

        {state.ancestryBoostMode === "remaster" ? (
          <div>
            <p className="text-xs text-muted-foreground mb-2">
              Choose any two different ancestry boosts. You can also take one voluntary flaw to
              choose a third boost.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
              {ABILITIES.map(({ key, short }) => {
                const active = state.selectedAncestryBoosts.includes(key);
                const maxBoosts = state.selectedAncestryFlaws.length ? 3 : 2;
                const disabled =
                  (!active && state.selectedAncestryBoosts.length >= maxBoosts) ||
                  state.selectedAncestryFlaws.includes(key);
                return (
                  <button
                    key={key}
                    type="button"
                    disabled={disabled}
                    onClick={() => toggleAncestryBoost(key)}
                    className={`rounded-md px-3 py-2 text-sm font-mono ${
                      active
                        ? "bg-primary text-primary-foreground"
                        : disabled
                          ? "bg-muted text-muted-foreground/40"
                          : "bg-muted text-muted-foreground hover:bg-muted/70"
                    }`}
                  >
                    {short}
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-muted-foreground mt-3 mb-2">
              Optional voluntary flaw for one extra boost.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
              {ABILITIES.map(({ key, short }) => {
                const active = state.selectedAncestryFlaws.includes(key);
                const disabled = !active && state.selectedAncestryBoosts.includes(key);
                return (
                  <button
                    key={key}
                    type="button"
                    disabled={disabled}
                    onClick={() => toggleAncestryFlaw(key)}
                    className={`rounded-md px-3 py-2 text-sm font-mono ${
                      active
                        ? "bg-destructive text-destructive-foreground"
                        : disabled
                          ? "bg-muted text-muted-foreground/40"
                          : "bg-muted text-muted-foreground hover:bg-muted/70"
                    }`}
                  >
                    - {short}
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="text-xs text-muted-foreground">
            Printed ancestry boosts/flaws are selected. If an ancestry has a printed free boost,
            choose that by manually raising the final score below.
          </div>
        )}

        <button
          type="button"
          onClick={applyAncestryBoosts}
          disabled={
            state.ancestryBoostMode === "remaster" &&
            state.selectedAncestryBoosts.length !== (state.selectedAncestryFlaws.length ? 3 : 2)
          }
          className="btn-outline text-sm disabled:opacity-50"
        >
          Apply ancestry boosts to current scores
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {ABILITIES.map(({ key, short, label }) => {
          const score = abilities[key];
          const mod = modOf(score);
          const isKey = state.keyability === key;
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

              <div className="flex items-center justify-center gap-2 mb-2">
                <button
                  type="button"
                  onClick={() => bump(key, -1)}
                  disabled={score <= 8}
                  className="btn-outline w-8 h-8 flex items-center justify-center p-0 disabled:opacity-30"
                  aria-label={`Decrement ${label}`}
                >
                  <Minus size={14} />
                </button>
                <input
                  type="number"
                  min={8}
                  max={20}
                  value={score}
                  onChange={(e) => setAbility(key, parseInt(e.target.value) || 10)}
                  className="input w-14 text-center font-mono text-lg font-bold"
                />
                <button
                  type="button"
                  onClick={() => bump(key, 1)}
                  disabled={score >= 20}
                  className="btn-outline w-8 h-8 flex items-center justify-center p-0 disabled:opacity-30"
                  aria-label={`Increment ${label}`}
                >
                  <Plus size={14} />
                </button>
              </div>

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

      {/* Live derived numbers */}
      <div className="card p-4 bg-muted/30 grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
        <Stat label="Estimated HP" hint={`${ancestryHp} + (${classHp}+${conMod}) × ${level}`}>
          <span className="text-emerald-400 font-bold flex items-center gap-1">
            <Heart size={14} /> {maxHp}
          </span>
        </Stat>
        <Stat label="Initiative (Perception)" hint="Wis-based">
          <span className="font-mono">{fmtMod(abilities.wis)}</span>
        </Stat>
        <Stat label="Class DC" hint={state.keyability ? `10 + ${state.keyability}` : "—"}>
          <span className="font-mono">
            {state.keyability ? 10 + modOf(abilities[state.keyability as Ability] ?? 10) : "—"}
          </span>
        </Stat>
        <Stat label="Free skill picks" hint="Class trained + INT mod">
          <span className="font-mono">
            {Math.max(0, state.classTrainedCount + modOf(abilities.int))}
          </span>
        </Stat>
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
