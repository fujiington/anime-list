const BASE_URL = "https://api.jikan.moe/v4";

// ─── Rate-limit-aware fetch with automatic retry on 429 and 500 ─────────────
async function jikanFetch(url: string, init?: RequestInit, retries = 3): Promise<Response> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    const res = await fetch(url, init);
    if (res.status === 429 && attempt < retries) {
      // Jikan rate limit — honour Retry-After header
      const wait = parseInt(res.headers.get("Retry-After") ?? "1", 10);
      await new Promise((r) => setTimeout(r, (wait + 0.5) * 1000));
      continue;
    }
    if (res.status === 500 && attempt < retries) {
      // Transient MAL upstream error — wait 1 s and retry
      await new Promise((r) => setTimeout(r, 1000));
      continue;
    }
    return res;
  }
  throw new Error("jikanFetch: unexpected exit");
}
// ─────────────────────────────────────────────────────────────────────────────

// ─── Client-side in-memory cache (no-op on server) ───────────────────────────
type CacheEntry = { data: unknown; expiresAt: number };
const _cache = new Map<string, CacheEntry>();

function _get<T>(key: string): T | null {
  if (typeof window === "undefined") return null;
  const e = _cache.get(key);
  if (!e || Date.now() > e.expiresAt) { _cache.delete(key); return null; }
  return e.data as T;
}
function _set(key: string, data: unknown, ttlMs: number): void {
  if (typeof window === "undefined") return;
  _cache.set(key, { data, expiresAt: Date.now() + ttlMs });
}
// ─────────────────────────────────────────────────────────────────────────────

export interface AnimeImage {
  jpg: { image_url: string; small_image_url: string; large_image_url: string };
  webp: { image_url: string; small_image_url: string; large_image_url: string };
}

export interface AnimeGenre {
  mal_id: number;
  name: string;
}

export interface Anime {
  mal_id: number;
  title: string;
  title_english: string | null;
  synopsis: string | null;
  images: AnimeImage;
  score: number | null;
  scored_by: number | null;
  rank: number | null;
  episodes: number | null;
  status: string;
  aired: { string: string };
  genres: AnimeGenre[];
  studios: { mal_id: number; name: string }[];
  type: string | null;
  source: string | null;
  duration: string | null;
  rating: string | null;
  popularity: number | null;
  members: number | null;
  trailer: { youtube_id: string | null; url: string | null } | null;
}

export interface PaginationData {
  last_visible_page: number;
  has_next_page: boolean;
  current_page: number;
  items: { count: number; total: number; per_page: number };
}

export interface AnimeSearchResponse {
  data: Anime[];
  pagination: PaginationData;
}

export async function searchAnime(
  query: string,
  page = 1
): Promise<AnimeSearchResponse> {
  const params = new URLSearchParams({
    q: query,
    sfw: "true",
    page: String(page),
    limit: "20",
  });
  const res = await jikanFetch(`${BASE_URL}/anime?${params}`, {
    next: { revalidate: 300 },
  });
  if (!res.ok) throw new Error(`Jikan API error: ${res.status}`);
  return res.json();
}

export async function getTopAnime(page = 1): Promise<AnimeSearchResponse> {
  const params = new URLSearchParams({
    page: String(page),
    sfw: "true",
  });
  const res = await jikanFetch(`${BASE_URL}/top/anime?${params}`, {
    next: { revalidate: 3600 },
  });
  if (!res.ok) throw new Error(`Jikan API error: ${res.status}`);
  return res.json();
}

export interface Genre {
  mal_id: number;
  name: string;
  count: number;
  url: string;
}

export type SortOrder = "desc" | "asc";
export type AnimeOrderBy =
  | "mal_id" | "title" | "start_date" | "end_date" | "episodes"
  | "score" | "scored_by" | "rank" | "popularity" | "members" | "favorites";
export type AnimeStatus = "airing" | "complete" | "upcoming";
export type AnimeType = "tv" | "movie" | "ova" | "special" | "ona" | "music";

export interface BrowseOptions {
  query?: string;
  page?: number;
  limit?: number;
  orderBy?: AnimeOrderBy;
  sort?: SortOrder;
  status?: AnimeStatus | "";
  type?: AnimeType | "";
  genres?: number[];
}

