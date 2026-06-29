"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  Backpack,
  Dices,
  Heart,
  Shield,
  Sparkles,
  Swords,
  WifiOff,
} from "lucide-react";
import { MainLayout } from "@/components/layout";
import { CompactDiceRoller, type DiceRoll } from "@/components/characters/DiceRoller";
import { useAuth } from "@/lib/providers/auth-provider";
import { useCharacterBreakdowns, useCharacterLive, useUpdateCharacter } from "@/lib/hooks/use-characters";
import { useCharacterFeats } from "@/lib/hooks/use-feats";
import { useCharacterKnownSpells } from "@/lib/hooks/use-character-spells";
import { buildTableModeSheet, type TableModeAction, type TableModeRoll, type TableModeSheet } from "@/modules/characters/table-mode";

type Tab = "actions" | "rolls" | "spells" | "inventory";

const CACHE_PREFIX = "pathway:table-mode:";

function cacheKey(id: string) {
  return `${CACHE_PREFIX}${id}`;
}

function formatMod(value: number | null | undefined) {
  const number = value ?? 0;
  return number >= 0 ? `+${number}` : String(number);
}

function loadCachedSheet(id: string): TableModeSheet | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(cacheKey(id));
    return raw ? (JSON.parse(raw) as TableModeSheet) : null;
  } catch {
    return null;
  }
}

function saveCachedSheet(sheet: TableModeSheet) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(cacheKey(sheet.id), JSON.stringify(sheet));
  } catch {
    // Offline cache is helpful, not critical.
  }
}

