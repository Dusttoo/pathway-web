-- Per-guild monster art URLs and stat overrides synced from the bot.
-- Each table stores the full guild object as JSONB (one row per guild),
-- mirroring monster_art.json[guildId] and monster_edits.json[guildId].

CREATE TABLE monster_art (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  discord_guild_id TEXT        NOT NULL UNIQUE,
  art              JSONB       NOT NULL DEFAULT '{}',
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_monster_art_guild ON monster_art(discord_guild_id);

CREATE TRIGGER monster_art_updated_at
  BEFORE UPDATE ON monster_art
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

ALTER TABLE monster_art ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read monster art"
  ON monster_art FOR SELECT
  TO authenticated
  USING (true);

CREATE TABLE monster_edits (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  discord_guild_id TEXT        NOT NULL UNIQUE,
  edits            JSONB       NOT NULL DEFAULT '{}',
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_monster_edits_guild ON monster_edits(discord_guild_id);

CREATE TRIGGER monster_edits_updated_at
  BEFORE UPDATE ON monster_edits
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

ALTER TABLE monster_edits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read monster edits"
  ON monster_edits FOR SELECT
  TO authenticated
  USING (true);
