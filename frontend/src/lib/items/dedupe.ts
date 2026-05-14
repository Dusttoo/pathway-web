export type DedupeItemRow = {
  aon_id?: string | null;
  aon_url?: string | null;
  bulk?: string | null;
  description?: string | null;
  id: string;
  is_magical?: boolean | null;
  is_official?: boolean | null;
  item_metadata?: unknown;
  item_subtype?: string | null;
  item_type?: string | null;
  level?: number | null;
  name: string;
  price_cp?: number | null;
  rarity?: string | null;
  source?: string | null;
  traits?: unknown;
  updated_at?: string | null;
  usage?: string | null;
};

function normalizedName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, " ");
}

function metadataObject(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function structuredSize(value: unknown): number {
  if (Array.isArray(value)) return value.length;
  if (value && typeof value === "object") return Object.keys(value).length;
  return 0;
}

function hasText(value: unknown): boolean {
  return typeof value === "string" && value.trim().length > 0;
}

function canonicalBulkScore(bulk: string | null | undefined): number {
  const normalized = bulk?.trim().toLowerCase();
  if (!normalized) return 0;
  if (normalized === "l" || normalized === "-" || normalized === String.fromCharCode(8212)) {
    return 150;
  }
  if (/^\d+$/.test(normalized)) return 125;
  if (normalized === "0.1") return 25;
  return 75;
}

export function itemDedupeKey(row: DedupeItemRow): string {
  return [normalizedName(row.name), row.level ?? 0].join("|");
}

export function itemCompletenessScore(row: DedupeItemRow): number {
  const metadata = metadataObject(row.item_metadata);
  const descriptionLength = row.description?.trim().length ?? 0;

  return (
    (row.is_official ? 100_000 : 0) +
    (hasText(row.aon_id) || hasText(metadata.aon_id) ? 10_000 : 0) +
    (hasText(row.aon_url) || hasText(metadata.aon_url) ? 2_500 : 0) +
    (row.source ? 1_000 : 0) +
    (row.price_cp && row.price_cp > 0 ? 750 : 0) +
    canonicalBulkScore(row.bulk) +
    (row.usage ? 250 : 0) +
    (row.item_type ? 200 : 0) +
    (row.item_subtype ? 150 : 0) +
    (row.is_magical ? 100 : 0) +
    structuredSize(row.traits) * 25 +
    structuredSize(row.item_metadata) * 10 +
    Math.min(descriptionLength, 5_000)
  );
}

export function dedupeItems<T extends DedupeItemRow>(rows: T[]): T[] {
  const byItem = new Map<string, T>();

  for (const row of rows) {
    const key = itemDedupeKey(row);
    const existing = byItem.get(key);

    if (!existing || itemCompletenessScore(row) > itemCompletenessScore(existing)) {
      byItem.set(key, row);
    }
  }

  return [...byItem.values()];
}
