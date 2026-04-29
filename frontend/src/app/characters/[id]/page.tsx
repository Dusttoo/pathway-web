"use client";

import { MainLayout } from "@/components/layout";
import { useCharacter } from "@/lib/hooks/use-characters";
import { useAuth } from "@/lib/providers/auth-provider";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";

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
}

function abilityMod(score: number) {
  const mod = Math.floor((score - 10) / 2);
  return mod >= 0 ? `+${mod}` : `${mod}`;
}

function profLabel(rank: number) {
  return ["Untrained", "Trained", "Expert", "Master", "Legendary"][rank] ?? "Untrained";
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

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="card p-5">
      <h3 className="font-semibold mb-3 border-b border-border pb-2">{title}</h3>
      {children}
    </div>
  );
}

export default function CharacterDetailPage() {
  const params = useParams();
  const { user } = useAuth();
  const characterId = params.id as string;

  const { data: character, isLoading, error } = useCharacter(characterId, { enabled: !!characterId && !!user });

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

  return (
    <MainLayout>
      <div className="mb-6">
        <Link href="/characters" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft size={16} />
          Back to Characters
        </Link>

        {/* Header */}
        <div className="flex items-start justify-between">
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

      {!build ? (
        <div className="card p-6 text-center">
          <p className="text-muted-foreground">No Pathbuilder data available for this character.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Ability Scores */}
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

          {/* Character Details */}
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

          {/* Proficiencies */}
          {build.proficiencies && Object.keys(build.proficiencies).length > 0 && (
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

          {/* Feats & Abilities */}
          {build.specials && build.specials.length > 0 && (
            <Section title="Special Abilities">
              <ul className="space-y-1 text-sm">
                {build.specials.map((s, i) => (
                  <li key={i} className="text-muted-foreground">• {s}</li>
                ))}
              </ul>
            </Section>
          )}

          {build.feats && build.feats.length > 0 && (
            <Section title="Feats">
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-1 text-sm">
                {build.feats.map((feat, i) => {
                  const name = Array.isArray(feat) ? feat[0] : String(feat);
                  return <li key={i} className="text-muted-foreground">• {name}</li>;
                })}
              </ul>
            </Section>
          )}

          {/* Equipment */}
          {build.equipment && (build.equipment as unknown[]).length > 0 && (
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
        </div>
      )}
    </MainLayout>
  );
}
