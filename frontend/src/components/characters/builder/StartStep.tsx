"use client";

import { useState } from "react";
import { AlertCircle, ChevronDown } from "lucide-react";
import { useDiscordGuilds } from "@/lib/hooks/use-characters";
import { useAncestries, useAncestryDetail } from "@/lib/hooks/use-builder-data";
import type { StepProps } from "./types";

const ALIGNMENTS = [
  { value: "LG", label: "Lawful Good" },
  { value: "LN", label: "Lawful Neutral" },
  { value: "LE", label: "Lawful Evil" },
  { value: "NG", label: "Neutral Good" },
  { value: "N", label: "True Neutral" },
  { value: "NE", label: "Neutral Evil" },
  { value: "CG", label: "Chaotic Good" },
  { value: "CN", label: "Chaotic Neutral" },
  { value: "CE", label: "Chaotic Evil" },
];

function GuildPicker({ value, onChange }: { value: string; onChange: (id: string) => void }) {
  const { data: guilds, isLoading, error } = useDiscordGuilds();

  if (isLoading) {
    return (
      <div className="input w-full flex items-center gap-2 text-muted-foreground text-sm">
        <div className="spinner w-4 h-4" />
        Loading your servers...
      </div>
    );
  }

  if (error || !guilds?.length) {
    return (
      <div className="space-y-2">
        {error && (
          <div className="flex items-center gap-2 text-xs text-amber-500">
            <AlertCircle size={12} />
            Couldn't load servers - paste your Server ID instead.
          </div>
        )}
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="e.g. 1234567890123456789"
          className="input w-full font-mono"
        />
        <p className="text-xs text-muted-foreground">
          Right-click your server icon, then Copy Server ID with Developer Mode enabled.
        </p>
      </div>
    );
  }

  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="input w-full appearance-none pr-8"
      >
        <option value="">None (no Discord server)</option>
        {guilds.map((g) => (
          <option key={g.id} value={g.id}>
            {g.name}
          </option>
        ))}
      </select>
      <ChevronDown
        size={14}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
      />
    </div>
  );
}

