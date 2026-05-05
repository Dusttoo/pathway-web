-- Dedicated companions table so companion data is independently queryable
-- and survives bot redeployments without relying on the characters.overlay JSONB blob.

CREATE TABLE companions (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  char_key     TEXT        NOT NULL,
  comp_key     TEXT        NOT NULL,
  display_name TEXT        NOT NULL,
  base_type    TEXT        NOT NULL,
  form         TEXT        NOT NULL DEFAULT 'young',
  notes        TEXT        NOT NULL DEFAULT '',
  current_hp   INTEGER,
  custom_stats JSONB,
  is_active    BOOLEAN     NOT NULL DEFAULT false,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, char_key, comp_key)
);

CREATE INDEX idx_companions_user_char ON companions(user_id, char_key);

ALTER TABLE companions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own companions"
  ON companions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role full access"
  ON companions FOR ALL TO service_role
  USING (true) WITH CHECK (true);

CREATE TRIGGER companions_updated_at
  BEFORE UPDATE ON companions
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
