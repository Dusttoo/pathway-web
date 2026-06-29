"use client";

import { useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronDown,
  Heart,
  Lightbulb,
  Shield,
  Sparkles,
} from "lucide-react";
import type { StepDef } from "./steps";
import type { StepGuide } from "./step-guides";
import { TermChips } from "./glossary";

export type BeginnerSummary = {
  name: string;
  ancestry: string;
  className: string;
  level: number;
  ac: number;
  hp: number;
};

// Focused, one-decision-at-a-time builder chrome (à la D&D Beyond). Renders a
// single step front-and-center with a progress rail, a plain-language guide,
// and large Back/Continue controls — deliberately hiding the dense plan +
// stats sidebars so a first-time player is never looking at more than one
// choice at once. The actual step UI is passed in as `children`.
export function BeginnerLayout({
  steps,
  stepIndex,
  current,
  guide,
  summary,
  onJump,
  onBack,
  onNext,
  children,
}: {
  steps: StepDef[];
  stepIndex: number;
  current: StepDef | undefined;
  guide?: StepGuide;
  summary: BeginnerSummary;
  onJump: (index: number) => void;
  onBack: () => void;
  onNext: () => void;
  children: React.ReactNode;
}) {
  const [summaryOpen, setSummaryOpen] = useState(false);
  const total = steps.length;
  const isLast = stepIndex >= total - 1;
  const isFirst = stepIndex === 0;
  const Icon = current?.icon ?? Sparkles;

  return (
    <div
      className="h-[calc(100%-58px)] overflow-y-auto"
      style={{
        background:
          "radial-gradient(circle at 50% 0%, rgba(20, 54, 91, 0.35), transparent 18rem), linear-gradient(180deg, #071525 0%, #02070d 100%)",
      }}
    >
      <div className="mx-auto flex w-full max-w-3xl flex-col px-4 py-5">
      {/* Progress rail */}
      <div className="mb-5">
        <div className="mb-2 flex items-center justify-between text-xs text-[#b99762]">
          <span className="font-semibold uppercase tracking-wide text-[#d8a646]">
            Step {stepIndex + 1} of {total}
          </span>
          <span>{Math.round(((stepIndex + 1) / total) * 100)}% there</span>
        </div>
        <div className="flex gap-1" role="list" aria-label="Build progress">
          {steps.map((step, index) => {
            const done = index < stepIndex;
            const active = index === stepIndex;
            return (
              <button
                key={step.key}
                type="button"
                role="listitem"
                aria-current={active ? "step" : undefined}
                title={step.label}
                onClick={() => onJump(index)}
                className={`h-1.5 flex-1 rounded-full transition-colors ${
                  active
                    ? "bg-[#d8a646]"
                    : done
                      ? "bg-[#c9a227]/70 hover:bg-[#c9a227]"
                      : "bg-[#31445d] hover:bg-[#48617f]"
                }`}
              />
            );
          })}
        </div>
      </div>

      {/* Step heading */}
      <div className="mb-3 flex items-center gap-3">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-[#d8a646] bg-[#d8a646] text-[#05090e]">
          <Icon size={22} />
        </span>
        <div>
          <h1 className="text-2xl font-bold leading-tight text-white">{current?.label}</h1>
          {guide?.headline && <p className="text-sm text-[#b8c6d6]">{guide.headline}</p>}
        </div>
      </div>

      {/* Plain-language guide */}
      {guide && (guide.points.length > 0 || guide.reassure || guide.terms?.length) && (
        <div className="mb-5 rounded-lg border border-[#d8a646]/40 bg-[#0b1726] p-4">
          {guide.points.length > 0 && (
            <ul className="space-y-2">
              {guide.points.map((point, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-[#f3e5c1]">
                  <Lightbulb size={15} className="mt-0.5 shrink-0 text-[#f2d269]" />
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          )}
          {guide.reassure && (
            <p className="mt-3 flex items-start gap-2 rounded-md bg-[#102234] px-3 py-2 text-xs text-[#9fd5c9]">
              <Check size={14} className="mt-0.5 shrink-0" />
              <span>{guide.reassure}</span>
            </p>
          )}
          {guide.terms && guide.terms.length > 0 && (
            <div className="mt-3 border-t border-[#d8a646]/20 pt-3">
              <TermChips terms={guide.terms} />
            </div>
          )}
        </div>
      )}

      {/* The actual step */}
      <div className="rounded-lg border border-[#263545] bg-[#1c242e] p-4 sm:p-5">{children}</div>

      {/* Character-so-far summary (collapsed by default to stay calm) */}
      <div className="mt-5 rounded-lg border border-[#263545] bg-[#161b22]">
        <button
          type="button"
          onClick={() => setSummaryOpen((open) => !open)}
          className="flex w-full items-center justify-between px-4 py-3 text-left"
        >
          <span className="text-sm font-semibold text-white">Your hero so far</span>
          <span className="flex items-center gap-3 text-xs text-[#b99762]">
            <span className="flex items-center gap-1">
              <Shield size={12} /> AC {summary.ac}
            </span>
            <span className="flex items-center gap-1">
              <Heart size={12} /> {summary.hp} HP
            </span>
            <ChevronDown
              size={16}
              className={`transition-transform ${summaryOpen ? "rotate-180" : ""}`}
            />
          </span>
        </button>
        {summaryOpen && (
          <div className="grid grid-cols-2 gap-2 border-t border-[#263545] px-4 py-3 text-sm sm:grid-cols-3">
            <SummaryItem label="Name" value={summary.name || "Unnamed hero"} />
            <SummaryItem label="Level" value={String(summary.level)} />
            <SummaryItem label="Ancestry" value={summary.ancestry || "—"} />
            <SummaryItem label="Class" value={summary.className || "—"} />
            <SummaryItem label="AC" value={String(summary.ac)} />
            <SummaryItem label="HP" value={String(summary.hp)} />
          </div>
        )}
      </div>

      {/* Big, obvious navigation */}
      <div className="mt-5 flex items-center justify-between gap-3 pb-2">
        <button
          type="button"
          onClick={onBack}
          disabled={isFirst}
          className="inline-flex items-center gap-2 rounded-md border border-[#31445d] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#202831] disabled:opacity-40"
        >
          <ArrowLeft size={16} />
          Back
        </button>
        {!isLast ? (
          <button
            type="button"
            onClick={onNext}
            className="inline-flex items-center gap-2 rounded-md border border-[#d8a646] bg-[#d8a646] px-6 py-2.5 text-base font-semibold text-[#05090e] hover:bg-[#e6b754]"
          >
            Continue
            <ArrowRight size={18} />
          </button>
        ) : (
          <span className="text-sm text-[#9fd5c9]">Finish up below 🎉</span>
        )}
      </div>
      </div>
    </div>
  );
}

function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wide text-[#b99762]">{label}</p>
      <p className="truncate font-semibold text-white">{value}</p>
    </div>
  );
}
