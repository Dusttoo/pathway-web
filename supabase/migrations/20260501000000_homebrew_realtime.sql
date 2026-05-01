-- Enable full replica identity on homebrew_entries so that DELETE events
-- published via Supabase Realtime include all columns (not just the PK).
-- Without this, payload.old only contains { id } which is insufficient
-- for the bot to know which in-memory entry to remove.
ALTER TABLE public.homebrew_entries REPLICA IDENTITY FULL;

-- Add the table to the supabase_realtime publication so the Realtime
-- service broadcasts INSERT / UPDATE / DELETE events for it.
ALTER PUBLICATION supabase_realtime ADD TABLE public.homebrew_entries;
