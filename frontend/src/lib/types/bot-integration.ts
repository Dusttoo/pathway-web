// Types for tables added in the bot-integration migration.
// These supplement database.types.ts (which is auto-generated from the
// original schema) until the types are regenerated against the live DB.

export interface Combatant {
  name: string;
  initiative: number;
  hp: number;
  maxHp: number;
  ac: number | null;
  ownerId: string | null;
  isNpc: boolean;
  effects: CombatEffect[];
  dying?: number;
  wounded?: number;
  doomed?: number;
  delayed?: boolean;
  // MAP / action economy
  attacksThisTurn?: number;
  hasReaction?: boolean;
}

export interface CombatEffect {
  name: string;
  value?: number;
  duration: number | null;
  isPreset?: boolean;
  presetKey?: string;
  appliedBy?: string;
}

export interface Encounter {
  id: string;
  discord_guild_id: string;
  channel_id: string;
  gm_discord_id: string | null;
  status: "active" | "ended";
  round: number;
  turn_index: number;
  combatants: Combatant[];
  started_at: string;
  ended_at: string | null;
  updated_at: string;
}

export interface EncounterEvent {
  id: string;
  encounter_id: string;
  event_type:
    | "initiative_start"
    | "initiative_end"
    | "attack"
    | "damage"
    | "heal"
    | "death"
    | "recovery"
    | "effect_add"
    | "effect_expire"
    | "xp_award";
  actor: string | null;
  target: string | null;
  round: number | null;
  data: Record<string, unknown>;
  created_at: string;
}

export interface BotCompanion {
  displayName: string;
  baseType: string;
  form: "young" | "mature" | "nimble" | "savage" | string;
  notes: string;
  currentHp: number | null;
  customStats?: {
    hpPerLevel?: number;
    hp?: number;
    ac?: number;
    abilities?: Record<string, number>;
    size?: string;
    speed?: string;
    attacks?: unknown[];
    fromBestiary?: string;
  };
}

// Extended character row (adds columns from the bot-integration migration)
export interface CharacterOverlay {
  profile_image_url?: string | null;
  spellbook?: Array<{ caster: string; spell: string; rank: number }>;
  repertoire_swaps?: Array<{ caster: string; rank: number; remove: string; add: string }>;
  prepared_override?: Record<string, Array<{ rank: number; spell: string; slot_index: number }>>;
  daily?: {
    focus_spent: number;
    hero_points: number;
    slots_used: Record<string, Record<string, number>>;
    last_rest_at: string | null;
  };
  // NOTE: companions are no longer stored in overlay — they live in the
  // dedicated `companions` table. Use useCompanions() from use-companions.ts.
}

export interface CharacterLiveFields {
  char_key: string | null;
  current_hp: number | null;
  overlay: CharacterOverlay;
}
