"use client";

import { PublicLayout } from "@/components/layout/PublicLayout";
import type { Json, Tables } from "@/lib/types/database.types";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, ExternalLink, Shield } from "lucide-react";
import { useParams } from "next/navigation";

type Character = Tables<"characters">;
type PublicCharacter = Pick<
  Character,
  | "id"
  | "name"
  | "ancestry_name"
  | "heritage_name"
  | "class_name"
  | "background_name"
  | "level"
  | "experience"
  | "pathbuilder_data"
  | "hero_points"
  | "dying"
  | "wounded"
  | "current_hp"
  | "source"
  | "status"
  | "created_at"
  | "updated_at"
  | "is_public"
  | "public_share_id"
>;
type Build = {
  name?: string;
  ancestry?: string;
  heritage?: string;
  class?: string;
  background?: string;
  level?: number;
  languages?: string[];
  abilities?: { str: number; dex: number; con: number; int: number; wis: number; cha: number };
  attributes?: {
    ancestryhp?: number;
    classhp?: number;
    bonushp?: number;
    bonushpPerLevel?: number;
    speed?: number;
    speedBonus?: number;
    speed_bonus?: number;
  };
  proficiencies?: Record<string, number>;
  feats?: Array<[string, string | null, string | null, string | null] | string[]>;
  specials?: string[];
  custom_attacks?: Array<{
    name: string;
    bonus: string | number;
    damage: string;
    traits?: string | string[];
  }>;
  equipment?: Array<[string, number] | { name: string; qty?: number; quantity?: number }>;
  spellCasters?: Array<{
    name?: string;
    perDay?: number[];
    magicTradition?: string;
    tradition?: string;
  }>;
  size?: string | number;
  sizeName?: string;
  speed?: number;
  acTotal?: number | { acTotal?: number };
  ac?: number;
  armor?: string;
  shield?: string;
  senses?: string;
};
type PublicFeat = {
  id: string;
  feat_slot: string | null;
  level_acquired: number | null;
  notes: string | null;
  feat: {
    name: string;
    feat_type: string | null;
    source: string | null;
    level: number | null;
    description: string | null;
  } | null;
};
type PublicSpell = {
  id: string;
  tradition: string;
  rank: number;
  spell_source: string;
  is_signature: boolean;
  notes: string | null;
  spell: {
    name: string;
    description: string | null;
    source: string | null;
    rank: number | null;
    traditions: Json | null;
  } | null;
};
type PublicCharacterResponse = {
  character: PublicCharacter;
  feats: PublicFeat[];
  known_spells: PublicSpell[];
};

const SKILL_ABILITY: Record<string, keyof NonNullable<Build["abilities"]>> = {
  acrobatics: "dex",
  arcana: "int",
  athletics: "str",
  crafting: "int",
  deception: "cha",
  diplomacy: "cha",
  intimidation: "cha",
  medicine: "wis",
  nature: "wis",
  occultism: "int",
  performance: "cha",
  religion: "wis",
  society: "int",
  stealth: "dex",
  survival: "wis",
  thievery: "dex",
};
const SAVE_ABILITY: Record<string, keyof NonNullable<Build["abilities"]>> = {
  fortitude: "con",
  reflex: "dex",
  will: "wis",
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getBuild(character: PublicCharacter): Build {
  const data = character.pathbuilder_data;
  if (isRecord(data) && isRecord(data.build)) return data.build as Build;
  return (data ?? {}) as Build;
}

function abilityMod(score = 10) {
  return Math.floor((score - 10) / 2);
}

function signed(value: number) {
  return value >= 0 ? `+${value}` : `${value}`;
}

function profBonus(rankOrBonus = 0, level = 1, usesRawBonus: boolean) {
  if (!rankOrBonus) return 0;
  return level + (usesRawBonus ? rankOrBonus : rankOrBonus * 2);
}

function usesRawBonus(profs: Record<string, number>) {
  return Object.values(profs).some((value) => value > 4);
}

function rankLabel(rankOrBonus = 0, raw: boolean) {
  const rank = raw ? Math.round(rankOrBonus / 2) : rankOrBonus;
  return ["Untrained", "Trained", "Expert", "Master", "Legendary"][rank] ?? "Untrained";
}

function maxHp(build: Build, level: number) {
  const attrs = build.attributes;
  if (!attrs || !build.abilities) return null;
  const con = abilityMod(build.abilities.con);
  return (
    (attrs.ancestryhp ?? 0) +
    ((attrs.classhp ?? 0) + (attrs.bonushpPerLevel ?? 0) + con) * level +
    (attrs.bonushp ?? 0)
  );
}

function acValue(build: Build, level: number, raw: boolean) {
  if (typeof build.ac === "number") return build.ac;
  if (typeof build.acTotal === "number") return build.acTotal;
  if (isRecord(build.acTotal) && typeof build.acTotal.acTotal === "number") {
    return build.acTotal.acTotal;
  }
  const dex = abilityMod(build.abilities?.dex ?? 10);
  const armorRank =
    build.proficiencies?.unarmored ??
    build.proficiencies?.light ??
    build.proficiencies?.light_armor ??
    0;
  return 10 + dex + profBonus(armorRank, level, raw);
}

function sizeLabel(build: Build) {
  if (build.sizeName) return build.sizeName;
  if (typeof build.size === "string") return build.size;
  const map: Record<number, string> = {
    1: "Small",
    2: "Medium",
    3: "Large",
    4: "Huge",
    5: "Gargantuan",
  };
  return typeof build.size === "number" ? (map[build.size] ?? "Medium") : "";
}

function speedLabel(build: Build) {
  const base = build.speed ?? build.attributes?.speed ?? null;
  if (base === null) return null;
  return base + (build.attributes?.speedBonus ?? build.attributes?.speed_bonus ?? 0);
}

function buildFeats(build: Build): PublicFeat[] {
  const rows: PublicFeat[] = [];
  for (const [index, feat] of (build.feats ?? []).entries()) {
    const name = String(feat[0] ?? "").trim();
    if (!name) continue;
    const slot = String(feat[1] ?? "Other");
    const details = typeof feat[3] === "string" ? feat[3] : null;
    rows.push({
      id: `build-${index}`,
      feat_slot: slot,
      level_acquired: null,
      notes: details,
      feat: {
        name,
        feat_type: slot,
        source: typeof feat[2] === "string" ? feat[2] : null,
        level: null,
        description: details,
      },
    });
  }
  return rows;
}

function equipmentRows(build: Build) {
  return (build.equipment ?? [])
    .map((entry) => {
      if (Array.isArray(entry)) return { name: String(entry[0] ?? ""), qty: Number(entry[1] ?? 1) };
      return { name: String(entry.name ?? ""), qty: Number(entry.qty ?? entry.quantity ?? 1) };
    })
    .filter((entry) => entry.name);
}

function FieldCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-bold text-foreground">{value}</p>
      {sub && <p className="mt-1 text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-border bg-card p-5">
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-primary">{title}</h2>
      {children}
    </section>
  );
}

