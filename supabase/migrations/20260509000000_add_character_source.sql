ALTER TABLE characters
  ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'pathbuilder'
  CHECK (source IN ('pathbuilder', 'native'));