export async function getSeasonNow(page = 1): Promise<AnimeSearchResponse> {
  const params = new URLSearchParams({ page: String(page), sfw: "true" });
  const res = await jikanFetch(`${BASE_URL}/seasons/now?${params}`, { next: { revalidate: 3600 } });
  if (!res.ok) throw new Error(`Jikan API error: ${res.status}`);
  return res.json();
}

export async function getSeasonUpcoming(page = 1): Promise<AnimeSearchResponse> {
  const params = new URLSearchParams({ page: String(page), sfw: "true" });
  const res = await jikanFetch(`${BASE_URL}/seasons/upcoming?${params}`, { next: { revalidate: 3600 } });
  if (!res.ok) throw new Error(`Jikan API error: ${res.status}`);
  return res.json();
}

export async function getGenres(): Promise<{ data: Genre[] }> {
  const res = await jikanFetch(`${BASE_URL}/genres/anime`, { next: { revalidate: 86400 } });
  if (!res.ok) throw new Error(`Jikan API error: ${res.status}`);
  return res.json();
}

export async function getMangaGenres(): Promise<{ data: Genre[] }> {
  const res = await jikanFetch(`${BASE_URL}/genres/manga`, { next: { revalidate: 86400 } });
  if (!res.ok) throw new Error(`Jikan API error: ${res.status}`);
  return res.json();
}

/**
 * Orderings natively expressible via /top/anime's `filter` parameter.
 * Anything outside this set requires the /anime endpoint.
 */
const TOP_ANIME_ORDERINGS = new Set(["score", "rank", "popularity", "favorites"]);

/** Maps status/orderBy to the /top/anime `filter` value. */
function toTopFilter(status: string, orderBy: string): string | null {
  if (status === "airing") return "airing";
  if (status === "upcoming") return "upcoming";
  if (orderBy === "popularity") return "bypopularity";
  if (orderBy === "favorites") return "favorite";
  return null; // default /top/anime order (by rank/score)
}

export async function browseAnime(opts: BrowseOptions = {}): Promise<AnimeSearchResponse> {
  const { query = "", page = 1, orderBy = "score", sort = "desc", status = "", type = "", genres = [] } = opts;

  const cacheKey = `browse:${query}|${page}|${orderBy}|${sort}|${status}|${type}|${genres.join(",")}`;
  const cached = _get<AnimeSearchResponse>(cacheKey);
  if (cached) return cached;

  let json: AnimeSearchResponse;

  // Use /anime when:
  //  • there is a text query or genre filter (richer search support)
  //  • status is "complete" (/top/anime has no "complete" filter)
  //  • orderBy value is not supported by /top/anime (start_date, members, episodes, …)
  const useAnimeEndpoint =
    Boolean(query) ||
    genres.length > 0 ||
    status === "complete" ||
    !TOP_ANIME_ORDERINGS.has(orderBy);

  if (useAnimeEndpoint) {
    const params = new URLSearchParams({ page: String(page), limit: "25", sfw: "true", order_by: orderBy, sort });
    if (query) params.set("q", query);
    if (status) params.set("status", status);
    if (type) params.set("type", type);
    if (genres.length > 0) params.set("genres", genres.join(","));
    const res = await jikanFetch(`${BASE_URL}/anime?${params}`, { next: { revalidate: 300 } });
    if (!res.ok) throw new Error(`Jikan API error: ${res.status}`);
    json = await res.json();
  } else {
    // /top/anime — reliable for default browsing when no specific filter is needed
    const params = new URLSearchParams({ page: String(page), limit: "25", sfw: "true" });
    if (type) params.set("type", type);
    const filter = toTopFilter(status, orderBy);
    if (filter) params.set("filter", filter);
    const res = await jikanFetch(`${BASE_URL}/top/anime?${params}`, { next: { revalidate: 600 } });
    if (!res.ok) throw new Error(`Jikan API error: ${res.status}`);
    json = await res.json();
  }

  _set(cacheKey, json, 5 * 60_000);
  return json;
}

