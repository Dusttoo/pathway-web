"use client";

import { AlertCircle, ChevronDown } from "lucide-react";
import type { StepProps } from "./types";
import { useDiscordGuilds } from "@/lib/hooks/use-characters";

const ALIGNMENTS = [
  { value: "LG", label: "Lawful Good"    },
  { value: "LN", label: "Lawful Neutral" },
  { value: "LE", label: "Lawful Evil"    },
  { value: "NG", label: "Neutral Good"   },
  { value: "N",  label: "True Neutral"   },
  { value: "NE", label: "Neutral Evil"   },
  { value: "CG", label: "Chaotic Good"   },
  { value: "CN", label: "Chaotic Neutral"},
  { value: "CE", label: "Chaotic Evil"   },
];

function GuildPicker({ value, onChange }: { value: string; onChange: (id: string) => void }) {
  const { data: guilds, isLoading, error } = useDiscordGuilds();

  if (isLoading) {
    return (
      <div className="input w-full flex items-center gap-2 text-muted-foreground text-sm">
        <div className="spinner w-4 h-4" />
        Loading your servers…
      </div>
    );
  }

  if (error || !guilds?.length) {
    return (
      <div className="space-y-2">
        {error && (
          <div className="flex items-center gap-2 text-xs text-amber-500">
            <AlertCircle size={12} />
            Couldn&apos;t load servers — paste your Server ID instead.
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
          Right-click your server icon → Copy Server ID (Developer Mode required).
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
          <option key={g.id} value={g.id}>{g.name}</option>
        ))}
      </select>
      <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
    </div>
  );
}

export function IdentityStep({ state, update, onNext }: StepProps) {
  const canProceed = state.name.trim().length > 0;

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold mb-1">Identity</h2>
        <p className="text-sm text-muted-foreground">Start with who your character is.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Name */}
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

        {/* Level */}
        <div>
          <label className="block text-sm font-medium mb-1">Level</label>
          <input
            className="input w-full"
            type="number"
            min={1}
            max={20}
            value={state.level}
            onChange={(e) => update({ level: Math.max(1, Math.min(20, parseInt(e.target.value) || 1)) })}
          />
        </div>

        {/* Alignment */}
        <div>
          <label className="block text-sm font-medium mb-1">Alignment</label>
          <div className="relative">
            <select
              className="input w-full appearance-none pr-8"
              value={state.alignment}
              onChange={(e) => update({ alignment: e.target.value })}
            >
              {ALIGNMENTS.map((a) => (
                <option key={a.value} value={a.value}>{a.label} ({a.value})</option>
              ))}
            </select>
            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          </div>
        </div>

        {/* Gender */}
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

        {/* Age */}
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

        {/* Discord server */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium mb-1">
            Discord Server <span className="text-xs text-muted-foreground font-normal">(optional)</span>
          </label>
          <GuildPicker value={state.guildId} onChange={(id) => update({ guildId: id })} />
          <p className="text-xs text-muted-foreground mt-1">
            Link this character to a server for the Pathway bot to find it.
          </p>
        </div>
      </div>

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
