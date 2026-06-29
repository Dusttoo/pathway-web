import type { PostgrestError } from "@supabase/supabase-js";

// Any Supabase query builder is structurally a thenable that also exposes
// `.range()`. We only need that one capability here, so we type against a
// minimal structural interface rather than the full PostgrestFilterBuilder
// generics (which are painful to thread through a generic helper). The page
// shape is left as `unknown[]` so callers can pass a builder typed with the
// generated DB row and assert their own narrower row type at the boundary —
// exactly as the content routes already do with `as Row[]`.
interface RangeableQuery {
  range(
    from: number,
    to: number
  ): PromiseLike<{ data: unknown[] | null; error: PostgrestError | null }>;
}

/**
 * Fetch every row a query would return, paging past PostgREST's `max-rows`
 * cap (1000 on Supabase by default).
 *
 * The content routes load an entire reference table, then filter, dedupe, and
 * paginate in JS — logic that can't be pushed into SQL because official rows
 * are merged with homebrew and matched on JSON fields. A plain `await query`
 * is silently truncated at the server cap, so anything past the first ~1000
 * rows never reaches the JS layer (and the `total`/pagination it reports is
 * wrong). This walks the table in fixed-size batches until a short page proves
 * the table is exhausted.
 *
 * `batchSize` must be <= the server's `max-rows`, or a full table would look
 * exhausted after the first (capped) page. 1000 matches the Supabase default.
 */
export async function fetchAllRows<Row>(
  query: RangeableQuery,
  options: { batchSize?: number; maxRows?: number } = {}
): Promise<{ data: Row[]; error: PostgrestError | null }> {
  const batchSize = options.batchSize ?? 1000;
  const maxRows = options.maxRows ?? 50_000;
  const all: Row[] = [];

  for (let from = 0; from < maxRows; from += batchSize) {
    const { data, error } = await query.range(from, from + batchSize - 1);
    if (error) return { data: all, error };

    const rows = (data ?? []) as Row[];
    all.push(...rows);

    // A page shorter than the batch means we've reached the end of the table.
    if (rows.length < batchSize) break;
  }

  return { data: all, error: null };
}
