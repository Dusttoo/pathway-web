/**
 * Archives of Nethys Elasticsearch client.
 *
 * Uses the same public ES endpoint that 2e.aonprd.com's own search UI hits.
 * No API key needed. Be polite: low concurrency, page caching, backoff on 429.
 *
 * Docs come back shaped like `{ _id, _source: { ... } }`. The `_source` schema
 * varies per `category` — transformers in ./transform.ts normalize per type.
 */

import * as fs from "fs";
import * as path from "path";

const NETHYS_ES_URL = "https://elasticsearch.aonprd.com/aon/_search";
const NETHYS_BASE = "https://2e.aonprd.com";
const CACHE_DIR = path.resolve(__dirname, "../../.cache/nethys");
const PAGE_SIZE = 500;
const PAGE_DELAY_MS = 250;
const MAX_RETRIES = 4;

export type NethysCategory =
  | "ancestry"
  | "heritage"
  | "versatile-heritage"
  | "background"
  | "class"
  | "class-feature"
  | "archetype"
  | "feat"
  | "spell"
  | "ritual"
  | "focus"
  | "equipment"
  | "weapon"
  | "armor"
  | "shield"
  | "action"
  | "condition"
  | "trait";

export type NethysDoc = {
  _id: string;
  sort?: unknown[];
  _source: Record<string, unknown> & { name?: string; category?: string; url?: string };
};

type EsResponse = {
  hits: { total: { value: number } | number; hits: NethysDoc[] };
  pit_id?: string;
};

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

function cachePath(category: NethysCategory): string {
  return path.join(CACHE_DIR, `${category}.json`);
}

function readCache(category: NethysCategory): NethysDoc[] | null {
  const p = cachePath(category);
  if (!fs.existsSync(p)) return null;
  try {
    const raw = fs.readFileSync(p, "utf8");
    return JSON.parse(raw) as NethysDoc[];
  } catch {
    return null;
  }
}

function writeCache(category: NethysCategory, docs: NethysDoc[]): void {
  fs.mkdirSync(CACHE_DIR, { recursive: true });
  fs.writeFileSync(cachePath(category), JSON.stringify(docs, null, 0), "utf8");
}

async function postEs(body: Record<string, unknown>, attempt = 0): Promise<EsResponse> {
  const res = await fetch(NETHYS_ES_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (res.status === 429 || res.status >= 500) {
    if (attempt >= MAX_RETRIES) {
      throw new Error(`Nethys ES ${res.status} after ${MAX_RETRIES} retries`);
    }
    const wait = 1000 * Math.pow(2, attempt);
    await sleep(wait);
    return postEs(body, attempt + 1);
  }
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Nethys ES ${res.status}: ${text.slice(0, 200)}`);
  }
  return (await res.json()) as EsResponse;
}

/**
 * Fetch every document for a category, paginating with `search_after`.
 *
 * AoN's public ES cluster no longer allows fielddata access on `_id`, so sort
 * against the keyword subfield for `_source.id` instead. That field mirrors the
 * document id and is stable enough for deterministic cache refreshes.
 */
export async function fetchCategory(
  category: NethysCategory,
  opts: { refresh?: boolean; limit?: number } = {}
): Promise<NethysDoc[]> {
  if (!opts.refresh) {
    const cached = readCache(category);
    if (cached) return opts.limit ? cached.slice(0, opts.limit) : cached;
  }

  const out: NethysDoc[] = [];
  let after: unknown[] | null = null;

  while (true) {
    const body: Record<string, unknown> = {
      size: PAGE_SIZE,
      query: { term: { category } },
      sort: [{ "id.keyword": "asc" }],
    };
    if (after) body.search_after = after;

    const json = await postEs(body);
    const hits = json.hits?.hits ?? [];
    if (hits.length === 0) break;

    for (const hit of hits) out.push(hit);
    if (opts.limit && out.length >= opts.limit) break;

    const last = hits[hits.length - 1];
    after = last.sort ?? [last._source.id ?? last._id];

    if (hits.length < PAGE_SIZE) break;
    await sleep(PAGE_DELAY_MS);
  }

  if (!opts.limit) writeCache(category, out);
  return opts.limit ? out.slice(0, opts.limit) : out;
}

export function aonUrl(doc: NethysDoc): string | null {
  const u = doc._source?.url;
  if (typeof u !== "string" || !u) return null;
  return u.startsWith("http") ? u : `${NETHYS_BASE}${u.startsWith("/") ? "" : "/"}${u}`;
}
