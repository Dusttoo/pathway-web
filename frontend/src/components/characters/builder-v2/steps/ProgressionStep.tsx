"use client";

import { useMemo, useState } from "react";
import { AlertCircle, CheckCircle2, Circle, Clock, Layers3 } from "lucide-react";
import type { StepProps } from "../types";
import {
  buildProgressionSlots,
  progressionSummary,
  type ProgressionCategory,
  type ProgressionStatus,
} from "../progression";

const CATEGORY_LABELS: Record<ProgressionCategory | "all", string> = {
  all: "All",
  identity: "Identity",
  ability: "Abilities",
  class: "Class",
  feat: "Feats",
  skill: "Skills",
  spell: "Spells",
  equipment: "Gear",
};

const CATEGORY_ORDER: Array<ProgressionCategory | "all"> = [
  "all",
  "identity",
  "ability",
  "class",
  "feat",
  "skill",
  "spell",
  "equipment",
];

function StatusIcon({ status }: { status: ProgressionStatus }) {
  if (status === "done") return <CheckCircle2 size={16} className="text-emerald-400" />;
  if (status === "partial") return <AlertCircle size={16} className="text-amber-400" />;
  if (status === "future") return <Clock size={16} className="text-[#6f7f90]" />;
  return <Circle size={16} className="text-[#ff6a2a]" />;
}

function statusLabel(status: ProgressionStatus): string {
  if (status === "done") return "Done";
  if (status === "partial") return "Started";
  if (status === "future") return "Future";
  return "Needed";
}

export function ProgressionStep({ state }: StepProps) {
  const [filter, setFilter] = useState<ProgressionCategory | "all">("all");
  const slots = useMemo(() => buildProgressionSlots(state), [state]);
  const summary = useMemo(() => progressionSummary(slots), [slots]);
  const visible = filter === "all" ? slots : slots.filter((slot) => slot.category === filter);
  const grouped = visible.reduce<Record<number, typeof visible>>((acc, slot) => {
    acc[slot.level] ??= [];
    acc[slot.level].push(slot);
    return acc;
  }, {});

  return (
    <div className="space-y-5">
      <div className="rounded-lg border border-border bg-muted/30 p-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h3 className="flex items-center gap-2 text-lg font-semibold">
              <Layers3 size={18} className="text-primary" />
              Level 1-20 Character Plan
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              A builder checklist for every expected PF2e choice as the character levels up.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center text-sm">
            <div className="rounded-md border border-border px-3 py-2">
              <p className="text-lg font-bold text-emerald-400">{summary.done}</p>
              <p className="text-xs text-muted-foreground">Done</p>
            </div>
            <div className="rounded-md border border-border px-3 py-2">
              <p className="text-lg font-bold text-amber-400">{summary.partial}</p>
              <p className="text-xs text-muted-foreground">Started</p>
            </div>
            <div className="rounded-md border border-border px-3 py-2">
              <p className="text-lg font-bold text-[#ff6a2a]">{summary.todo}</p>
              <p className="text-xs text-muted-foreground">Needed</p>
            </div>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {CATEGORY_ORDER.map((category) => (
            <button
              key={category}
              type="button"
              onClick={() => setFilter(category)}
              className={`rounded-md border px-3 py-1.5 text-xs font-semibold transition-colors ${
                filter === category
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-background/30 text-muted-foreground hover:text-foreground"
              }`}
            >
              {CATEGORY_LABELS[category]}
            </button>
          ))}
        </div>
      </div>

      <div className="pb-progression-grid">
        {Object.entries(grouped).map(([level, levelSlots]) => (
          <section key={level} className="pb-progression-level">
            <div className="pb-progression-level-head">
              <span>Level</span>
              <strong>{level}</strong>
            </div>
            <div className="space-y-2">
              {levelSlots.map((slot) => (
                <article key={slot.id} className={`pb-progression-slot is-${slot.status}`}>
                  <div className="flex items-start gap-2">
                    <StatusIcon status={slot.status} />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="font-semibold text-foreground">{slot.label}</h4>
                        <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">
                          {CATEGORY_LABELS[slot.category]}
                        </span>
                        <span className="rounded bg-background/40 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">
                          {statusLabel(slot.status)}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">{slot.detail}</p>
                      <p className="mt-1 text-[11px] text-[#8ea3ba]">{slot.requirement}</p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
