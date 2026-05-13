"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { useCreateCharacter } from "@/lib/hooks/use-characters";
import type { NativeBuildInput } from "@/lib/types/character";
import type { StepProps } from "../types";

function modOf(score: number): number {
  return Math.floor((score - 10) / 2);
}

export function ReviewStep({ state }: StepProps) {
  const router = useRouter();
  const createMutation = useCreateCharacter();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [progress, setProgress] = useState<string | null>(null);

  const conMod = modOf(state.abilities.con);
  const maxHp = state.ancestryHp + (state.classHp + conMod) * state.level;
  const variantCount = Object.values(state.variantRules).filter(Boolean).length;

  const canSubmit =
    !!state.name.trim() &&
    !!state.ancestryId &&
    !!state.classId &&
    !!state.backgroundId &&
    !!state.keyability;

  async function handleSubmit() {
    if (!canSubmit) return;
    setSubmitError(null);
    setProgress("Creating character…");

    const native_build: NativeBuildInput = {
      name: state.name,
      level: state.level,
      alignment: state.alignment,
      gender: state.gender,
      age: state.age,
      ancestry: state.ancestryName,
      ancestry_id: state.ancestryId,
      heritage: state.heritageName,
      class: state.className,
      class_id: state.classId,
      background: state.backgroundName,
      keyability: state.keyability,
      lore: state.lore,
      abilities: state.abilities,
      trained_skills: state.trainedSkills,
      background_trained_skill: state.backgroundTrainedSkill || undefined,
      additional_skills: state.additionalSkills.filter((s) => s.name.trim()),
      custom_feats: state.customFeats.filter((f) => f.name.trim()),
      custom_specials: state.customSpecials.filter((s) => s.trim()),
      custom_attacks: state.customAttacks.filter((a) => a.name.trim()),
      deity: state.deity,
      languages: state.languages.length ? state.languages : ["None selected"],
      money: state.money,
      equipment_refs: state.selectedItems.map((i) => ({
        name: i.item_name,
        quantity: i.quantity,
      })),
      companion: state.companionType
        ? {
            type: state.companionType,
            name: state.companionName,
            subtype: state.companionSubtype,
          }
        : undefined,
      description: {
        height: state.height,
        weight: state.weight,
        eyes: state.eyes,
        hair: state.hair,
        skin: state.skin,
        distinguishing_features: state.distinguishingFeatures,
        portrait_url: state.portraitUrl,
      },
      personality: {
        traits: state.personalityTraits,
        ideals: state.ideals,
        bonds: state.bonds,
        flaws: state.flaws,
        backstory: state.backstory,
      },
    };

    try {
      const character = await createMutation.mutateAsync({
        source: "native",
        native_build,
        variant_rules: state.variantRules as unknown as Record<string, boolean>,
      });

      // Persist Nethys-sourced feat selections to character_feats.
      if (state.selectedFeats.length > 0) {
        setProgress(`Attaching ${state.selectedFeats.length} feat(s)…`);
        for (const sel of state.selectedFeats) {
          const res = await fetch(`/api/characters/${character.id}/feats`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              feat_id: sel.feat_id,
              feat_slot: sel.feat_slot,
              level_acquired: sel.level_acquired,
            }),
          });
          if (!res.ok) {
            console.warn(`Failed to attach feat ${sel.feat_name}: ${await res.text()}`);
          }
        }
      }

      // Persist known spells to character_known_spells.
      if (state.selectedSpells.length > 0) {
        setProgress(`Attaching ${state.selectedSpells.length} spell(s)…`);
        for (const sel of state.selectedSpells) {
          const res = await fetch(`/api/characters/${character.id}/known-spells`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              spell_id: sel.spell_id,
              tradition: sel.tradition,
              rank: sel.rank,
              spell_source: sel.spell_source,
            }),
          });
          if (!res.ok) {
            console.warn(`Failed to attach spell ${sel.spell_name}: ${await res.text()}`);
          }
        }
      }

      setProgress("Done. Redirecting…");
      router.push(`/characters/${character.id}`);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Character creation failed.");
      setProgress(null);
    }
  }

  return (
    <div className="space-y-5">
      <p className="text-sm text-muted-foreground">
        Last look before saving. You can still go back to fix anything.
      </p>

      {/* Validation list */}
      <div className="card p-4 bg-muted/30 space-y-1.5">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-2">
          Required
        </h3>
        <Check label="Name" ok={!!state.name.trim()} value={state.name || "—"} />
        <Check label="Ancestry" ok={!!state.ancestryId} value={state.ancestryName || "—"} />
        <Check label="Heritage" ok={!!state.heritageId} value={state.heritageName || "(skipped)"} />
        <Check label="Class" ok={!!state.classId} value={state.className || "—"} />
        <Check
          label="Key attribute"
          ok={!!state.keyability}
          value={state.keyability ? state.keyability.toUpperCase() : "—"}
        />
        <Check label="Background" ok={!!state.backgroundId} value={state.backgroundName || "—"} />
      </div>

      {/* Summary */}
      <div className="card p-4 space-y-3 bg-muted/30">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Summary
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
          <Stat label="Level" value={`${state.level} · ${state.alignment}`} />
          <Stat label="HP" value={String(maxHp)} />
          <Stat
            label="Class DC"
            value={
              state.keyability
                ? String(
                    10 +
                      modOf(state.abilities[state.keyability as keyof typeof state.abilities] ?? 10)
                  )
                : "—"
            }
          />
          <Stat label="Speed" value={`${state.ancestrySpeed} ft`} />
          <Stat label="Trained skills" value={String(state.trainedSkills.length)} />
          <Stat label="Feats picked" value={String(state.selectedFeats.length)} />
          <Stat label="Spells picked" value={String(state.selectedSpells.length)} />
          <Stat label="Items" value={String(state.selectedItems.length)} />
        </div>

        <div className="pt-2 border-t border-border text-xs text-muted-foreground">
          Variant rules: {variantCount > 0 ? `${variantCount} active` : "RAW (none)"}
          {state.companionType && ` · Companion: ${state.companionType}`}
        </div>

        <div className="pt-2 border-t border-border">
          <p className="text-xs text-muted-foreground mb-2">Ability scores</p>
          <div className="flex gap-3 flex-wrap">
            {(["str", "dex", "con", "int", "wis", "cha"] as const).map((ab) => {
              const score = state.abilities[ab];
              const mod = modOf(score);
              return (
                <div key={ab} className="text-center">
                  <p className="text-[10px] text-muted-foreground uppercase">{ab}</p>
                  <p className="text-base font-bold font-mono">{score}</p>
                  <p className="text-[10px] text-muted-foreground font-mono">
                    {mod >= 0 ? `+${mod}` : mod}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {submitError && (
        <div className="card p-3 bg-destructive/5 border-destructive/30 flex items-start gap-2 text-sm text-destructive">
          <AlertCircle size={16} className="shrink-0 mt-0.5" />
          <span>{submitError}</span>
        </div>
      )}

      <button
        type="button"
        onClick={handleSubmit}
        disabled={!canSubmit || createMutation.isPending}
        className="btn-primary w-full py-3 flex items-center justify-center gap-2 disabled:opacity-40"
      >
        {createMutation.isPending ? (
          <>
            <Loader2 size={16} className="animate-spin" /> {progress ?? "Creating…"}
          </>
        ) : (
          "Create Character"
        )}
      </button>

      {!canSubmit && !createMutation.isPending && (
        <p className="text-xs text-amber-500/80 text-center">
          Fill in the required fields above before creating.
        </p>
      )}
    </div>
  );
}

function Check({ label, ok, value }: { label: string; ok: boolean; value: string }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      {ok ? (
        <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
      ) : (
        <AlertCircle size={14} className="text-amber-500 shrink-0" />
      )}
      <span className="text-muted-foreground w-32 shrink-0">{label}</span>
      <span className={ok ? "" : "text-amber-500/80"}>{value}</span>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] uppercase text-muted-foreground tracking-wide">{label}</p>
      <p className="text-base font-bold mt-0.5">{value}</p>
    </div>
  );
}
