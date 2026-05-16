"use client";

import { useState } from "react";
import { Loader2, Plus, X } from "lucide-react";
import type { StepProps } from "./types";
import type { NativeBuildInput } from "@/lib/types/character";
import { useCreateCharacter } from "@/lib/hooks/use-characters";
import { useRouter } from "next/navigation";

function abilityMod(score: number) {
  const mod = Math.floor((score - 10) / 2);
  return mod >= 0 ? `+${mod}` : `${mod}`;
}

function featTypeLabel(slot: string): string {
  if (slot === "class") return "Class";
  if (slot === "skill") return "Skill";
  if (slot === "general") return "General";
  if (slot === "archetype" || slot === "free_archetype") return "Archetype";
  if (slot === "impulse") return "Impulse";
  if (slot === "ancestry") return "Ancestry";
  return "Other";
}

export function ReviewStep({ state, update, onBack }: StepProps) {
  const router = useRouter();
  const createMutation = useCreateCharacter();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [langInput, setLangInput] = useState("");

  const { abilities, ancestryHp, classHp, level } = state;
  const conMod = Math.floor((abilities.con - 10) / 2);
  const maxHp = ancestryHp + (classHp + conMod) * level;
  const selectedFeatSnapshots = state.selectedFeats.map((feat) => ({
    name: feat.feat_name,
    featType: featTypeLabel(feat.feat_slot),
    level: feat.level_acquired,
  }));

  function addLanguage() {
    const lang = langInput.trim();
    if (!lang || state.languages.includes(lang)) return;
    update({ languages: [...state.languages, lang] });
    setLangInput("");
  }

  function removeLanguage(lang: string) {
    update({ languages: state.languages.filter((l) => l !== lang) });
  }

  async function handleSubmit() {
    setSubmitError(null);

    const native_build: NativeBuildInput = {
      name: state.name,
      level: state.level,
      alignment: state.alignment,
      gender: state.gender,
      age: state.age,
      ancestry: state.ancestryName,
      ancestry_id: state.ancestryId,
      ancestry_hp: state.ancestryHp,
      ancestry_speed: state.ancestrySpeed,
      ancestry_size: state.ancestrySize,
      heritage: state.heritageName,
      class: state.className,
      class_id: state.classId,
      background: state.backgroundName,
      keyability: state.keyability,
      lore: state.lore,
      abilities: state.abilities,
      trained_skills: state.trainedSkills,
      background_trained_skill: state.backgroundTrainedSkill || undefined,
      additional_skills: state.additionalSkills.filter((skill) => skill.name.trim()),
      custom_feats: [
        ...selectedFeatSnapshots,
        ...state.customFeats.filter((feat) => feat.name.trim()),
      ],
      custom_specials: state.customSpecials.filter((special) => special.trim()),
      custom_attacks: state.customAttacks.filter((attack) => attack.name.trim()),
      deity: state.deity,
      languages: state.languages.length ? state.languages : ["None selected"],
      money: state.money,
    };

    try {
      const character = await createMutation.mutateAsync({
        source: "native",
        discord_guild_id: state.guildId || undefined,
        native_build,
      });

      // Persist Nethys-sourced feat selections to character_feats. We hit the
      // endpoint sequentially so a 409 on one feat (e.g. duplicate slot at
      // same level) doesn't drop the rest.
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

      // Same pattern for known spells. spell_source is set by the builder
      // based on the class (spellbook for prepared, repertoire for spontaneous).
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

      router.push(`/characters/${character.id}`);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Character creation failed.");
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold mb-1">Details & Review</h2>
        <p className="text-sm text-muted-foreground">Final touches, then create your character.</p>
      </div>

      {/* Deity */}
      <div>
        <label className="block text-sm font-medium mb-1">
          Deity <span className="text-xs text-muted-foreground font-normal">(optional)</span>
        </label>
        <input
          className="input w-full"
          type="text"
          placeholder="Not set"
          value={state.deity}
          onChange={(e) => update({ deity: e.target.value })}
        />
      </div>

      {/* Languages */}
      <div>
        <label className="block text-sm font-medium mb-2">Languages</label>
        <div className="flex flex-wrap gap-2 mb-2">
          {state.languages.map((lang) => (
            <span
              key={lang}
              className="flex items-center gap-1 bg-muted px-2 py-0.5 rounded-full text-sm"
            >
              {lang}
              <button
                type="button"
                onClick={() => removeLanguage(lang)}
                className="text-muted-foreground hover:text-destructive"
              >
                <X size={12} />
              </button>
            </span>
          ))}
          {state.languages.length === 0 && (
            <span className="text-sm text-muted-foreground italic">None selected</span>
          )}
        </div>
        <div className="flex gap-2">
          <input
            className="input flex-1 text-sm"
            type="text"
            placeholder="Add a language…"
            value={langInput}
            onChange={(e) => setLangInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addLanguage();
              }
            }}
          />
          <button type="button" onClick={addLanguage} className="btn-outline px-3">
            <Plus size={16} />
          </button>
        </div>
      </div>

      {/* Starting money */}
      <div>
        <label className="block text-sm font-medium mb-2">Starting Currency</label>
        <div className="grid grid-cols-4 gap-2">
          {(["gp", "sp", "cp", "pp"] as const).map((coin) => (
            <div key={coin}>
              <label className="block text-xs text-muted-foreground uppercase mb-1">{coin}</label>
              <input
                className="input w-full text-center font-mono"
                type="text"
                inputMode="numeric"
                pattern="[0-9+-]*"
                min={0}
                value={state.money[coin]}
                onChange={(e) =>
                  update({
                    money: { ...state.money, [coin]: Math.max(0, parseInt(e.target.value) || 0) },
                  })
                }
              />
            </div>
          ))}
        </div>
      </div>

      {/* Summary panel */}
      <div className="card p-4 space-y-3 bg-muted/30">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Summary
        </h3>
        <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-sm">
          <dt className="text-muted-foreground">Name</dt>
          <dd className="font-medium">{state.name || "—"}</dd>
          <dt className="text-muted-foreground">Level</dt>
          <dd>
            {state.level} · {state.alignment}
          </dd>
          <dt className="text-muted-foreground">Ancestry</dt>
          <dd>
            {state.ancestryName || "—"} {state.heritageName ? `· ${state.heritageName}` : ""}
          </dd>
          <dt className="text-muted-foreground">Class</dt>
          <dd>{state.className || "—"}</dd>
          <dt className="text-muted-foreground">Background</dt>
          <dd>{state.backgroundName || "—"}</dd>
          <dt className="text-muted-foreground">HP (estimated)</dt>
          <dd className="font-bold text-green-400">{maxHp}</dd>
          <dt className="text-muted-foreground">Extra Skills</dt>
          <dd>{state.additionalSkills.filter((skill) => skill.name.trim()).length}</dd>
          <dt className="text-muted-foreground">Feats (Nethys)</dt>
          <dd>{state.selectedFeats.length}</dd>
          <dt className="text-muted-foreground">Spells (Nethys)</dt>
          <dd>{state.selectedSpells.length}</dd>
          <dt className="text-muted-foreground">Custom Feats</dt>
          <dd>{state.customFeats.filter((feat) => feat.name.trim()).length}</dd>
          <dt className="text-muted-foreground">Special Abilities</dt>
          <dd>{state.customSpecials.filter((special) => special.trim()).length}</dd>
          <dt className="text-muted-foreground">Custom Attacks</dt>
          <dd>{state.customAttacks.filter((attack) => attack.name.trim()).length}</dd>
        </div>

        <div className="pt-2 border-t border-border">
          <p className="text-xs text-muted-foreground mb-2">Ability Modifiers</p>
          <div className="flex gap-4 flex-wrap">
            {(["str", "dex", "con", "int", "wis", "cha"] as const).map((ab) => (
              <div key={ab} className="text-center">
                <p className="text-[10px] text-muted-foreground uppercase">{ab}</p>
                <p className="text-sm font-bold font-mono">{abilityMod(abilities[ab])}</p>
              </div>
            ))}
          </div>
        </div>

        {state.guildId && (
          <p className="text-xs text-muted-foreground pt-1 border-t border-border">
            Linked to Discord server {state.guildId}
          </p>
        )}
      </div>

      {submitError && <p className="text-sm text-destructive">{submitError}</p>}

      <div className="flex justify-between pt-2">
        <button type="button" onClick={onBack} className="btn-outline px-6">
          ← Back
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={createMutation.isPending}
          className="btn-primary px-6 flex items-center gap-2"
        >
          {createMutation.isPending ? (
            <>
              <Loader2 size={16} className="animate-spin" /> Creating…
            </>
          ) : (
            "Create Character"
          )}
        </button>
      </div>
    </div>
  );
}
