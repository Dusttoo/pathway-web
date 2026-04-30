"use client";

import { MainLayout } from "@/components/layout";
import { HealthBar } from "@/components/characters/HealthBar";
import { useCharacterLive, useSyncCharacter } from "@/lib/hooks/use-characters";
import { useCharacterDowntime, type DowntimeLogEntry } from "@/lib/hooks/use-downtime";
import { useCharacterNotes, NOTE_CATEGORIES, NOTE_CATEGORY_ORDER, type BotNote } from "@/lib/hooks/use-notes";
import { useAuth } from "@/lib/providers/auth-provider";
import type { CharacterOverlay } from "@/lib/types/bot-integration";
import type { BotCompanion } from "@/lib/types/bot-integration";
import { ArrowLeft, Radio, Zap, Star, Heart, Flame, PawPrint, CalendarDays, BookOpen, RefreshCw } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";

// Pathbuilder build shape (top-level fields we care about)
interface PBBuild {
  name?: string;
  class?: string;
  ancestry?: string;
  heritage?: string;
  background?: string;
  level?: number;
  deity?: string;
  languages?: string[];
  keyability?: string;
  abilities?: { str: number; dex: number; con: number; int: number; wis: number; cha: number };
  proficiencies?: Record<string, number>;
  feats?: Array<[string, string | null, string | null, string | null] | string[]>;
  specials?: string[];
  equipment?: Array<[string, number]> | Array<{ name: string; qty: number }>;
  attributes?: { ancestryhp: number; classhp: number; bonushp: number; bonushpPerLevel: number };
  spellCasters?: Array<{ name: string; perDay: number[] }>;
}

function abilityMod(score: number) {
  const mod = Math.floor((score - 10) / 2);
  return mod >= 0 ? `+${mod}` : `${mod}`;
}

function profLabel(rank: number) {
  return ["Untrained", "Trained", "Expert", "Master", "Legendary"][rank] ?? "Untrained";
}

function deriveMaxHp(build: PBBuild, level: number): number | null {
  const attr = build.attributes;
  if (!attr) return null;
  const perLevel = (attr.classhp ?? 0) + (attr.bonushpPerLevel ?? 0);
  return (attr.ancestryhp ?? 0) + perLevel * level + (attr.bonushp ?? 0);
}

function AbilityBlock({ label, score }: { label: string; score: number }) {
  return (
    <div className="flex flex-col items-center p-3 bg-muted rounded-md">
      <span className="text-xs text-muted-foreground uppercase tracking-wide">{label}</span>
      <span className="text-2xl font-bold">{abilityMod(score)}</span>
      <span className="text-xs text-muted-foreground">{score}</span>
    </div>
  );
}

function Section({ title, children, badge }: { title: string; children: React.ReactNode; badge?: React.ReactNode }) {
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between border-b border-border pb-2 mb-3">
        <h3 className="font-semibold">{title}</h3>
        {badge}
      </div>
      {children}
    </div>
  );
}

function LiveBadge() {
  return (
    <span className="flex items-center gap-1.5 text-xs font-medium text-green-400 bg-green-500/10 px-2 py-0.5 rounded-full">
      <Radio size={10} className="animate-pulse" />
      Live
    </span>
  );
}

function PipRow({ count, max, color, label }: { count: number; max: number; color: string; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-muted-foreground w-20">{label}</span>
      <div className="flex gap-1">
        {Array.from({ length: max }).map((_, i) => (
          <div
            key={i}
            className={`w-4 h-4 rounded-full border-2 ${i < count ? `${color} border-transparent` : "border-muted-foreground/30 bg-transparent"}`}
          />
        ))}
      </div>
    </div>
  );
}

// Derive companion max HP when possible (custom companions only — standard
// companions would need the full companion database for accurate per-level HP).
function companionMaxHp(comp: BotCompanion, charLevel: number): number | null {
  if (comp.baseType !== "custom" || !comp.customStats) return null;
  const base = comp.customStats.hpPerLevel ?? 8;
  const con = comp.customStats.abilities?.con ?? 0;
  if (comp.form === "young") return base * charLevel;
  if (comp.form === "mature") return (base + con) * charLevel;
  return (base + con + 1) * charLevel; // nimble / savage
}

