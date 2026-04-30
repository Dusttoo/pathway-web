-- Homebrew entries added via /monsteradd, /spelladd, /itemadd.
-- Primary storage is still gamedata/ on the bot; this table is a durable
-- backup so entries survive Railway volume resets / forced reseeds.

CREATE TABLE homebrew_entries (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  type       TEXT        NOT NULL CHECK (type IN ('monster', 'spell', 'item')),
  entry_key  TEXT        NOT NULL,   -- slug (monsters) or lowercased name
  name       TEXT        NOT NULL,
  data       JSONB       NOT NULL,   -- full parsed entry object
  added_by   TEXT,                   -- Discord user ID of the bot owner who added it
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE (type, entry_key)
);

CREATE INDEX idx_homebrew_type ON homebrew_entries(type);

CREATE TRIGGER homebrew_entries_updated_at
  BEFORE UPDATE ON homebrew_entries
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

ALTER TABLE homebrew_entries ENABLE ROW LEVEL SECURITY;

-- Any authenticated user can read homebrew (it shows up in /monster lookups for everyone)
CREATE POLICY "Authenticated users can read homebrew"
  ON homebrew_entries FOR SELECT
  TO authenticated
  USING (true);
