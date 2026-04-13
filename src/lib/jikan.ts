const BASE_URL = "https://api.jikan.moe/v4";

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
  const res = await fetch(`${BASE_URL}/anime?${params}`, {
    next: { revalidate: 300 },
  });
  if (!res.ok) throw new Error(`Jikan API error: ${res.status}`);
  return res.json();
}

export async function getTopAnime(page = 1): Promise<AnimeSearchResponse> {
  const params = new URLSearchParams({
    page: String(page),
    limit: "20",
    sfw: "true",
  });
  const res = await fetch(`${BASE_URL}/top/anime?${params}`, {
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

export async function getSeasonNow(page = 1, limit = 20): Promise<AnimeSearchResponse> {
  const params = new URLSearchParams({ page: String(page), limit: String(limit), sfw: "true" });
  const res = await fetch(`${BASE_URL}/seasons/now?${params}`, { next: { revalidate: 3600 } });
  if (!res.ok) throw new Error(`Jikan API error: ${res.status}`);
  return res.json();
}

export async function getSeasonUpcoming(page = 1, limit = 20): Promise<AnimeSearchResponse> {
  const params = new URLSearchParams({ page: String(page), limit: String(limit), sfw: "true" });
  const res = await fetch(`${BASE_URL}/seasons/upcoming?${params}`, { next: { revalidate: 3600 } });
  if (!res.ok) throw new Error(`Jikan API error: ${res.status}`);
  return res.json();
}

export async function getGenres(): Promise<{ data: Genre[] }> {
  const res = await fetch(`${BASE_URL}/genres/anime`, { next: { revalidate: 86400 } });
  if (!res.ok) throw new Error(`Jikan API error: ${res.status}`);
  return res.json();
}

export async function browseAnime(opts: BrowseOptions = {}): Promise<AnimeSearchResponse> {
  const { query = "", page = 1, limit = 20, orderBy = "score", sort = "desc", status = "", type = "", genres = [] } = opts;
  const params = new URLSearchParams({ page: String(page), limit: String(limit), sfw: "true", order_by: orderBy, sort });
  if (query) params.set("q", query);
  if (status) params.set("status", status);
  if (type) params.set("type", type);
  if (genres.length > 0) params.set("genres", genres.join(","));

  const cacheKey = `browse:${params.toString()}`;
  const cached = _get<AnimeSearchResponse>(cacheKey);
  if (cached) return cached;

  const res = await fetch(`${BASE_URL}/anime?${params}`, { next: { revalidate: 600 } });
  if (!res.ok) throw new Error(`Jikan API error: ${res.status}`);
  const json: AnimeSearchResponse = await res.json();
  _set(cacheKey, json, 5 * 60_000);
  return json;
}

export async function getAnimeById(id: number): Promise<{ data: Anime }> {
  const cacheKey = `anime:${id}`;
  const cached = _get<{ data: Anime }>(cacheKey);
  if (cached) return cached;

  const res = await fetch(`${BASE_URL}/anime/${id}/full`, {
    next: { revalidate: 86400 },
  });
  if (!res.ok) throw new Error(`Jikan API error: ${res.status}`);
  const json: { data: Anime } = await res.json();
  _set(cacheKey, json, 30 * 60_000);
  return json;
}
