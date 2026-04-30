-- Per-character session notebook synced from the bot's notes.json.
-- One row per character; the full notes array lives in `notes` JSONB so the
-- bot can upsert with a single call after any add/edit/remove/pin.

CREATE TABLE character_notes (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  char_key   TEXT        NOT NULL,
  next_id    INTEGER     NOT NULL DEFAULT 1,
  notes      JSONB       NOT NULL DEFAULT '[]',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE (user_id, char_key)
);

CREATE INDEX idx_character_notes_user ON character_notes(user_id);

CREATE TRIGGER character_notes_updated_at
  BEFORE UPDATE ON character_notes
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

ALTER TABLE character_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own notes"
  ON character_notes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notes"
  ON character_notes FOR UPDATE
  USING (auth.uid() = user_id);
