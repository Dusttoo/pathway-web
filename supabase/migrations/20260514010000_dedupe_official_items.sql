-- ============================================================
-- Dedupe official item catalog rows
--
-- Earlier imports could leave a sparse legacy row beside the richer
-- Archives of Nethys row for the same item, for example "Abysium Chunk"
-- with Bulk 0.1 and no price next to the AoN row with Bulk L and 450 gp.
-- Keep the most complete row for each official item name + level, move
-- relational inventory references to that row, then remove the extras.
-- ============================================================

WITH ranked_items AS (
  SELECT
    id,
    FIRST_VALUE(id) OVER item_group AS keep_id,
    ROW_NUMBER() OVER item_group AS rank_in_group
  FROM public.items
  WHERE is_official = true
  WINDOW item_group AS (
    PARTITION BY
      lower(trim(regexp_replace(name, '\s+', ' ', 'g'))),
      level
    ORDER BY
      (
        CASE WHEN aon_id IS NOT NULL THEN 10000 ELSE 0 END
        + CASE WHEN aon_url IS NOT NULL THEN 2500 ELSE 0 END
        + CASE WHEN source IS NOT NULL AND btrim(source) <> '' THEN 1000 ELSE 0 END
        + CASE WHEN price_cp > 0 THEN 750 ELSE 0 END
        + CASE
            WHEN lower(coalesce(bulk, '')) IN ('l', '-', chr(8212)) THEN 150
            WHEN coalesce(bulk, '') ~ '^[0-9]+$' THEN 125
            WHEN coalesce(bulk, '') = '0.1' THEN 25
            WHEN coalesce(bulk, '') <> '' THEN 75
            ELSE 0
          END
        + CASE WHEN usage IS NOT NULL AND btrim(usage) <> '' THEN 250 ELSE 0 END
        + CASE WHEN item_type IS NOT NULL AND btrim(item_type) <> '' THEN 200 ELSE 0 END
        + CASE WHEN item_subtype IS NOT NULL AND btrim(item_subtype) <> '' THEN 150 ELSE 0 END
        + CASE WHEN is_magical THEN 100 ELSE 0 END
        + CASE WHEN jsonb_typeof(traits) = 'array' THEN jsonb_array_length(traits) * 25 ELSE 0 END
        + CASE WHEN item_metadata <> '{}'::jsonb THEN 100 ELSE 0 END
        + LEAST(length(coalesce(description, '')), 5000)
      ) DESC,
      updated_at DESC,
      id
  )
),
duplicates AS (
  SELECT id, keep_id
  FROM ranked_items
  WHERE rank_in_group > 1
    AND id <> keep_id
)
UPDATE public.bag_items AS bag
SET item_id = duplicates.keep_id
FROM duplicates
WHERE bag.item_id = duplicates.id;

WITH ranked_items AS (
  SELECT
    id,
    FIRST_VALUE(id) OVER item_group AS keep_id,
    ROW_NUMBER() OVER item_group AS rank_in_group
  FROM public.items
  WHERE is_official = true
  WINDOW item_group AS (
    PARTITION BY
      lower(trim(regexp_replace(name, '\s+', ' ', 'g'))),
      level
    ORDER BY
      (
        CASE WHEN aon_id IS NOT NULL THEN 10000 ELSE 0 END
        + CASE WHEN aon_url IS NOT NULL THEN 2500 ELSE 0 END
        + CASE WHEN source IS NOT NULL AND btrim(source) <> '' THEN 1000 ELSE 0 END
        + CASE WHEN price_cp > 0 THEN 750 ELSE 0 END
        + CASE
            WHEN lower(coalesce(bulk, '')) IN ('l', '-', chr(8212)) THEN 150
            WHEN coalesce(bulk, '') ~ '^[0-9]+$' THEN 125
            WHEN coalesce(bulk, '') = '0.1' THEN 25
            WHEN coalesce(bulk, '') <> '' THEN 75
            ELSE 0
          END
        + CASE WHEN usage IS NOT NULL AND btrim(usage) <> '' THEN 250 ELSE 0 END
        + CASE WHEN item_type IS NOT NULL AND btrim(item_type) <> '' THEN 200 ELSE 0 END
        + CASE WHEN item_subtype IS NOT NULL AND btrim(item_subtype) <> '' THEN 150 ELSE 0 END
        + CASE WHEN is_magical THEN 100 ELSE 0 END
        + CASE WHEN jsonb_typeof(traits) = 'array' THEN jsonb_array_length(traits) * 25 ELSE 0 END
        + CASE WHEN item_metadata <> '{}'::jsonb THEN 100 ELSE 0 END
        + LEAST(length(coalesce(description, '')), 5000)
      ) DESC,
      updated_at DESC,
      id
  )
),
duplicates AS (
  SELECT id, keep_id
  FROM ranked_items
  WHERE rank_in_group > 1
    AND id <> keep_id
)
UPDATE public.monster_items AS monster_item
SET item_id = duplicates.keep_id
FROM duplicates
WHERE monster_item.item_id = duplicates.id;

WITH ranked_items AS (
  SELECT
    id,
    FIRST_VALUE(id) OVER item_group AS keep_id,
    ROW_NUMBER() OVER item_group AS rank_in_group
  FROM public.items
  WHERE is_official = true
  WINDOW item_group AS (
    PARTITION BY
      lower(trim(regexp_replace(name, '\s+', ' ', 'g'))),
      level
    ORDER BY
      (
        CASE WHEN aon_id IS NOT NULL THEN 10000 ELSE 0 END
        + CASE WHEN aon_url IS NOT NULL THEN 2500 ELSE 0 END
        + CASE WHEN source IS NOT NULL AND btrim(source) <> '' THEN 1000 ELSE 0 END
        + CASE WHEN price_cp > 0 THEN 750 ELSE 0 END
        + CASE
            WHEN lower(coalesce(bulk, '')) IN ('l', '-', chr(8212)) THEN 150
            WHEN coalesce(bulk, '') ~ '^[0-9]+$' THEN 125
            WHEN coalesce(bulk, '') = '0.1' THEN 25
            WHEN coalesce(bulk, '') <> '' THEN 75
            ELSE 0
          END
        + CASE WHEN usage IS NOT NULL AND btrim(usage) <> '' THEN 250 ELSE 0 END
        + CASE WHEN item_type IS NOT NULL AND btrim(item_type) <> '' THEN 200 ELSE 0 END
        + CASE WHEN item_subtype IS NOT NULL AND btrim(item_subtype) <> '' THEN 150 ELSE 0 END
        + CASE WHEN is_magical THEN 100 ELSE 0 END
        + CASE WHEN jsonb_typeof(traits) = 'array' THEN jsonb_array_length(traits) * 25 ELSE 0 END
        + CASE WHEN item_metadata <> '{}'::jsonb THEN 100 ELSE 0 END
        + LEAST(length(coalesce(description, '')), 5000)
      ) DESC,
      updated_at DESC,
      id
  )
),
duplicates AS (
  SELECT id
  FROM ranked_items
  WHERE rank_in_group > 1
    AND id <> keep_id
)
DELETE FROM public.items AS item
USING duplicates
WHERE item.id = duplicates.id;