function CompanionCard({ comp, charLevel }: { comp: BotCompanion; charLevel: number }) {
  const maxHp = companionMaxHp(comp, charLevel);
  const currentHp = comp.currentHp;
  const hpPercent = maxHp && currentHp !== null ? Math.max(0, Math.min(100, (currentHp / maxHp) * 100)) : null;

  return (
    <div className="p-3 bg-muted/40 rounded-lg space-y-2">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-semibold text-sm">{comp.displayName}</p>
          <p className="text-xs text-muted-foreground capitalize">
            {comp.baseType.replace(/-/g, " ")} · {comp.form}
          </p>
        </div>
        {currentHp !== null ? (
          maxHp ? (
            <span className={`text-xs font-mono px-2 py-0.5 rounded-full ${
              currentHp === 0
                ? "text-destructive bg-destructive/10"
                : currentHp / maxHp < 0.3
                  ? "text-orange-400 bg-orange-500/10"
                  : "text-green-400 bg-green-500/10"
            }`}>
              {currentHp}/{maxHp} HP
            </span>
          ) : (
            <span className={`text-xs font-mono px-2 py-0.5 rounded-full ${
              currentHp === 0 ? "text-destructive bg-destructive/10" : "text-green-400 bg-green-500/10"
            }`}>
              {currentHp} HP
            </span>
          )
        ) : (
          <span className="text-xs text-muted-foreground px-2 py-0.5 rounded-full bg-muted">
            Not in combat
          </span>
        )}
      </div>
      {hpPercent !== null && (
        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${
              hpPercent === 0 ? "bg-destructive" : hpPercent < 30 ? "bg-orange-400" : "bg-green-400"
            }`}
            style={{ width: `${hpPercent}%` }}
          />
        </div>
      )}
      {comp.notes && (
        <p className="text-xs text-muted-foreground italic">{comp.notes}</p>
      )}
    </div>
  );
}

export default function CharacterDetailPage() {
  const params = useParams();
  const { user } = useAuth();
  const characterId = params.id as string;

  const { data: character, isLoading, error } = useCharacterLive(characterId, {
    enabled: !!characterId && !!user,
  });
  const syncMutation = useSyncCharacter();
  const [syncError, setSyncError] = useState<string | null>(null);

  const charKey = character ? (character as unknown as { char_key: string | null }).char_key : null;
  const { data: downtime } = useCharacterDowntime(charKey);
  const { data: notesRecord } = useCharacterNotes(charKey);

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center py-12">
          <div className="spinner" />
        </div>
      </MainLayout>
    );
  }

  if (error || !character) {
    return (
      <MainLayout>
        <div className="card p-6 bg-destructive/10 border-destructive">
          <p className="text-destructive font-semibold">Character not found</p>
          <p className="text-sm text-muted-foreground mt-1">{error?.message}</p>
          <Link href="/characters" className="mt-4 inline-flex items-center gap-2 text-sm text-primary">
            <ArrowLeft size={14} /> Back to characters
          </Link>
        </div>
      </MainLayout>
    );
  }

  const pb = character.pathbuilder_data as { build?: PBBuild } | PBBuild | null;
  const build: PBBuild | null = pb ? ((pb as { build?: PBBuild }).build ?? (pb as PBBuild)) : null;
  const abs = build?.abilities;

  // Live state from bot (may be null if bot hasn't synced yet)
  const currentHp = (character as unknown as { current_hp: number | null }).current_hp;
  const overlay = (character as unknown as { overlay: CharacterOverlay }).overlay ?? {};
  const daily = overlay.daily;
  const hasLiveData = currentHp !== null && currentHp !== undefined;

  const level = character.level ?? build?.level ?? 1;
  const maxHp = build ? deriveMaxHp(build, level) : null;

  const dying = character.dying ?? 0;
  const wounded = character.wounded ?? 0;
  const heroPoints = daily?.hero_points ?? character.hero_points ?? 1;
  const focusSpent = daily?.focus_spent ?? 0;

  // Focus pool size from Pathbuilder (sum of focusPoints across all casters)
  const focusMax = (build?.spellCasters ?? []).reduce(
    (sum, c) => sum + ((c as unknown as { focusPoints?: number }).focusPoints ?? 0), 0
  );

  return (
    <MainLayout>
      <div className="mb-6">
        <Link href="/characters" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft size={16} />
          Back to Characters
        </Link>

        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="font-heading text-4xl font-bold">{character.name}</h1>
            <p className="text-muted-foreground mt-1">
              {[character.ancestry_name, character.heritage_name, character.class_name]
                .filter(Boolean)
                .join(" · ")}
              {character.level ? ` · Level ${character.level}` : ""}
            </p>
            {character.background_name && (
              <p className="text-sm text-muted-foreground">{character.background_name} background</p>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {(character as unknown as { pathbuilder_id: number | null }).pathbuilder_id && (
              <button
                onClick={async () => {
                  setSyncError(null);
                  try {
                    await syncMutation.mutateAsync(characterId);
                  } catch (err) {
                    setSyncError(err instanceof Error ? err.message : "Sync failed");
                  }
                }}
                disabled={syncMutation.isPending}
                className="btn-outline flex items-center gap-2 text-sm"
                title="Re-fetch latest data from Pathbuilder"
              >
                <RefreshCw size={14} className={syncMutation.isPending ? "animate-spin" : ""} />
                {syncMutation.isPending ? "Syncing…" : "Sync from Pathbuilder"}
              </button>
            )}
            <span
              className={`text-sm px-3 py-1 rounded-full ${
                character.status === "active"
                  ? "bg-green-500/20 text-green-400"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {character.status}
            </span>
          </div>
        </div>
        {syncMutation.isSuccess && (
          <p className="text-xs text-green-400 mt-1">Sheet refreshed from Pathbuilder.</p>
        )}
        {syncError && (
          <p className="text-xs text-destructive mt-1">{syncError}</p>
        )}
      </div>

      <div className="space-y-4">
        {/* ── Live Combat Status ── */}
        {hasLiveData && maxHp ? (
          <Section title="Combat Status" badge={<LiveBadge />}>
            <div className="space-y-4">
              <HealthBar currentHp={currentHp!} maxHp={maxHp} size="lg" />

              {/* Dying / Wounded */}
              {(dying > 0 || wounded > 0) && (
                <div className="flex gap-3 flex-wrap">
                  {dying > 0 && (
                    <span className="flex items-center gap-1.5 text-sm font-medium text-destructive bg-destructive/10 px-3 py-1 rounded-full">
                      <Heart size={14} /> Dying {dying}
                    </span>
                  )}
                  {wounded > 0 && (
                    <span className="flex items-center gap-1.5 text-sm font-medium text-orange-400 bg-orange-500/10 px-3 py-1 rounded-full">
                      <Flame size={14} /> Wounded {wounded}
                    </span>
                  )}
                </div>
              )}

              {/* Hero Points + Focus */}
              <div className="space-y-2 pt-1">
                <PipRow count={heroPoints} max={3} color="bg-yellow-400" label="Hero Points" />
                {focusMax > 0 && (
                  <PipRow count={Math.max(0, focusMax - focusSpent)} max={focusMax} color="bg-blue-400" label="Focus Pool" />
                )}
              </div>

              {/* Spell slots used today */}
              {build.spellCasters && build.spellCasters.length > 0 && (
                <div className="pt-1 space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground">Spell Slots — Today</p>
                  {daily?.slots_used && Object.keys(daily.slots_used).length > 0 ? (
                    Object.entries(daily.slots_used).map(([caster, ranks]) => (
                      <div key={caster}>
                        <p className="text-xs text-muted-foreground mb-1">{caster}</p>
                        <div className="flex flex-wrap gap-2">
                          {Object.entries(ranks).map(([rank, used]) =>
                            used > 0 ? (
                              <span key={rank} className="text-xs bg-muted px-2 py-0.5 rounded font-mono">
                                Rank {rank}: {used} used
                              </span>
                            ) : null
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-muted-foreground italic">No slots used today.</p>
                  )}
                </div>
              )}
            </div>
          </Section>
        ) : (
          <div className="card p-4 border-dashed text-center text-sm text-muted-foreground">
            <Zap size={16} className="inline mr-2 opacity-40" />
            Combat status will appear here once the bot syncs this character.
          </div>
        )}

        {/* ── Ability Scores ── */}
        {abs && (
          <Section title="Ability Scores">
            <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
              <AbilityBlock label="STR" score={abs.str} />
              <AbilityBlock label="DEX" score={abs.dex} />
              <AbilityBlock label="CON" score={abs.con} />
              <AbilityBlock label="INT" score={abs.int} />
              <AbilityBlock label="WIS" score={abs.wis} />
              <AbilityBlock label="CHA" score={abs.cha} />
            </div>
          </Section>
        )}

        {/* ── Character Details ── */}
        {build && (
          <Section title="Details">
            <dl className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-2 text-sm">
              {build.deity && <><dt className="text-muted-foreground">Deity</dt><dd>{build.deity}</dd></>}
              {build.keyability && <><dt className="text-muted-foreground">Key Ability</dt><dd className="capitalize">{build.keyability}</dd></>}
              {build.languages && build.languages.length > 0 && (
                <>
                  <dt className="text-muted-foreground">Languages</dt>
                  <dd className="col-span-2">{build.languages.join(", ")}</dd>
                </>
              )}
            </dl>
          </Section>
        )}

        {/* ── Proficiencies ── */}
        {build?.proficiencies && Object.keys(build.proficiencies).length > 0 && (
          <Section title="Proficiencies">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
              {Object.entries(build.proficiencies)
                .filter(([, rank]) => rank > 0)
                .sort(([, a], [, b]) => b - a)
                .map(([skill, rank]) => (
                  <div key={skill} className="flex justify-between">
                    <span className="capitalize text-muted-foreground">
                      {skill.replace(/_/g, " ")}
                    </span>
                    <span className="text-xs font-medium">{profLabel(rank)}</span>
                  </div>
                ))}
            </div>
          </Section>
        )}

        {/* ── Special Abilities ── */}
        {build?.specials && build.specials.length > 0 && (
          <Section title="Special Abilities">
            <ul className="space-y-1 text-sm">
              {build.specials.map((s, i) => (
                <li key={i} className="text-muted-foreground">• {s}</li>
              ))}
            </ul>
          </Section>
        )}

        {/* ── Feats ── */}
        {build?.feats && build.feats.length > 0 && (
          <Section title="Feats">
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-1 text-sm">
              {build.feats.map((feat, i) => {
                const name = Array.isArray(feat) ? feat[0] : String(feat);
                return <li key={i} className="text-muted-foreground">• {name}</li>;
              })}
            </ul>
          </Section>
        )}

        {/* ── Equipment ── */}
        {build?.equipment && (build.equipment as unknown[]).length > 0 && (
          <Section title="Equipment">
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-1 text-sm">
              {(build.equipment as unknown[]).map((item, i) => {
                const name = Array.isArray(item) ? item[0] : (item as { name: string }).name ?? String(item);
                const qty = Array.isArray(item) ? item[1] : (item as { qty: number }).qty ?? 1;
                return (
                  <li key={i} className="text-muted-foreground">
                    {qty > 1 ? `${qty}× ` : ""}• {name}
                  </li>
                );
              })}
            </ul>
          </Section>
        )}

        {/* ── Downtime ── */}
        {downtime && (
          <Section
            title="Downtime"
            badge={
              <span className="flex items-center gap-1.5 text-xs font-medium text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full">
                <CalendarDays size={10} />
                {downtime.bank} {downtime.bank === 1 ? "day" : "days"}
              </span>
            }
          >
            <div className="space-y-3">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold tabular-nums">{downtime.bank}</span>
                <span className="text-sm text-muted-foreground">days available</span>
              </div>
              {(() => {
                const entries = (downtime.log as unknown as DowntimeLogEntry[]).slice().reverse().slice(0, 5);
                if (entries.length === 0) return null;
                return (
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">Recent Activity</p>
                    <ul className="space-y-1">
                      {entries.map((entry, i) => (
                        <li key={i} className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">
                            {entry.date}
                            {entry.reason ? ` · ${entry.reason}` : ""}
                          </span>
                          <span className={`font-mono font-semibold ${entry.delta > 0 ? "text-green-400" : "text-orange-400"}`}>
                            {entry.delta > 0 ? "+" : ""}{entry.delta}d
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })()}
              <p className="text-xs text-muted-foreground">
                Spend days with <code className="bg-muted px-1 rounded">/downtime spend</code> in Discord.
              </p>
            </div>
          </Section>
        )}

        {/* ── Session Notes ── */}
        {notesRecord && (notesRecord.notes as unknown as BotNote[]).length > 0 && (
          <Section
            title="Session Notes"
            badge={
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <BookOpen size={12} />
                {(notesRecord.notes as unknown as BotNote[]).length}
              </span>
            }
          >
            <div className="space-y-4">
              {NOTE_CATEGORY_ORDER.map((catKey) => {
                const cat = NOTE_CATEGORIES[catKey];
                const allNotes = notesRecord.notes as unknown as BotNote[];
                const inCat = allNotes
                  .filter((n) => n.category === catKey)
                  .sort((a, b) => {
                    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
                    return b.createdAt.localeCompare(a.createdAt);
                  });
                if (inCat.length === 0) return null;
                return (
                  <div key={catKey}>
                    <p className="text-xs font-semibold text-muted-foreground mb-2">
                      {cat.icon} {cat.label}
                    </p>
                    <ul className="space-y-2">
                      {inCat.map((note) => (
                        <li key={note.id} className="text-sm bg-muted/40 rounded-lg p-3 space-y-1">
                          <div className="flex items-start justify-between gap-2">
                            <p className="leading-snug flex-1">{note.text}</p>
                            {note.pinned && (
                              <span className="text-xs text-muted-foreground shrink-0">📌</span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {note.authorName} · {new Date(note.createdAt).toLocaleDateString()}
                            {note.editedAt ? " (edited)" : ""}
                          </p>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          </Section>
        )}

        {/* ── Companions ── */}
        {overlay.companions && Object.keys(overlay.companions).length > 0 && (
          <Section
            title="Companions"
            badge={
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <PawPrint size={12} />
                {Object.keys(overlay.companions).length}
              </span>
            }
          >
            <div className="space-y-2">
              {Object.entries(overlay.companions).map(([key, comp]) => (
                <CompanionCard key={key} comp={comp} charLevel={level} />
              ))}
            </div>
          </Section>
        )}
      </div>
    </MainLayout>
  );
}
