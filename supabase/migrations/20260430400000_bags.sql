-- Per-user inventory bag synced from the bot's bags.json.
-- One row per Discord user; categories is a JSONB map of
-- { [categoryName]: [{ name, qty }] }.

CREATE TABLE bags (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  bag_name   TEXT        NOT NULL DEFAULT 'Bag 1',
  categories JSONB       NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_bags_user ON bags(user_id);

CREATE TRIGGER bags_updated_at
  BEFORE UPDATE ON bags
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

ALTER TABLE bags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own bag"
  ON bags FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own bag"
  ON bags FOR UPDATE
  USING (auth.uid() = user_id);