export default function CharacterTableModePage() {
  const params = useParams<{ id: string }>();
  const characterId = params.id;
  const { user, isLoading: authLoading } = useAuth();
  const [tab, setTab] = useState<Tab>("actions");
  const [cached, setCached] = useState<TableModeSheet | null>(null);
  const [lastRoll, setLastRoll] = useState<DiceRoll | null>(null);

  const characterQuery = useCharacterLive(characterId, { enabled: !!characterId && !!user });
  const breakdownQuery = useCharacterBreakdowns(characterId, { enabled: !!characterId && !!user });
  const featsQuery = useCharacterFeats(characterId, { enabled: !!characterId && !!user });
  const spellsQuery = useCharacterKnownSpells(characterId, { enabled: !!characterId && !!user });
  const updateCharacter = useUpdateCharacter(characterId);

  useEffect(() => {
    setCached(loadCachedSheet(characterId));
  }, [characterId]);

  const sheet = useMemo(() => {
    if (!characterQuery.data) return cached;
    return buildTableModeSheet(characterQuery.data, breakdownQuery.data?.breakdowns ?? []);
  }, [characterQuery.data, breakdownQuery.data?.breakdowns, cached]);

  useEffect(() => {
    if (sheet && characterQuery.data) saveCachedSheet(sheet);
  }, [sheet, characterQuery.data]);

  async function logRoll(roll: DiceRoll) {
    setLastRoll(roll);
    await fetch(`/api/characters/${characterId}/rolls`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        label: roll.label,
        expression: roll.dice,
        result: { results: roll.results, modifier: roll.modifier, type: roll.type },
        total: roll.total,
      }),
    }).catch(() => undefined);
  }

  if (authLoading || characterQuery.isLoading) {
    return (
      <MainLayout>
        <div className="flex justify-center py-12">
          <div className="spinner" />
        </div>
      </MainLayout>
    );
  }

  if (!sheet) {
    return (
      <MainLayout>
        <div className="card p-8 text-center">
          <p className="font-semibold">Character unavailable</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Open this table view once while online to make it available offline.
          </p>
          <Link href="/characters" className="btn-primary mt-4 inline-flex">
            Back to Characters
          </Link>
        </div>
      </MainLayout>
    );
  }

  const isOfflineFallback = !characterQuery.data && !!cached;
  const feats = featsQuery.data?.data ?? [];
  const spells = spellsQuery.data?.data ?? [];

  return (
    <MainLayout>
      <div className="space-y-6">
        <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <Link href={`/characters/${characterId}`} className="text-sm text-primary hover:underline">
              Back to full sheet
            </Link>
            <h1 className="mt-2 font-heading text-4xl font-bold">{sheet.name}</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Level {sheet.level} {sheet.ancestry} {sheet.className}
              {sheet.heritage ? ` · ${sheet.heritage}` : ""}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {isOfflineFallback && (
              <span className="inline-flex items-center gap-2 rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm text-amber-100">
                <WifiOff size={15} /> Offline cache
              </span>
            )}
            <Link href="/combat" className="btn-outline inline-flex items-center gap-2">
              <Swords size={16} /> Combat
            </Link>
          </div>
        </header>

        <section className="grid gap-4 lg:grid-cols-[260px_minmax(0,1fr)]">
          <aside className="space-y-4">
            <div className="card p-5">
              <div className="mb-4 flex items-center gap-2">
                <Heart className="h-5 w-5 text-red-400" />
                <h2 className="font-semibold">Vitals</h2>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Vital label="HP" value={`${sheet.currentHp ?? "?"}/${sheet.maxHp ?? "?"}`} />
                <Vital label="AC" value={sheet.ac ?? "?"} />
                <Vital label="Hero" value={sheet.heroPoints} />
                <Vital label="Wounded" value={sheet.wounded} />
                <Vital label="Dying" value={sheet.dying} />
                <Vital label="Perception" value={formatMod(sheet.perception)} />
              </div>
              {!isOfflineFallback && (
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    className="btn-outline justify-center"
                    onClick={() =>
                      updateCharacter.mutate({ current_hp: Math.max(0, (sheet.currentHp ?? 0) - 1) })
                    }
                  >
                    HP -1
                  </button>
                  <button
                    type="button"
                    className="btn-outline justify-center"
                    onClick={() =>
                      updateCharacter.mutate({
                        current_hp: Math.min(sheet.maxHp ?? 999, (sheet.currentHp ?? 0) + 1),
                      })
                    }
                  >
                    HP +1
                  </button>
                </div>
              )}
            </div>

            <div className="card p-5">
              <div className="mb-3 flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                <h2 className="font-semibold">Saves</h2>
              </div>
              <div className="space-y-2">
                {sheet.saves.map((roll) => (
                  <RollButton key={roll.key} roll={roll} onRoll={logRoll} />
                ))}
              </div>
            </div>

            {lastRoll && (
              <div className="card p-4">
                <p className="text-xs text-muted-foreground">Last roll</p>
                <p className="mt-1 text-lg font-semibold">
                  {lastRoll.label ?? lastRoll.dice}: {lastRoll.total}
                </p>
              </div>
            )}
          </aside>

          <main className="min-w-0 space-y-4">
            <nav className="flex gap-2 overflow-x-auto border-b border-border pb-2">
              {[
                ["actions", Activity],
                ["rolls", Dices],
                ["spells", Sparkles],
                ["inventory", Backpack],
              ].map(([key, Icon]) => (
                <button
                  key={String(key)}
                  type="button"
                  onClick={() => setTab(key as Tab)}
                  className={`inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium ${
                    tab === key
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <Icon className="h-4 w-4" /> {String(key).charAt(0).toUpperCase() + String(key).slice(1)}
                </button>
              ))}
            </nav>

            {tab === "actions" && (
              <Panel title="What Can I Do Now?" icon={Activity}>
                <ActionList actions={[...sheet.attacks, ...sheet.actions]} onRoll={logRoll} />
                {feats.length > 0 && (
                  <div className="mt-6">
                    <h3 className="mb-3 font-semibold">Feat Reminders</h3>
                    <div className="space-y-2">
                      {feats.slice(0, 8).map((row) => (
                        <ReferenceRow
                          key={row.id}
                          title={row.feat?.name ?? "Feat"}
                          meta={`Level ${row.level_acquired} · ${row.feat_slot.replace(/_/g, " ")}`}
                          text={row.notes ?? row.feat?.description ?? "No quick text saved."}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </Panel>
            )}

            {tab === "rolls" && (
              <Panel title="Quick Rolls" icon={Dices}>
                <div className="grid gap-3 md:grid-cols-2">
                  {[
                    ...(sheet.perception !== null
                      ? [{ key: "initiative", label: "Initiative", modifier: sheet.perception, group: "utility" as const }]
                      : []),
                    ...sheet.skills,
                  ].map((roll) => (
                    <RollButton key={roll.key} roll={roll} onRoll={logRoll} />
                  ))}
                </div>
              </Panel>
            )}

            {tab === "spells" && (
              <Panel title="Spells" icon={Sparkles}>
                {spells.length === 0 ? (
                  <EmptyText>No known spells saved for this character yet.</EmptyText>
                ) : (
                  <div className="space-y-2">
                    {spells.map((row) => (
                      <ReferenceRow
                        key={row.id}
                        title={row.spell?.name ?? "Spell"}
                        meta={`Rank ${row.rank} · ${row.tradition} · ${row.spell_source}`}
                        text={row.notes ?? row.spell?.description ?? "No spell text saved."}
                      />
                    ))}
                  </div>
                )}
              </Panel>
            )}

            {tab === "inventory" && (
              <Panel title="Inventory" icon={Backpack}>
                {sheet.inventory.length === 0 ? (
                  <EmptyText>No inventory saved for this character yet.</EmptyText>
                ) : (
                  <div className="grid gap-2 md:grid-cols-2">
                    {sheet.inventory.map((item) => (
                      <div key={`${item.name}-${item.quantity}`} className="rounded-md border border-border p-3">
                        <p className="font-medium">{item.name}</p>
                        <p className="text-xs text-muted-foreground">Quantity {item.quantity}</p>
                      </div>
                    ))}
                  </div>
                )}
              </Panel>
            )}
          </main>
        </section>
      </div>
    </MainLayout>
  );
}

function Vital({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-md border border-border bg-muted/30 p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-xl font-bold">{value}</p>
    </div>
  );
}

function RollButton({ roll, onRoll }: { roll: TableModeRoll; onRoll: (roll: DiceRoll) => void }) {
  return (
    <CompactDiceRoller
      preset={{ count: 1, type: 20, modifier: roll.modifier, label: roll.label }}
      onRoll={onRoll}
      className="w-full justify-between"
    />
  );
}

function ActionList({ actions, onRoll }: { actions: TableModeAction[]; onRoll: (roll: DiceRoll) => void }) {
  if (actions.length === 0) return <EmptyText>No attacks or quick actions available yet.</EmptyText>;

  return (
    <div className="space-y-3">
      {actions.map((action) => (
        <div key={action.key} className="rounded-lg border border-border p-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-semibold">{action.name}</h3>
                <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                  {action.cost}
                </span>
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
                  {action.category}
                </span>
              </div>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{action.summary}</p>
            </div>
            {action.roll && <RollButton roll={action.roll} onRoll={onRoll} />}
          </div>
        </div>
      ))}
    </div>
  );
}

function Panel({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
}) {
  return (
    <section className="card p-5">
      <div className="mb-4 flex items-center gap-2">
        <Icon className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-semibold">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function ReferenceRow({ title, meta, text }: { title: string; meta: string; text: string }) {
  return (
    <article className="rounded-md border border-border p-4">
      <p className="font-semibold">{title}</p>
      <p className="mt-1 text-xs text-muted-foreground">{meta}</p>
      <p className="mt-2 line-clamp-3 text-sm leading-6 text-muted-foreground">{text}</p>
    </article>
  );
}

function EmptyText({ children }: { children: React.ReactNode }) {
  return <p className="rounded-md border border-dashed border-border p-6 text-center text-sm text-muted-foreground">{children}</p>;
}