export default function SharedCharacterPage() {
  const params = useParams<{ shareId: string }>();
  const shareId = params.shareId;
  const { data, isLoading, error } = useQuery<PublicCharacterResponse, Error>({
    queryKey: ["public-character", shareId],
    queryFn: async () => {
      const res = await fetch(`/api/characters/public/${shareId}`);
      if (!res.ok) {
        const body = await res.json().catch(() => ({ error: res.statusText }));
        throw new Error(body.error ?? res.statusText);
      }
      return res.json();
    },
    enabled: !!shareId,
  });

  if (isLoading) {
    return (
      <PublicLayout>
        <div className="container mx-auto flex max-w-6xl items-center justify-center px-4 py-24">
          <div className="spinner" />
        </div>
      </PublicLayout>
    );
  }

  if (error || !data) {
    return (
      <PublicLayout>
        <div className="container mx-auto max-w-3xl px-4 py-20">
          <div className="rounded-lg border border-destructive bg-destructive/10 p-6">
            <div className="flex items-center gap-3 text-destructive">
              <AlertTriangle size={22} />
              <h1 className="text-xl font-bold">Shared character unavailable</h1>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              {error?.message ?? "This link may have been disabled by the character owner."}
            </p>
          </div>
        </div>
      </PublicLayout>
    );
  }

  const { character } = data;
  const build = getBuild(character);
  const level = character.level ?? build.level ?? 1;
  const profs = build.proficiencies ?? {};
  const raw = usesRawBonus(profs);
  const abilities = build.abilities ?? { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 };
  const feats = [...data.feats, ...buildFeats(build)];
  const hpMax = maxHp(build, level);
  const currentHp = character.current_hp ?? hpMax;
  const speed = speedLabel(build);
  const size = sizeLabel(build);
  const attacks = build.custom_attacks ?? [];
  const equipment = equipmentRows(build);

  return (
    <PublicLayout>
      <div className="container mx-auto max-w-6xl space-y-6 px-4 py-10 md:px-8">
        <div className="rounded-lg border border-border bg-card p-6">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-primary">
            Shared Pathway Character
          </p>
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div>
              <h1 className="font-heading text-4xl font-bold">{character.name}</h1>
              <p className="mt-1 text-muted-foreground">
                Level {level} ·{" "}
                {[character.ancestry_name, character.heritage_name, character.class_name]
                  .filter(Boolean)
                  .join(" ")}
              </p>
              {character.background_name && (
                <p className="mt-1 text-sm text-muted-foreground">
                  {character.background_name} background
                </p>
              )}
              <p className="mt-2 font-mono text-xs text-muted-foreground">
                Pathway JSON ID: {character.id}
              </p>
            </div>
            <a href="/login" className="btn-primary text-center text-slate-950">
              Open Pathway
            </a>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
          <FieldCard label="AC" value={acValue(build, level, raw)} />
          <FieldCard label="HP" value={hpMax ? `${currentHp ?? hpMax}/${hpMax}` : "—"} />
          <FieldCard label="Speed" value={speed ? `${speed} ft` : "—"} sub={size || undefined} />
          <FieldCard
            label="Perception"
            value={signed(abilityMod(abilities.wis) + profBonus(profs.perception ?? 0, level, raw))}
            sub={rankLabel(profs.perception ?? 0, raw)}
          />
          <FieldCard label="Status" value={character.status} />
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Section title="Ability Scores">
            <div className="grid grid-cols-3 gap-3">
              {(["str", "dex", "con", "int", "wis", "cha"] as const).map((key) => (
                <FieldCard
                  key={key}
                  label={key.toUpperCase()}
                  value={signed(abilityMod(abilities[key]))}
                  sub={String(abilities[key])}
                />
              ))}
            </div>
          </Section>

          <Section title="Saves">
            <div className="grid gap-2">
              {(["fortitude", "reflex", "will"] as const).map((save) => (
                <div
                  key={save}
                  className="flex items-center justify-between rounded bg-muted/40 px-3 py-2"
                >
                  <span className="capitalize">{save}</span>
                  <span className="font-mono font-semibold">
                    {signed(
                      abilityMod(abilities[SAVE_ABILITY[save]]) +
                        profBonus(profs[save] ?? 0, level, raw)
                    )}
                  </span>
                </div>
              ))}
            </div>
          </Section>

          <Section title="Skills">
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {Object.entries(SKILL_ABILITY)
                .filter(([skill]) => (profs[skill] ?? 0) > 0)
                .map(([skill, ability]) => (
                  <div
                    key={skill}
                    className="flex items-center justify-between rounded bg-muted/40 px-3 py-2"
                  >
                    <span className="capitalize">{skill}</span>
                    <span className="font-mono font-semibold">
                      {signed(
                        abilityMod(abilities[ability]) + profBonus(profs[skill] ?? 0, level, raw)
                      )}
                    </span>
                  </div>
                ))}
            </div>
          </Section>

          <Section title="Attacks">
            {attacks.length ? (
              <div className="space-y-3">
                {attacks.map((attack) => (
                  <div key={attack.name} className="rounded bg-muted/40 p-3">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-semibold">{attack.name}</p>
                      <p className="font-mono">{attack.bonus}</p>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{attack.damage}</p>
                    {attack.traits && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        {Array.isArray(attack.traits) ? attack.traits.join(", ") : attack.traits}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No custom attacks saved.</p>
            )}
          </Section>

          <Section title="Feats">
            {feats.length ? (
              <div className="space-y-2">
                {feats.map((row) => (
                  <details key={row.id} className="rounded bg-muted/40 p-3">
                    <summary className="cursor-pointer font-semibold">
                      {row.feat?.name ?? "Unnamed feat"}
                    </summary>
                    <div className="mt-2 space-y-2 text-sm text-muted-foreground">
                      <p>{[row.feat_slot, row.feat?.source].filter(Boolean).join(" · ")}</p>
                      <p className="whitespace-pre-wrap">
                        {row.feat?.description ?? row.notes ?? "No rules text saved."}
                      </p>
                    </div>
                  </details>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No feats saved.</p>
            )}
          </Section>

          <Section title="Spells">
            {data.known_spells.length ? (
              <div className="space-y-2">
                {data.known_spells.map((row) => (
                  <div key={row.id} className="rounded bg-muted/40 p-3">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <p className="font-semibold">{row.spell?.name ?? "Unnamed spell"}</p>
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">
                        {row.rank === 0 ? "Cantrip" : `Rank ${row.rank}`} · {row.spell_source}
                      </p>
                    </div>
                    <p className="mt-1 line-clamp-3 text-sm text-muted-foreground">
                      {row.spell?.description ?? row.notes ?? "No spell text saved."}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No known spells saved.</p>
            )}
          </Section>

          <Section title="Equipment">
            {equipment.length ? (
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {equipment.map((entry) => (
                  <div
                    key={entry.name}
                    className="flex items-center justify-between rounded bg-muted/40 px-3 py-2"
                  >
                    <span>{entry.name}</span>
                    <span className="font-mono text-xs">x{entry.qty}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No equipment saved.</p>
            )}
          </Section>

          <Section title="Special Abilities">
            {build.specials?.length ? (
              <div className="grid gap-2">
                {build.specials.map((special) => (
                  <div key={special} className="rounded bg-muted/40 px-3 py-2">
                    {special}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No special abilities saved.</p>
            )}
          </Section>
        </div>

        <div className="rounded-lg border border-border bg-card p-4 text-sm text-muted-foreground">
          <div className="flex flex-wrap items-center gap-2">
            <Shield size={16} />
            This is a read-only public view. Only the character owner can edit or disable this link.
            <a
              href="/features"
              className="inline-flex items-center gap-1 text-primary hover:underline"
            >
              Learn about Pathway <ExternalLink size={12} />
            </a>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}
