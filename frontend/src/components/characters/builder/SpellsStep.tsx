"use client";

import { useEffect, useState } from "react";
import { Plus, X, Search, Loader2, Sparkles } from "lucide-react";
import { useSpells } from "@/lib/hooks/use-spells";
import { useClassDetail } from "@/lib/hooks/use-builder-data";
import type { StepProps, BuilderState } from "./types";
import type { Tables } from "@/lib/types/database.types";

type Spell = Tables<"spells">;
type Tradition = BuilderState["selectedSpells"][number]["tradition"];
type SpellSource = BuilderState["selectedSpells"][number]["spell_source"];

// Fixed-tradition classes. Variable-tradition classes (Sorcerer, Witch, Summoner)
// keep all four tabs available so the player picks per bloodline/patron/eidolon.
const CLASS_TRADITION: Record<string, Tradition> = {
  bard: "occult",
  cleric: "divine",
  druid: "primal",
  wizard: "arcane",
  magus: "arcane",
  oracle: "divine",
  psychic: "occult",
  animist: "divine",
};

// Prepared classes write to "spellbook"-style sources at builder time
// (the daily-prep workflow lives on the sheet). Spontaneous classes
// write to "repertoire".
const SPONTANEOUS = new Set(["bard", "oracle", "sorcerer", "summoner", "psychic"]);

const TRADITIONS: Tradition[] = ["arcane", "divine", "occult", "primal"];

function maxRankForLevel(level: number): number {
  return Math.min(10, Math.max(1, Math.ceil(level / 2)));
}

function classMetadataValue(classDetail: unknown, key: string): unknown {
  if (!classDetail || typeof classDetail !== "object") return undefined;
  const metadata = (classDetail as { class_metadata?: unknown }).class_metadata;
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) return undefined;
  return (metadata as Record<string, unknown>)[key];
}

