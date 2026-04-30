-- Per-guild campaign state synced from the bot: calendar date and weather.
-- One row per Discord guild. Bot writes via service role; web reads.
-- Pre-rendered display strings are baked into the JSONB so the web never
-- needs to run the calendar/weather engine.

CREATE TABLE guild_state (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  discord_guild_id TEXT        NOT NULL UNIQUE,
  calendar         JSONB,      -- { year, month, day, setting, weekday, monthName,
                               --   season, seasonEmoji, description, holidays[],
                               --   nextHoliday, updatedAt }
  weather          JSONB,      -- { climate, season, day, temperatureF,
                               --   temperatureCategory, precipitation, wind, fog,
                               --   soaked, description, updatedAt }
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_guild_state_guild ON guild_state(discord_guild_id);

CREATE TRIGGER guild_state_updated_at
  BEFORE UPDATE ON guild_state
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

ALTER TABLE guild_state ENABLE ROW LEVEL SECURITY;

-- Campaign date/weather are not sensitive — any authenticated user can read.
CREATE POLICY "Authenticated users can read guild state"
  ON guild_state FOR SELECT
  TO authenticated
  USING (true);
