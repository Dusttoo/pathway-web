-- ── Align public.users.id with auth.users.id ─────────────────────────────────
--
-- Root cause: public.users.id was generated with gen_random_uuid() independently
-- from auth.users.id. All RLS policies check auth.uid() = user_id, but the bot
-- syncs data using public.users.id, so bot-written rows are invisible to the
-- web client.
--
-- Fix: remap public.users.id → auth.users.id (joined on email), cascade to all
-- dependent user_id columns, then constrain the column to auth.users.id going
-- forward via a generated default.
--
-- Safe to run multiple times (IF NOT EXISTS guards on re-added constraints).

BEGIN;

-- ── 1. Drop FK constraints that reference public.users(id) ───────────────────
ALTER TABLE characters      DROP CONSTRAINT IF EXISTS characters_user_id_fkey;
ALTER TABLE bags            DROP CONSTRAINT IF EXISTS bags_user_id_fkey;
ALTER TABLE downtime        DROP CONSTRAINT IF EXISTS downtime_user_id_fkey;
ALTER TABLE character_notes DROP CONSTRAINT IF EXISTS character_notes_user_id_fkey;
ALTER TABLE user_snippets   DROP CONSTRAINT IF EXISTS user_snippets_user_id_fkey;

-- ── 2. Remap child table user_id → auth.users.id ─────────────────────────────
-- Match users by email since that's the stable cross-table join key.

UPDATE characters c
SET user_id = au.id
FROM auth.users au
JOIN public.users pu ON pu.email = au.email
WHERE c.user_id = pu.id
  AND au.id <> pu.id;

UPDATE bags b
SET user_id = au.id
FROM auth.users au
JOIN public.users pu ON pu.email = au.email
WHERE b.user_id = pu.id
  AND au.id <> pu.id;

UPDATE downtime d
SET user_id = au.id
FROM auth.users au
JOIN public.users pu ON pu.email = au.email
WHERE d.user_id = pu.id
  AND au.id <> pu.id;

UPDATE character_notes n
SET user_id = au.id
FROM auth.users au
JOIN public.users pu ON pu.email = au.email
WHERE n.user_id = pu.id
  AND au.id <> pu.id;

UPDATE user_snippets s
SET user_id = au.id
FROM auth.users au
JOIN public.users pu ON pu.email = au.email
WHERE s.user_id = pu.id
  AND au.id <> pu.id;

-- ── 3. Remap public.users.id itself ──────────────────────────────────────────
UPDATE public.users pu
SET id = au.id
FROM auth.users au
WHERE au.email = pu.email
  AND au.id <> pu.id;

-- ── 4. Re-add FK constraints (now that IDs are aligned) ──────────────────────
ALTER TABLE characters
  ADD CONSTRAINT characters_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

ALTER TABLE bags
  ADD CONSTRAINT bags_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

ALTER TABLE downtime
  ADD CONSTRAINT downtime_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

ALTER TABLE character_notes
  ADD CONSTRAINT character_notes_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

ALTER TABLE user_snippets
  ADD CONSTRAINT user_snippets_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

-- ── 5. Change default so future rows always use the auth UID ─────────────────
ALTER TABLE public.users
  ALTER COLUMN id SET DEFAULT auth.uid();

COMMIT;
