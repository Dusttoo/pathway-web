-- Character-scoped bags.
--
-- The original inventory model was one bag per user. Pathway V2 resolves most
-- bot commands to a character, so inventory needs the same scope: one bag per
-- user + character key. Existing web inventory remains on the legacy key.

ALTER TABLE public.bags
  ADD COLUMN IF NOT EXISTS char_key text NOT NULL DEFAULT '__legacy__';

ALTER TABLE public.bag_items
  ADD COLUMN IF NOT EXISTS char_key text NOT NULL DEFAULT '__legacy__';

DO $$
BEGIN
  ALTER TABLE public.bags DROP CONSTRAINT IF EXISTS bags_user_id_key;
EXCEPTION
  WHEN undefined_object THEN NULL;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS bags_user_char_key_idx
  ON public.bags (user_id, char_key);

CREATE INDEX IF NOT EXISTS bag_items_user_char_category_idx
  ON public.bag_items (user_id, char_key, category);

CREATE INDEX IF NOT EXISTS bag_items_user_char_name_idx
  ON public.bag_items (user_id, char_key, lower(display_name));

ALTER TABLE public.bags REPLICA IDENTITY FULL;
ALTER TABLE public.bag_items REPLICA IDENTITY FULL;