export function StartStep({ state, update, onNext }: StepProps) {
  const [searchQ, setSearchQ] = useState("");

  const { data: ancestryPage, isLoading: loadingList } = useAncestries(searchQ);
  const { data: ancestryDetail, isLoading: loadingDetail } = useAncestryDetail(
    state.ancestryId || null
  );

  const ancestries = ancestryPage?.data ?? [];
  const ancestryHeritages = (ancestryDetail?.heritages ?? []).filter((h) => !h.is_versatile);
  const ancestryHeritageIds = new Set(ancestryHeritages.map((h) => h.id));
  const versatileHeritages = (ancestryDetail?.versatileHeritages ?? []).filter(
    (h) => !ancestryHeritageIds.has(h.id)
  );

  function handleAncestryChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const id = e.target.value;
    const row = ancestries.find((a) => a.id === id);
    if (!row) {
      update({
        ancestryId: "",
        ancestryName: "",
        ancestryHp: 8,
        ancestrySpeed: 25,
        ancestrySize: "Medium",
        heritageName: "",
        defaultLanguages: [],
      });
      return;
    }
    const langs = Array.isArray(row.languages) ? (row.languages as string[]) : [];
    update({
      ancestryId: row.id,
      ancestryName: row.name,
      ancestryHp: row.ancestry_hp ?? 8,
      ancestrySpeed: row.speed ?? 25,
      ancestrySize: row.size ?? "Medium",
      heritageName: "",
      defaultLanguages: langs,
      languages: langs,
    });
  }

  const canProceed = !!state.name.trim() && !!state.ancestryId && !!state.heritageName;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold mb-1">Start</h2>
        <p className="text-sm text-muted-foreground">
          Set the character identity, ancestry, and heritage.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="md:col-span-2">
          <label className="block text-sm font-medium mb-1">
            Character Name <span className="text-destructive">*</span>
          </label>
          <input
            className="input w-full"
            type="text"
            placeholder="e.g. Seraphina Blackwood"
            value={state.name}
            onChange={(e) => update({ name: e.target.value })}
            autoFocus
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Level</label>
          <input
            className="input w-full"
            type="text"
            inputMode="numeric"
            pattern="[0-9+-]*"
            min={1}
            max={20}
            value={state.level}
            onChange={(e) =>
              update({ level: Math.max(1, Math.min(20, parseInt(e.target.value) || 1)) })
            }
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Alignment</label>
          <div className="relative">
            <select
              className="input w-full appearance-none pr-8"
              value={state.alignment}
              onChange={(e) => update({ alignment: e.target.value })}
            >
              {ALIGNMENTS.map((alignment) => (
                <option key={alignment.value} value={alignment.value}>
                  {alignment.label} ({alignment.value})
                </option>
              ))}
            </select>
            <ChevronDown
              size={14}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Gender <span className="text-xs text-muted-foreground font-normal">(optional)</span>
          </label>
          <input
            className="input w-full"
            type="text"
            placeholder="Not set"
            value={state.gender}
            onChange={(e) => update({ gender: e.target.value })}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Age <span className="text-xs text-muted-foreground font-normal">(optional)</span>
          </label>
          <input
            className="input w-full"
            type="text"
            placeholder="Not set"
            value={state.age}
            onChange={(e) => update({ age: e.target.value })}
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium mb-1">
            Discord Server{" "}
            <span className="text-xs text-muted-foreground font-normal">(optional)</span>
          </label>
          <GuildPicker value={state.guildId} onChange={(id) => update({ guildId: id })} />
          <p className="text-xs text-muted-foreground mt-1">
            Link this character to a server for the Pathway bot to find it.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label className="block text-sm font-medium mb-1">
            Ancestry <span className="text-destructive">*</span>
          </label>
          <input
            className="input w-full mb-2"
            type="text"
            placeholder="Search ancestries..."
            value={searchQ}
            onChange={(e) => setSearchQ(e.target.value)}
          />
          <div className="relative">
            <select
              className="input w-full appearance-none pr-8"
              value={state.ancestryId}
              onChange={handleAncestryChange}
              disabled={loadingList}
            >
              <option value="">
                {loadingList ? "Loading ancestries..." : "Select an ancestry..."}
              </option>
              {ancestries.map((ancestry) => (
                <option key={ancestry.id} value={ancestry.id}>
                  {ancestry.name} - {ancestry.ancestry_hp} HP - {ancestry.speed} ft. -{" "}
                  {ancestry.size}
                </option>
              ))}
            </select>
            <ChevronDown
              size={14}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Heritage <span className="text-destructive">*</span>
          </label>
          <div className="relative">
            <select
              className="input w-full appearance-none pr-8"
              value={state.heritageName}
              onChange={(e) => update({ heritageName: e.target.value })}
              disabled={!state.ancestryId || loadingDetail}
            >
              <option value="">
                {loadingDetail ? "Loading heritages..." : "Select a heritage..."}
              </option>
              {ancestryHeritages.length > 0 && (
                <optgroup label={`${state.ancestryName} Heritages`}>
                  {ancestryHeritages.map((heritage) => (
                    <option key={heritage.id} value={heritage.name}>
                      {heritage.name}
                    </option>
                  ))}
                </optgroup>
              )}
              {versatileHeritages.length > 0 && (
                <optgroup label="Versatile Heritages">
                  {versatileHeritages.map((heritage) => (
                    <option key={heritage.id} value={heritage.name}>
                      {heritage.name}
                    </option>
                  ))}
                </optgroup>
              )}
            </select>
            <ChevronDown
              size={14}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
            />
          </div>
        </div>
      </div>

      {state.ancestryId && (
        <div className="flex flex-wrap gap-2">
          <span className="text-xs bg-primary/10 text-primary px-3 py-1 rounded-full font-medium">
            {state.ancestryName} - {state.ancestryHp} HP - {state.ancestrySpeed} ft. -{" "}
            {state.ancestrySize}
          </span>
          {state.heritageName && (
            <span className="text-xs bg-muted text-muted-foreground px-3 py-1 rounded-full">
              {state.heritageName}
            </span>
          )}
        </div>
      )}

      <div className="flex justify-end pt-2">
        <button
          type="button"
          onClick={onNext}
          disabled={!canProceed}
          className="btn-primary px-6 disabled:opacity-50"
        >
          Next →
        </button>
      </div>
    </div>
  );
}
