-- Roll snippets synced from the bot's snippets.json / server_snippets.json.
-- Personal snippets: one row per user (snippets JSONB = { name: expansion }).
-- Server snippets:   one row per guild.

CREATE TABLE user_snippets (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  snippets   JSONB       NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_user_snippets_user ON user_snippets(user_id);

CREATE TRIGGER user_snippets_updated_at
  BEFORE UPDATE ON user_snippets
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

ALTER TABLE user_snippets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own snippets"
  ON user_snippets FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own snippets"
  ON user_snippets FOR UPDATE
  USING (auth.uid() = user_id);

-- Server snippets are guild-scoped; any authenticated user can read them.
CREATE TABLE guild_snippets (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  discord_guild_id TEXT        NOT NULL UNIQUE,
  snippets         JSONB       NOT NULL DEFAULT '{}',
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_guild_snippets_guild ON guild_snippets(discord_guild_id);

CREATE TRIGGER guild_snippets_updated_at
  BEFORE UPDATE ON guild_snippets
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

ALTER TABLE guild_snippets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read guild snippets"
  ON guild_snippets FOR SELECT
  TO authenticated
  USING (true);
