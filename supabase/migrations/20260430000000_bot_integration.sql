-- Bot ↔ Web integration migration
-- Extends the characters table for live bot state, and adds encounters +
-- encounter_events tables for the combat tracker and session history features.

-- ============================================================
-- Phase 1 — Extend characters for live bot state
-- ============================================================

-- make guild_id optional: bot characters are guild-agnostic
ALTER TABLE characters
  ALTER COLUMN discord_guild_id DROP NOT NULL,
  ALTER COLUMN discord_guild_id SET DEFAULT NULL;

ALTER TABLE characters DROP CONSTRAINT IF EXISTS ck_characters_guild_id_not_empty;

ALTER TABLE characters
  ADD COLUMN IF NOT EXISTS char_key   TEXT,
  -- bot slug key, e.g. "aurelius" — set when bot upserts a character
  ADD COLUMN IF NOT EXISTS current_hp INTEGER,
  -- live HP from the bot; null until bot first syncs
  ADD COLUMN IF NOT EXISTS overlay    JSONB NOT NULL DEFAULT '{}';
  -- spell slots, focus pool, hero points, prepared spells (from characterOverlay.js)

-- Unique constraint lets the bot upsert without knowing the character UUID.
-- Only enforce when char_key is set (partial index for the constraint check).
ALTER TABLE characters
  ADD CONSTRAINT uq_characters_user_charkey
    UNIQUE NULLS NOT DISTINCT (user_id, char_key);

CREATE INDEX IF NOT EXISTS idx_characters_char_key ON characters(char_key);

-- ============================================================
-- Phase 2 — Encounters (live combat tracker)
-- ============================================================

CREATE TABLE IF NOT EXISTS encounters (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  discord_guild_id TEXT NOT NULL,
  channel_id       TEXT NOT NULL,
  gm_discord_id    TEXT,
  status           TEXT NOT NULL DEFAULT 'active',
  -- 'active' | 'ended'
  round            INTEGER NOT NULL DEFAULT 1,
  turn_index       INTEGER NOT NULL DEFAULT 0,
  combatants       JSONB NOT NULL DEFAULT '[]',
  -- full snapshot of the encounters.js combatant array, written on every state change
  started_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at         TIMESTAMPTZ,
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT ck_encounters_status CHECK (status IN ('active', 'ended'))
);

CREATE INDEX IF NOT EXISTS idx_encounters_guild  ON encounters(discord_guild_id);
CREATE INDEX IF NOT EXISTS idx_encounters_status ON encounters(status);
CREATE INDEX IF NOT EXISTS idx_encounters_channel ON encounters(channel_id);

-- One active encounter per channel at a time.
CREATE UNIQUE INDEX IF NOT EXISTS uq_encounters_active_channel
  ON encounters(channel_id)
  WHERE status = 'active';

CREATE TRIGGER encounters_updated_at
  BEFORE UPDATE ON encounters
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- ============================================================
-- Phase 3 — Encounter events (session history log)
-- ============================================================

CREATE TABLE IF NOT EXISTS encounter_events (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  encounter_id UUID NOT NULL REFERENCES encounters(id) ON DELETE CASCADE,
  event_type   TEXT NOT NULL,
  -- 'initiative_start' | 'initiative_end' | 'attack' | 'damage' | 'heal' |
  -- 'death' | 'recovery' | 'effect_add' | 'effect_expire' | 'xp_award'
  actor        TEXT,
  -- combatant name or Discord username who caused the event
  target       TEXT,
  -- combatant name who was affected (null for non-targeted events)
  round        INTEGER,
  data         JSONB NOT NULL DEFAULT '{}',
  -- event-specific payload, e.g. {"roll": 24, "damage": 15, "hit": true, "crit": false}
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_encounter_events_encounter ON encounter_events(encounter_id);
CREATE INDEX IF NOT EXISTS idx_encounter_events_type      ON encounter_events(event_type);
CREATE INDEX IF NOT EXISTS idx_encounter_events_created   ON encounter_events(created_at);
