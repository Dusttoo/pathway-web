-- ── Fix: bot cannot create new user rows + user UUID migration on web login ──
--
-- Root cause (two connected problems):
--
-- 1. The align_user_ids_with_auth migration changed users.id DEFAULT to
--    auth.uid(). In a Supabase service-role context (used by the bot) there
--    is no active session, so auth.uid() returns NULL. Any INSERT that relies
--    on the default (i.e. the bot creating a new Discord-only user) fails with
--    a NOT NULL violation. Characters are only held in memory and are wiped on
--    every bot restart.
--
-- 2. All user_id foreign keys lack ON UPDATE CASCADE. If a bot-only user later
--    logs into the web app, the auth callback upserts { id: auth.uid(), ... }
--    which changes users.id. Without cascade, child rows in characters, bags,
--    etc. become orphaned (FK violation or silent mismatch).
--
-- Fix:
--   a) Restore users.id DEFAULT to gen_random_uuid() — the bot can create rows
--      again. The web auth callback still explicitly passes id: authUser.id for
--      new web users, so their UUID is pinned to auth.users.id immediately.
--   b) Add ON UPDATE CASCADE to every user_id FK — when a bot-only user first
--      logs into the web app and the upsert aligns their UUID, all child rows
--      follow automatically, keeping data consistent.

BEGIN;

-- ── 1. Restore users.id default ──────────────────────────────────────────────

ALTER TABLE public.users
  ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- ── 2. Re-add all user_id FKs with ON UPDATE CASCADE ON DELETE CASCADE ────────

-- characters
ALTER TABLE characters
  DROP CONSTRAINT IF EXISTS characters_user_id_fkey;
ALTER TABLE characters
  ADD CONSTRAINT characters_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES public.users(id)
  ON DELETE CASCADE ON UPDATE CASCADE;

-- bags
ALTER TABLE bags
  DROP CONSTRAINT IF EXISTS bags_user_id_fkey;
ALTER TABLE bags
  ADD CONSTRAINT bags_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES public.users(id)
  ON DELETE CASCADE ON UPDATE CASCADE;

-- bag_items (user_id is a direct FK used for ownership checks)
ALTER TABLE bag_items
  DROP CONSTRAINT IF EXISTS bag_items_user_id_fkey;
ALTER TABLE bag_items
  ADD CONSTRAINT bag_items_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES public.users(id)
  ON DELETE CASCADE ON UPDATE CASCADE;

-- downtime
ALTER TABLE downtime
  DROP CONSTRAINT IF EXISTS downtime_user_id_fkey;
ALTER TABLE downtime
  ADD CONSTRAINT downtime_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES public.users(id)
  ON DELETE CASCADE ON UPDATE CASCADE;

-- character_notes
ALTER TABLE character_notes
  DROP CONSTRAINT IF EXISTS character_notes_user_id_fkey;
ALTER TABLE character_notes
  ADD CONSTRAINT character_notes_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES public.users(id)
  ON DELETE CASCADE ON UPDATE CASCADE;

-- user_snippets
ALTER TABLE user_snippets
  DROP CONSTRAINT IF EXISTS user_snippets_user_id_fkey;
ALTER TABLE user_snippets
  ADD CONSTRAINT user_snippets_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES public.users(id)
  ON DELETE CASCADE ON UPDATE CASCADE;

-- companions
ALTER TABLE companions
  DROP CONSTRAINT IF EXISTS companions_user_id_fkey;
ALTER TABLE companions
  ADD CONSTRAINT companions_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES public.users(id)
  ON DELETE CASCADE ON UPDATE CASCADE;

COMMIT;