export async function getAnimeById(id: number): Promise<{ data: Anime }> {
  const cacheKey = `anime:${id}`;
  const cached = _get<{ data: Anime }>(cacheKey);
  if (cached) return cached;

  const res = await jikanFetch(`${BASE_URL}/anime/${id}/full`, {
    next: { revalidate: 86400 },
  });
  if (!res.ok) throw new Error(`Jikan API error: ${res.status}`);
  const json: { data: Anime } = await res.json();
  _set(cacheKey, json, 30 * 60_000);
  return json;
}

// ─── Manga ────────────────────────────────────────────────────────────────────

export interface Manga {
  mal_id: number;
  title: string;
  title_english: string | null;
  synopsis: string | null;
  images: AnimeImage;
  score: number | null;
  scored_by: number | null;
  rank: number | null;
  chapters: number | null;
  volumes: number | null;
  status: string;
  published: { string: string };
  genres: AnimeGenre[];
  authors: { mal_id: number; name: string }[];
  type: string | null;
  popularity: number | null;
  members: number | null;
}

export interface MangaSearchResponse {
  data: Manga[];
  pagination: PaginationData;
}

const TOP_MANGA_ORDERINGS = new Set(["score", "rank", "popularity", "favorites"]);

function toTopMangaFilter(orderBy: string): string | null {
  if (orderBy === "popularity") return "bypopularity";
  if (orderBy === "favorites") return "favorite";
  return null;
}

export type MangaOrderBy =
  | "mal_id" | "title" | "start_date" | "end_date" | "chapters"
  | "volumes" | "score" | "scored_by" | "rank" | "popularity" | "members" | "favorites";

export interface MangaBrowseOptions {
  query?: string;
  page?: number;
  limit?: number;
  orderBy?: MangaOrderBy;
  sort?: SortOrder;
  genres?: number[];
  type?: string;
}

export async function browseManga(opts: MangaBrowseOptions = {}): Promise<MangaSearchResponse> {
  const { query = "", page = 1, orderBy = "score", sort = "desc", genres = [], type = "" } = opts;

  const cacheKey = `manga:browse:${query}|${page}|${orderBy}|${sort}|${type}|${genres.join(",")}`;
  const cached = _get<MangaSearchResponse>(cacheKey);
  if (cached) return cached;

  let json: MangaSearchResponse;

  const useSearchEndpoint = Boolean(query) || genres.length > 0 || !TOP_MANGA_ORDERINGS.has(orderBy);

  if (useSearchEndpoint) {
    const params = new URLSearchParams({ page: String(page), limit: "25", sfw: "true", order_by: orderBy, sort });
    if (query) params.set("q", query);
    if (type) params.set("type", type);
    if (genres.length > 0) params.set("genres", genres.join(","));
    const res = await jikanFetch(`${BASE_URL}/manga?${params}`, { next: { revalidate: 300 } });
    if (!res.ok) throw new Error(`Jikan API error: ${res.status}`);
    json = await res.json();
  } else {
    const params = new URLSearchParams({ page: String(page), limit: "25", sfw: "true" });
    if (type) params.set("type", type);
    const filter = toTopMangaFilter(orderBy);
    if (filter) params.set("filter", filter);
    const res = await jikanFetch(`${BASE_URL}/top/manga?${params}`, { next: { revalidate: 600 } });
    if (!res.ok) throw new Error(`Jikan API error: ${res.status}`);
    json = await res.json();
  }

  _set(cacheKey, json, 5 * 60_000);
  return json;
}

export async function getMangaById(id: number): Promise<{ data: Manga }> {
  const cacheKey = `manga:${id}`;
  const cached = _get<{ data: Manga }>(cacheKey);
  if (cached) return cached;

  const res = await jikanFetch(`${BASE_URL}/manga/${id}/full`, { next: { revalidate: 86400 } });
  if (!res.ok) throw new Error(`Jikan API error: ${res.status}`);
  const json: { data: Manga } = await res.json();
  _set(cacheKey, json, 30 * 60_000);
  return json;
}

export async function getTopManga(page = 1): Promise<MangaSearchResponse> {
  const params = new URLSearchParams({ page: String(page), sfw: "true" });
  const res = await jikanFetch(`${BASE_URL}/top/manga?${params}`, { next: { revalidate: 3600 } });
  if (!res.ok) throw new Error(`Jikan API error: ${res.status}`);
  return res.json();
}
