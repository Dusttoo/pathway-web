CREATE TABLE character_builder_drafts (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE UNIQUE,
  name          TEXT        NOT NULL DEFAULT 'Untitled Character',
  builder_state JSONB       NOT NULL DEFAULT '{}',
  current_step  INTEGER     NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_character_builder_drafts_user ON character_builder_drafts(user_id);
CREATE INDEX idx_character_builder_drafts_updated ON character_builder_drafts(updated_at DESC);

CREATE TRIGGER character_builder_drafts_updated_at
  BEFORE UPDATE ON character_builder_drafts
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

ALTER TABLE character_builder_drafts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own character builder draft"
  ON character_builder_drafts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own character builder draft"
  ON character_builder_drafts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own character builder draft"
  ON character_builder_drafts FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own character builder draft"
  ON character_builder_drafts FOR DELETE
  USING (auth.uid() = user_id);
