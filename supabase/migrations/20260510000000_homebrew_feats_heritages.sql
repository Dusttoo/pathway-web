-- Allow the generic homebrew_entries table to store new web-created
-- Pathfinder 2e content categories.
ALTER TABLE public.homebrew_entries
  DROP CONSTRAINT IF EXISTS homebrew_entries_type_check;

ALTER TABLE public.homebrew_entries
  ADD CONSTRAINT homebrew_entries_type_check
  CHECK (type IN ('monster', 'spell', 'item', 'feat', 'heritage', 'ancestry', 'class', 'background'));
