"use client";

import { MainLayout } from "@/components/layout";
import { useActiveEncounters } from "@/lib/hooks/use-encounter";
import type { Combatant, Encounter } from "@/lib/types/bot-integration";
import {
  Swords,
  Shield,
  Heart,
  ChevronRight,
  Flame,
  Radio,
  Clock,
  CheckCircle2,
} from "lucide-react";

// ── Helpers ──────────────────────────────────────────────────────────────────

function hpColor(current: number, max: number) {
  if (max <= 0) return "bg-muted";
  const pct = current / max;
  if (pct > 0.66) return "bg-chart-2";
  if (pct > 0.33) return "bg-chart-5";
  if (pct > 0) return "bg-destructive";
  return "bg-muted";
}

function formatElapsed(startedAt: string) {
  const diff = Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
}

// ── Combatant row ─────────────────────────────────────────────────────────────

function CombatantRow({
  combatant,
  isActive,
}: {
  combatant: Combatant;
  isActive: boolean;
}) {
  const hpPct = combatant.maxHp > 0
    ? Math.max(0, Math.min(100, ((combatant.hp ?? 0) / combatant.maxHp) * 100))
    : 0;

  const conditions = combatant.effects?.filter((e) => e.duration !== 0) ?? [];

  return (
    <div
      className={`relative rounded-lg border-2 transition-all duration-300 ${
        isActive
          ? "border-primary bg-primary/5 shadow-md shadow-primary/20"
          : "border-border bg-card"
      }`}
    >
      {/* Active turn indicator */}
      {isActive && (
        <div className="absolute -left-0.5 top-1/2 -translate-y-1/2 w-1 h-10 bg-primary rounded-r-full" />
      )}

      <div className="p-3 pl-4">
        <div className="flex items-center gap-3">
          {/* Initiative badge */}
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
              combatant.isNpc
                ? "bg-destructive/20 text-destructive border border-destructive/40"
                : "bg-primary/20 text-primary border border-primary/40"
            }`}
          >
            {combatant.initiative}
          </div>

          {/* Name + type */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className={`font-semibold truncate ${isActive ? "text-primary" : ""}`}>
                {combatant.name}
              </span>
              {isActive && (
                <span className="text-xs font-medium text-primary bg-primary/10 px-1.5 py-0.5 rounded shrink-0">
                  Active
                </span>
              )}
              {combatant.delayed && (
                <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded shrink-0">
                  Delayed
                </span>
              )}
            </div>

            {/* HP bar */}
            <div className="mt-1.5 flex items-center gap-2">
              <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${hpColor(combatant.hp, combatant.maxHp)}`}
                  style={{ width: `${hpPct}%` }}
                />
              </div>
              <span className="text-xs font-mono text-muted-foreground shrink-0">
                {combatant.hp}/{combatant.maxHp}
              </span>
            </div>

            {/* Status badges */}
            {((combatant.dying ?? 0) > 0 ||
              (combatant.wounded ?? 0) > 0 ||
              conditions.length > 0) && (
              <div className="mt-1.5 flex flex-wrap gap-1">
                {(combatant.dying ?? 0) > 0 && (
                  <span className="flex items-center gap-0.5 text-xs text-destructive bg-destructive/10 px-1.5 py-0.5 rounded-full">
                    <Heart size={9} /> Dying {combatant.dying}
                  </span>
                )}
                {(combatant.wounded ?? 0) > 0 && (
                  <span className="flex items-center gap-0.5 text-xs text-orange-400 bg-orange-500/10 px-1.5 py-0.5 rounded-full">
                    <Flame size={9} /> Wounded {combatant.wounded}
                  </span>
                )}
                {conditions.map((e, i) => (
                  <span
                    key={i}
                    className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full"
                  >
                    {e.name}
                    {e.value ? ` ${e.value}` : ""}
                    {e.duration !== null ? ` (${e.duration}r)` : ""}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* AC */}
          {combatant.ac !== null && combatant.ac !== undefined && (
            <div className="flex flex-col items-center shrink-0">
              <Shield size={14} className="text-muted-foreground mb-0.5" />
              <span className="text-sm font-bold">{combatant.ac}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Encounter card ─────────────────────────────────────────────────────────────

function EncounterCard({ encounter }: { encounter: Encounter }) {
  const pcs = encounter.combatants.filter((c) => !c.isNpc);
  const npcs = encounter.combatants.filter((c) => c.isNpc);
  const ended = encounter.status === "ended";

  return (
    <div className={`space-y-3 transition-opacity duration-500 ${ended ? "opacity-60" : ""}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${ended ? "bg-muted" : "bg-primary/10"}`}>
            <Swords size={18} className={ended ? "text-muted-foreground" : "text-primary"} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-heading font-bold text-lg">Round {encounter.round}</h2>
              <span
                key={ended ? "ended" : "live"}
                className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium animate-fade-in ${
                  ended
                    ? "text-muted-foreground bg-muted"
                    : "text-green-400 bg-green-500/10"
                }`}
              >
                {ended ? (
                  <><CheckCircle2 size={9} /> Ended</>
                ) : (
                  <><Radio size={9} className="animate-pulse" /> Live</>
                )}
              </span>
            </div>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock size={11} />
              Started {formatElapsed(encounter.started_at)} ·{" "}
              {pcs.length} PC{pcs.length !== 1 ? "s" : ""},{" "}
              {npcs.length} NPC{npcs.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
        {ended && (
          <p className="text-xs text-muted-foreground italic">Final standings</p>
        )}
      </div>

      {/* Combatant list */}
      {encounter.combatants.length === 0 ? (
        <div className="card p-6 text-center text-sm text-muted-foreground border-dashed">
          Waiting for combatants to join…
        </div>
      ) : (
        <div className="space-y-2">
          {encounter.combatants.map((c, i) => (
            <CombatantRow
              key={`${c.name}-${i}`}
              combatant={c}
              // No active turn highlight once combat is over
              isActive={!ended && i === encounter.turn_index}
            />
          ))}
        </div>
      )}

      {/* Turn pointer — only when active */}
      {!ended && encounter.combatants.length > 0 && (
        <div className="flex items-center gap-2 pt-1 text-sm text-muted-foreground">
          <ChevronRight size={14} className="text-primary" />
          <span>
            <span className="text-foreground font-medium">
              {encounter.combatants[encounter.turn_index]?.name ?? "—"}
            </span>
            {"'s turn"}
          </span>
        </div>
      )}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function CombatPage() {
  const { data: encounters, isLoading, error } = useActiveEncounters();

  return (
    <MainLayout>
      <div className="mb-6">
        <h1 className="font-heading text-3xl font-bold">Combat Tracker</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Live view of active encounters — updates automatically as the GM runs
          combat in Discord.
        </p>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="spinner" />
        </div>
      )}

      {error && (
        <div className="card p-4 bg-destructive/10 border-destructive text-destructive text-sm">
          Failed to load encounters: {error.message}
        </div>
      )}

      {!isLoading && !error && encounters?.length === 0 && (
        <div className="card p-10 text-center border-dashed">
          <Swords size={36} className="mx-auto text-muted-foreground/40 mb-4" />
          <p className="font-semibold text-muted-foreground">No active combat</p>
          <p className="text-sm text-muted-foreground mt-1">
            Start an encounter in Discord with{" "}
            <code className="bg-muted px-1 rounded text-xs">/init start</code> and
            it will appear here automatically.
          </p>
        </div>
      )}

      {encounters && encounters.length > 0 && (
        <div className="space-y-8">
          {encounters.map((enc) => (
            <div key={enc.id} className="card p-5">
              <EncounterCard encounter={enc} />
            </div>
          ))}
        </div>
      )}
    </MainLayout>
  );
}