export function SpellsStep({ state, update, onNext, onBack }: StepProps) {
  const { data: classDetail } = useClassDetail(state.classId || null);

  const classKey = state.className.toLowerCase();
  const metadataTradition = classMetadataValue(classDetail, "spellcasting_tradition");
  const metadataType = classMetadataValue(classDetail, "spellcasting_type");
  const defaultTradition: Tradition =
    typeof metadataTradition === "string" && TRADITIONS.includes(metadataTradition as Tradition)
      ? (metadataTradition as Tradition)
      : CLASS_TRADITION[classKey] ?? "arcane";
  const defaultSource: SpellSource =
    metadataType === "spontaneous" || (!metadataType && SPONTANEOUS.has(classKey))
      ? "repertoire"
      : "spellbook";

  const [tradition, setTradition] = useState<Tradition>(defaultTradition);
  const [spellSource, setSpellSource] = useState<SpellSource>(defaultSource);
  const [rank, setRank] = useState(0);
  const [searchQ, setSearchQ] = useState("");

  const maxRank = maxRankForLevel(state.level);

  useEffect(() => {
    setTradition(defaultTradition);
    setSpellSource(defaultSource);
  }, [defaultTradition, defaultSource]);

  const { data, isLoading } = useSpells({
    q: searchQ || undefined,
    tradition,
    level: rank,
    include_homebrew: true,
    limit: 50,
  });
  const spells: Spell[] = data?.data ?? [];

  const selectedKeys = new Set(
    state.selectedSpells.map((s) => `${s.spell_id}:${s.tradition}:${s.spell_source}`)
  );

  function addSpell(spell: Spell) {
    const key = `${spell.id}:${tradition}:${spellSource}`;
    if (selectedKeys.has(key)) return;
    update({
      selectedSpells: [
        ...state.selectedSpells,
        {
          spell_id: spell.id,
          spell_name: spell.name,
          tradition,
          rank: spell.level,
          spell_source: spellSource,
        },
      ],
    });
  }

  function removeSpell(spellId: string, tr: Tradition, src: SpellSource) {
    update({
      selectedSpells: state.selectedSpells.filter(
        (s) => !(s.spell_id === spellId && s.tradition === tr && s.spell_source === src)
      ),
    });
  }

  // Non-spellcaster: render a skip card instead of the picker.
  if (classDetail && !classDetail.is_spellcaster) {
    return (
      <div className="space-y-5">
        <div>
          <h2 className="text-lg font-semibold mb-1">Spells</h2>
          <p className="text-sm text-muted-foreground">
            {state.className} is not a spellcasting class. Skip ahead.
          </p>
        </div>
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

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold mb-1 flex items-center gap-2">
          <Sparkles size={18} className="text-primary" /> Spells
        </h2>
        <p className="text-sm text-muted-foreground">
          {SPONTANEOUS.has(classKey)
            ? "Spontaneous caster — pick the spells in your repertoire."
            : "Prepared caster — pick the spells you know (daily prep happens on the sheet)."}
        </p>
      </div>

      {/* Tradition tabs */}
      <div className="flex flex-wrap gap-2 border-b border-border pb-3">
        {TRADITIONS.map((t) => {
          const count = state.selectedSpells.filter((s) => s.tradition === t).length;
          const active = tradition === t;
          return (
            <button
              key={t}
              type="button"
              onClick={() => setTradition(t)}
              className={`px-3 py-1.5 rounded-md text-sm capitalize transition-colors ${
                active
                  ? "bg-primary text-primary-foreground font-medium"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {t}
              {count > 0 && <span className="ml-2 text-xs opacity-75">({count})</span>}
            </button>
          );
        })}
      </div>

      {/* Rank + source + search */}
      <div className="grid grid-cols-12 gap-2">
        <div className="col-span-3">
          <label className="block text-xs text-muted-foreground mb-1">Rank</label>
          <select
            className="input w-full"
            value={rank}
            onChange={(e) => setRank(parseInt(e.target.value, 10))}
          >
            <option value={0}>Cantrip</option>
            {Array.from({ length: maxRank }, (_, i) => i + 1).map((r) => (
              <option key={r} value={r}>
                Rank {r}
              </option>
            ))}
          </select>
        </div>
        <div className="col-span-3">
          <label className="block text-xs text-muted-foreground mb-1">Source</label>
          <select
            className="input w-full"
            value={spellSource}
            onChange={(e) => setSpellSource(e.target.value as SpellSource)}
          >
            <option value="spellbook">Spellbook</option>
            <option value="repertoire">Repertoire</option>
            <option value="innate">Innate</option>
            <option value="focus">Focus</option>
          </select>
        </div>
        <div className="col-span-6 relative">
          <label className="block text-xs text-muted-foreground mb-1">Search</label>
          <Search
            size={14}
            className="absolute left-3 top-[34px] text-muted-foreground pointer-events-none"
          />
          <input
            type="text"
            className="input w-full pl-8"
            placeholder={`Search ${tradition} spells…`}
            value={searchQ}
            onChange={(e) => setSearchQ(e.target.value)}
          />
        </div>
      </div>

      {/* Results */}
      <div className="border border-border rounded-md max-h-96 overflow-y-auto divide-y divide-border">
        {isLoading && (
          <div className="p-4 flex items-center gap-2 text-muted-foreground text-sm">
            <Loader2 size={14} className="animate-spin" /> Loading spells…
          </div>
        )}
        {!isLoading && spells.length === 0 && (
          <div className="p-4 text-sm text-muted-foreground">
            No spells found. Run{" "}
            <code className="text-xs bg-muted px-1 rounded">
              npx tsx scripts/seed_nethys.ts --only=spells
            </code>{" "}
            to populate.
          </div>
        )}
        {spells.map((spell) => {
          const key = `${spell.id}:${tradition}:${spellSource}`;
          const alreadyAdded = selectedKeys.has(key);
          return (
            <div key={spell.id} className="p-3 flex items-start gap-3 hover:bg-muted/30">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-sm">{spell.name}</span>
                  <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded">
                    {spell.level === 0 ? "Cantrip" : `R${spell.level}`}
                  </span>
                  {spell.cast_actions && (
                    <span className="text-[10px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded font-mono">
                      {spell.cast_actions}
                    </span>
                  )}
                  {spell.is_focus_spell && (
                    <span className="text-[10px] text-amber-500">Focus</span>
                  )}
                </div>
                {spell.range_text && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Range: {spell.range_text}
                    {spell.duration ? ` · Duration: ${spell.duration}` : ""}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => addSpell(spell)}
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
      {state.selectedSpells.length > 0 && (
        <div className="space-y-2">
          <label className="block text-sm font-medium">
            Selected ({state.selectedSpells.length})
          </label>
          <div className="flex flex-wrap gap-2">
            {state.selectedSpells.map((s) => (
              <span
                key={`${s.spell_id}:${s.tradition}:${s.spell_source}`}
                className="flex items-center gap-1.5 bg-muted px-2.5 py-1 rounded-full text-xs"
              >
                <span className="text-[10px] uppercase text-muted-foreground">
                  {s.tradition} · {s.spell_source}
                </span>
                <span className="font-medium">{s.spell_name}</span>
                <span className="text-muted-foreground">{s.rank === 0 ? "C" : `R${s.rank}`}</span>
                <button
                  type="button"
                  onClick={() => removeSpell(s.spell_id, s.tradition, s.spell_source)}
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
