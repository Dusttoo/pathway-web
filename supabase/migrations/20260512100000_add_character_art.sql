-- Add a portrait image URL column to characters.
--
-- Before this column existed, the Pathway Discord bot's /char art command set
-- charEntry.art on the in-memory entry but never persisted it: the bot's
-- syncAllCharactersToSupabase upsert didn't include an "art" field, and the
-- startup restore didn't read one back. As a result every Railway redeploy
-- wiped previously-set portrait URLs.
--
-- Companions store their portrait inside the custom_stats JSONB column on the
-- companions table, but characters have a flatter schema; an explicit text
-- column is cleaner here than piggy-backing on overlay.
alter table public.characters
  add column if not exists art text;

comment on column public.characters.art is
  'Portrait image URL set via the bot /char art command. Shown as the embed thumbnail on character roll commands. Nullable.';
