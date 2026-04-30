"use client";

import { MainLayout } from "@/components/layout";
import { useEncounterDetail, useEncounterEvents } from "@/lib/hooks/use-sessions";
import type { Combatant, Encounter, EncounterEvent } from "@/lib/types/bot-integration";
import {
  ArrowLeft,
  Swords,
  Clock,
  Users,
  Skull,
  Heart,
  Star,
  Zap,
  Shield,
  PlayCircle,
  StopCircle,
  Crosshair,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
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

function d(data: Record<string, unknown>, key: string): unknown {
  return data[key];
}

// ── Event rendering ───────────────────────────────────────────────────────────

const EVENT_ICONS: Record<string, React.ElementType> = {
  initiative_start: PlayCircle,
  initiative_end:   StopCircle,
  attack:           Crosshair,
  damage:           Crosshair,
  death:            Skull,
  recovery:         Heart,
  xp_award:         Star,
  effect_add:       Zap,
  effect_expire:    Zap,
  heal:             Heart,
};

const EVENT_COLORS: Record<string, string> = {
  initiative_start: "text-green-400 bg-green-500/10",
  initiative_end:   "text-muted-foreground bg-muted",
  attack:           "text-primary bg-primary/10",
  damage:           "text-primary bg-primary/10",
  death:            "text-destructive bg-destructive/10",
  recovery:         "text-orange-400 bg-orange-500/10",
  xp_award:         "text-yellow-400 bg-yellow-500/10",
  effect_add:       "text-blue-400 bg-blue-500/10",
  effect_expire:    "text-muted-foreground bg-muted",
  heal:             "text-green-400 bg-green-500/10",
};

function describeEvent(event: EncounterEvent): string {
  const { event_type, actor, target, data } = event;

  switch (event_type) {
    case "initiative_start":
      return actor ? `${actor} started combat` : "Combat started";
    case "initiative_end":
      return actor ? `${actor} ended combat` : "Combat ended";
    case "attack": {
      const hit = d(data, "hit") as boolean | undefined;
      const crit = d(data, "crit") as boolean | undefined;
      const dmg = d(data, "damage") as number | undefined;
      const roll = d(data, "roll") as number | undefined;
      if (hit === false) {
        return `${actor ?? "?"} missed ${target ?? "?"}${roll != null ? ` (rolled ${roll})` : ""}`;
      }
      const hitLabel = crit ? "critically hit" : "hit";
      const parts = [`${actor ?? "?"} ${hitLabel} ${target ?? "?"}`];
      if (dmg != null) parts.push(`for ${dmg} damage`);
      if (roll != null) parts.push(`(rolled ${roll})`);
      return parts.join(" ");
    }
    case "damage": {
      const dmg = d(data, "damage") as number | undefined;
      return `${target ?? "?"} took ${dmg ?? "?"} damage from ${actor ?? "?"}`;
    }
    case "heal": {
      const amt = d(data, "amount") as number | undefined;
      return `${target ?? actor ?? "?"} healed ${amt ?? "?"} HP`;
    }
    case "death":
      return `${target ?? actor ?? "?"} died`;
    case "recovery": {
      const awoke = d(data, "awoke") as boolean | undefined;
      const roll = d(data, "roll") as number | undefined;
      const dc = d(data, "dc") as number | undefined;
      const result = awoke ? "stabilized" : "worsened";
      const rollStr = roll != null && dc != null ? ` (rolled ${roll} vs DC ${dc})` : "";
      return `${actor ?? "?"} ${result}${rollStr}`;
    }
    case "xp_award": {
      const xp = d(data, "xp") as number | undefined;
      return xp != null ? `Party awarded ${xp} XP` : "XP awarded";
    }
    case "effect_add": {
      const effect = d(data, "effect") as string | undefined;
      return `${effect ?? "Effect"} applied to ${target ?? actor ?? "?"}`;
    }
    case "effect_expire": {
      const effect = d(data, "effect") as string | undefined;
      return `${effect ?? "Effect"} expired on ${target ?? actor ?? "?"}`;
    }
    default:
      return `${event_type}${actor ? ` by ${actor}` : ""}`;
  }
}

// ── Event row ─────────────────────────────────────────────────────────────────

function EventRow({ event }: { event: EncounterEvent }) {
  const Icon = EVENT_ICONS[event.event_type] ?? Zap;
  const color = EVENT_COLORS[event.event_type] ?? "text-muted-foreground bg-muted";

  return (
    <div className="flex items-start gap-3 py-2">
      <div className={`p-1.5 rounded-md shrink-0 mt-0.5 ${color}`}>
        <Icon size={12} />
      </div>
      <p className="text-sm text-foreground leading-snug">{describeEvent(event)}</p>
    </div>
  );
}

// ── Round section ─────────────────────────────────────────────────────────────

function RoundSection({
  round,
  events,
}: {
  round: number | null;
  events: EncounterEvent[];
}) {
  return (
    <div className="card p-4">
      <div className="flex items-center gap-2 mb-3 pb-2 border-b border-border">
        <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
          <span className="text-xs font-bold text-primary">
            {round ?? "—"}
          </span>
        </div>
        <span className="text-sm font-semibold">
          {round == null ? "Setup / Teardown" : `Round ${round}`}
        </span>
        <span className="text-xs text-muted-foreground ml-auto">
          {events.length} event{events.length !== 1 ? "s" : ""}
        </span>
      </div>
      <div className="divide-y divide-border/50">
        {events.map((e) => (
          <EventRow key={e.id} event={e} />
        ))}
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function SessionDetailPage() {
  const params = useParams();
  const encounterId = params.id as string;

  const { data: encounter, isLoading: loadingEnc, error: encError } = useEncounterDetail(encounterId);
  const { data: events, isLoading: loadingEvents } = useEncounterEvents(encounterId);

  const isLoading = loadingEnc || loadingEvents;

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center py-12">
          <div className="spinner" />
        </div>
      </MainLayout>
    );
  }

  if (encError || !encounter) {
    return (
      <MainLayout>
        <div className="card p-6 bg-destructive/10 border-destructive">
          <p className="text-destructive font-semibold">Session not found</p>
          <p className="text-sm text-muted-foreground mt-1">{encError?.message}</p>
          <Link href="/sessions" className="mt-4 inline-flex items-center gap-2 text-sm text-primary">
            <ArrowLeft size={14} /> Back to sessions
          </Link>
        </div>
      </MainLayout>
    );
  }

  const pcs  = (encounter.combatants as Combatant[]).filter((c) => !c.isNpc);
  const npcs = (encounter.combatants as Combatant[]).filter((c) => c.isNpc);

  // Group events by round (null = before/after rounds)
  const byRound = new Map<number | null, EncounterEvent[]>();
  for (const e of events ?? []) {
    const key = e.round ?? null;
    if (!byRound.has(key)) byRound.set(key, []);
    byRound.get(key)!.push(e);
  }

  // Sort: null round last (teardown), numbered rounds ascending
  const roundOrder = [...byRound.keys()].sort((a, b) => {
    if (a === null) return 1;
    if (b === null) return -1;
    return a - b;
  });

  const deaths = (events ?? []).filter((e) => e.event_type === "death").length;
  const xpEvent = (events ?? []).find((e) => e.event_type === "xp_award");
  const xpAwarded = xpEvent ? (xpEvent.data.xp as number | undefined) : undefined;

  return (
    <MainLayout>
      <div className="mb-6">
        <Link
          href="/sessions"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeft size={16} />
          Back to Sessions
        </Link>

        {/* Header */}
        <div className="card p-5 mb-4">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="font-heading text-3xl font-bold">
                {formatDate(encounter.started_at)}
              </h1>
              <p className="text-sm text-muted-foreground mt-1 font-mono">
                {encounter.discord_guild_id}
              </p>
            </div>
            <span className="text-xs bg-muted text-muted-foreground px-3 py-1 rounded-full">
              {encounter.status}
            </span>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <p className="text-2xl font-bold">{encounter.round}</p>
              <p className="text-xs text-muted-foreground mt-0.5">Rounds</p>
            </div>
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <p className="text-2xl font-bold flex items-center justify-center gap-1">
                <Clock size={18} className="text-muted-foreground" />
                {formatDuration(encounter.started_at, encounter.ended_at)}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">Duration</p>
            </div>
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <p className="text-2xl font-bold flex items-center justify-center gap-1">
                <Users size={18} className="text-muted-foreground" />
                {pcs.length}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">Players</p>
            </div>
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <p className="text-2xl font-bold">
                {deaths > 0 ? (
                  <span className="text-destructive">{deaths}</span>
                ) : (
                  <span className="text-green-400">0</span>
                )}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">Deaths</p>
            </div>
          </div>

          {/* PC names + XP */}
          <div className="mt-4 flex flex-wrap items-center gap-2">
            {pcs.map((pc) => (
              <span key={pc.name} className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                {pc.name}
              </span>
            ))}
            {npcs.length > 0 && (
              <span className="text-xs text-muted-foreground">
                vs {npcs.length} NPC{npcs.length !== 1 ? "s" : ""}
              </span>
            )}
            {xpAwarded != null && (
              <span className="ml-auto text-xs flex items-center gap-1 text-yellow-400 bg-yellow-500/10 px-2 py-0.5 rounded-full">
                <Star size={10} /> {xpAwarded} XP
              </span>
            )}
          </div>
        </div>

        {/* Stat recap badges */}
        <div className="flex items-center gap-2 mb-4 text-sm text-muted-foreground">
          <Shield size={14} className="text-primary" />
          <span>
            {(events ?? []).length} event{(events ?? []).length !== 1 ? "s" : ""} across{" "}
            {roundOrder.filter((r) => r !== null).length} round
            {roundOrder.filter((r) => r !== null).length !== 1 ? "s" : ""}
          </span>
        </div>
      </div>

      {/* Event timeline */}
      {roundOrder.length === 0 ? (
        <div className="card p-8 text-center border-dashed text-muted-foreground text-sm">
          No events were recorded for this session.
        </div>
      ) : (
        <div className="space-y-3">
          {roundOrder.map((round) => (
            <RoundSection
              key={round ?? "null"}
              round={round}
              events={byRound.get(round) ?? []}
            />
          ))}
        </div>
      )}
    </MainLayout>
  );
}
