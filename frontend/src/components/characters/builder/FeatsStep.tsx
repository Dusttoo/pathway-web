"use client";

import { useMemo, useState } from "react";
import { Plus, X, Search, Loader2 } from "lucide-react";
import { useFeats, type FeatParams } from "@/lib/hooks/use-feats";
import type { StepProps, BuilderState } from "./types";
import type { Tables } from "@/lib/types/database.types";

type Feat = Tables<"feats">;
type FeatSlot = BuilderState["selectedFeats"][number]["feat_slot"];

type SlotDef = {
  slot: FeatSlot;
  label: string;
  featType: string;
  filterParams: (state: BuilderState) => FeatParams;
};

const SLOT_DEFS: SlotDef[] = [
  {
    slot: "ancestry",
    label: "Ancestry Feat",
    featType: "ancestry",
    filterParams: (s) => ({
      feat_type: "ancestry",
      ancestry: s.ancestryName,
      heritage: s.heritageName,
      level_max: s.level,
    }),
  },
  {
    slot: "class",
    label: "Class Feat",
    featType: "class_feat",
    filterParams: (s) => ({ feat_type: "class_feat", class: s.className, level_max: s.level }),
  },
  {
    slot: "skill",
    label: "Skill Feat",
    featType: "skill",
    filterParams: (s) => ({ feat_type: "skill", level_max: s.level }),
  },
  {
    slot: "general",
    label: "General Feat",
    featType: "general",
    filterParams: (s) => ({ feat_type: "general", level_max: s.level }),
  },
];

export function FeatsStep({ state, update, onNext, onBack }: StepProps) {
  const [activeSlot, setActiveSlot] = useState<SlotDef>(SLOT_DEFS[0]);
  const [searchQ, setSearchQ] = useState("");
  const [levelAcquired, setLevelAcquired] = useState(1);

  const params: FeatParams = useMemo(
    () => ({
      ...activeSlot.filterParams(state),
      q: searchQ || undefined,
      limit: 50,
    }),
    [activeSlot, state, searchQ]
  );

  const { data, isLoading } = useFeats(params);
  const feats: Feat[] = data?.data ?? [];

  const selectedIds = new Set(state.selectedFeats.map((f) => `${f.feat_id}:${f.level_acquired}`));

  function addFeat(feat: Feat) {
    const key = `${feat.id}:${levelAcquired}`;
    if (selectedIds.has(key)) return;
    update({
      selectedFeats: [
        ...state.selectedFeats,
        {
          feat_id: feat.id,
          feat_name: feat.name,
          feat_slot: activeSlot.slot,
          level_acquired: levelAcquired,
        },
      ],
    });
  }

  function removeFeat(featId: string, level: number) {
    update({
      selectedFeats: state.selectedFeats.filter(
        (f) => !(f.feat_id === featId && f.level_acquired === level)
      ),
    });
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold mb-1">Feats</h2>
        <p className="text-sm text-muted-foreground">
          Pick feats from Archives of Nethys. You can skip any slot and add feats later from the
          character sheet.
        </p>
      </div>

      {/* Slot tabs */}
      <div className="flex flex-wrap gap-2 border-b border-border pb-3">
        {SLOT_DEFS.map((slot) => {
          const count = state.selectedFeats.filter((f) => f.feat_slot === slot.slot).length;
          const active = activeSlot.slot === slot.slot;
          return (
            <button
              key={slot.slot}
              type="button"
              onClick={() => setActiveSlot(slot)}
              className={`px-3 py-1.5 rounded-md text-sm transition-colors ${
                active
                  ? "bg-primary text-primary-foreground font-medium"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {slot.label}
              {count > 0 && <span className="ml-2 text-xs opacity-75">({count})</span>}
            </button>
          );
        })}
      </div>

      {/* Search + level acquired */}
      <div className="grid grid-cols-3 gap-2">
        <div className="col-span-2 relative">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <input
            type="text"
            className="input w-full pl-8"
            placeholder={`Search ${activeSlot.label.toLowerCase()}s…`}
            value={searchQ}
            onChange={(e) => setSearchQ(e.target.value)}
          />
        </div>
        <div>
          <select
            className="input w-full"
            value={levelAcquired}
            onChange={(e) => setLevelAcquired(parseInt(e.target.value, 10))}
            title="Level at which the feat is acquired"
          >
            {Array.from({ length: state.level }, (_, i) => i + 1).map((lvl) => (
              <option key={lvl} value={lvl}>
                Lvl {lvl}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Results list */}
      <div className="border border-border rounded-md max-h-96 overflow-y-auto divide-y divide-border">
        {isLoading && (
          <div className="p-4 flex items-center gap-2 text-muted-foreground text-sm">
            <Loader2 size={14} className="animate-spin" /> Loading feats…
          </div>
        )}
        {!isLoading && feats.length === 0 && (
          <div className="p-4 text-sm text-muted-foreground">
            No feats found. Run{" "}
            <code className="text-xs bg-muted px-1 rounded">npx tsx scripts/seed_nethys.ts</code> to
            populate.
          </div>
        )}
        {feats.map((feat) => {
          const key = `${feat.id}:${levelAcquired}`;
          const alreadyAdded = selectedIds.has(key);
          return (
            <div key={feat.id} className="p-3 flex items-start gap-3 hover:bg-muted/30">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-sm">{feat.name}</span>
                  <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded">
                    Lvl {feat.level}
                  </span>
                  {feat.action_cost && (
                    <span className="text-[10px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded font-mono">
                      {feat.action_cost}
                    </span>
                  )}
                  {feat.rarity && feat.rarity !== "Common" && (
                    <span className="text-[10px] text-amber-500">{feat.rarity}</span>
                  )}
                </div>
                {feat.prerequisites && (
                  <p className="text-xs text-muted-foreground mt-0.5 italic">
                    Prereq: {feat.prerequisites}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => addFeat(feat)}
                disabled={alreadyAdded}
                className="btn-outline px-2 py-1 text-xs disabled:opacity-40 flex items-center gap-1 shrink-0"
              >
                {alreadyAdded ? (
                  "Added"
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

      {/* Selected chips */}
      {state.selectedFeats.length > 0 && (
        <div className="space-y-2">
          <label className="block text-sm font-medium">
            Selected ({state.selectedFeats.length})
          </label>
          <div className="flex flex-wrap gap-2">
            {state.selectedFeats.map((f) => (
              <span
                key={`${f.feat_id}:${f.level_acquired}`}
                className="flex items-center gap-1.5 bg-muted px-2.5 py-1 rounded-full text-xs"
              >
                <span className="text-[10px] uppercase text-muted-foreground">{f.feat_slot}</span>
                <span className="font-medium">{f.feat_name}</span>
                <span className="text-muted-foreground">L{f.level_acquired}</span>
                <button
                  type="button"
                  onClick={() => removeFeat(f.feat_id, f.level_acquired)}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <X size={11} />
                </button>
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="flex justify-between pt-2">
        <button type="button" onClick={onBack} className="btn-outline px-6">
          ← Back
        </button>
        <button type="button" onClick={onNext} className="btn-primary px-6">
          Next →
        </button>
      </div>
    </div>
  );
}
