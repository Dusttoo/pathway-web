"use client";

import { MainLayout } from "@/components/layout";
import { usePastEncounters } from "@/lib/hooks/use-sessions";
import type { Combatant, Encounter } from "@/lib/types/bot-integration";
import { ScrollText, Swords, Clock, Users, ChevronRight } from "lucide-react";
import Link from "next/link";

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatDuration(startedAt: string, endedAt: string | null) {
  if (!endedAt) return "—";
  const secs = Math.floor(
    (new Date(endedAt).getTime() - new Date(startedAt).getTime()) / 1000
  );
  if (secs < 60) return `${secs}s`;
  if (secs < 3600) return `${Math.floor(secs / 60)}m`;
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

// ── Session card ──────────────────────────────────────────────────────────────

function SessionCard({ encounter }: { encounter: Encounter }) {
  const pcs = ((encounter.combatants ?? []) as Combatant[]).filter((c) => !c.isNpc);
  const npcs = ((encounter.combatants ?? []) as Combatant[]).filter((c) => c.isNpc);

  return (
    <Link
      href={`/sessions/${encounter.id}`}
      className="card p-5 hover:shadow-md transition-all flex flex-col gap-3 group"
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-muted group-hover:bg-primary/10 transition-colors">
            <Swords size={16} className="text-muted-foreground group-hover:text-primary transition-colors" />
          </div>
          <div>
            <p className="font-semibold">
              {formatDate(encounter.started_at)}
              <span className="text-muted-foreground font-normal text-sm ml-2">
                {formatTime(encounter.started_at)}
              </span>
            </p>
            <p className="text-xs text-muted-foreground font-mono truncate max-w-[180px]">
              {encounter.discord_guild_id}
            </p>
          </div>
        </div>
        <ChevronRight size={16} className="text-muted-foreground group-hover:text-primary transition-colors mt-1 shrink-0" />
      </div>

      <div className="flex items-center gap-4 text-sm text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <Swords size={12} />
          {encounter.round} round{encounter.round !== 1 ? "s" : ""}
        </span>
        <span className="flex items-center gap-1.5">
          <Clock size={12} />
          {formatDuration(encounter.started_at, encounter.ended_at)}
        </span>
        <span className="flex items-center gap-1.5">
          <Users size={12} />
          {pcs.length} PC{pcs.length !== 1 ? "s" : ""}
          {npcs.length > 0 && `, ${npcs.length} NPC${npcs.length !== 1 ? "s" : ""}`}
        </span>
      </div>

      {pcs.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {pcs.map((pc) => (
            <span
              key={pc.name}
              className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full"
            >
              {pc.name}
            </span>
          ))}
        </div>
      )}
    </Link>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function SessionsPage() {
  const { data: encounters, isLoading, error } = usePastEncounters();

  return (
    <MainLayout>
      <div className="flex items-center gap-4 mb-8">
        <div className="p-3 rounded-lg bg-primary/10">
          <ScrollText className="h-8 w-8 text-primary" />
        </div>
        <div>
          <h1 className="font-heading text-4xl font-bold mb-1">Session History</h1>
          <p className="text-muted-foreground text-sm">
            Past encounters from Discord — click any session for the full event log.
          </p>
        </div>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="spinner" />
        </div>
      )}

      {error && (
        <div className="card p-4 bg-destructive/10 border-destructive text-destructive text-sm">
          Failed to load sessions: {error.message}
        </div>
      )}

      {!isLoading && !error && encounters?.length === 0 && (
        <div className="card p-10 text-center border-dashed">
          <ScrollText size={36} className="mx-auto text-muted-foreground/40 mb-4" />
          <p className="font-semibold text-muted-foreground">No past sessions yet</p>
          <p className="text-sm text-muted-foreground mt-1">
            Completed encounters from Discord will appear here automatically.
          </p>
        </div>
      )}

      {encounters && encounters.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {encounters.map((enc) => (
            <SessionCard key={enc.id} encounter={enc} />
          ))}
        </div>
      )}
    </MainLayout>
  );
}
