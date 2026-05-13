"use client";

import { Heart, Info, Minus, Plus } from "lucide-react";
import type { StepProps } from "../types";

type Ability = "str" | "dex" | "con" | "int" | "wis" | "cha";

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

  return (
    <div className="space-y-5">
      <div className="card p-3 bg-muted/30 flex items-start gap-2 text-sm text-muted-foreground">
        <Info size={16} className="shrink-0 mt-0.5 text-primary" />
        <p>
          Enter your <span className="font-medium text-foreground">final scores</span> after
          applying ancestry boosts/flaws, background boosts, class key-ability boost, and your four
          free boosts. The full PF2e boost UI lands in a follow-up — for now the math is on you.
          Scores clamp to 8&ndash;20 (the cap at character creation, before mid-campaign boosts).
        </p>
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
