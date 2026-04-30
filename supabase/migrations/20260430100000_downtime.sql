-- Downtime bank: per-character day counter with audit log.
-- Mirrors the shape in Pathway/commands/downtime.js.
-- Each row is one character's bank; the full audit log lives in `log` JSONB
-- rather than as individual rows so the bot never needs a separate insert per
-- accrual event (which would be ~365 inserts/year/character for no benefit).

CREATE TABLE downtime (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  char_key          TEXT        NOT NULL,
  bank              INTEGER     NOT NULL DEFAULT 0 CHECK (bank >= 0),
  last_accrual_date TEXT        NOT NULL,   -- YYYY-MM-DD UTC, matches bot's isoDate()
  log               JSONB       NOT NULL DEFAULT '[]',
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE (user_id, char_key)
);

CREATE INDEX idx_downtime_user ON downtime(user_id);

CREATE TRIGGER downtime_updated_at
  BEFORE UPDATE ON downtime
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- Row-level security: owners read/write their own rows; service role bypasses.
ALTER TABLE downtime ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own downtime"
  ON downtime FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own downtime"
  ON downtime FOR UPDATE
  USING (auth.uid() = user_id);
