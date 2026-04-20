/**
 * Server-only cached wrappers around jikan.ts API functions.
 * Uses Next.js unstable_cache to persist results in the server-side memory
 * cache across requests — works in both dev and production, unlike the
 * plain `next: { revalidate }` fetch option which is only reliable in prod.
 *
 * Client components must continue importing directly from jikan.ts.
 */
import "server-only";
import { unstable_cache } from "next/cache";
import {
  getSeasonNow,
  getSeasonUpcoming,
  getTopManga,
  getGenres,
  getMangaGenres,
  getAnimeById,
  getMangaById,
  browseManga,
} from "./jikan";
import type { MangaBrowseOptions } from "./jikan";

// Seasonal anime — revalidate every hour
export const cachedGetSeasonNow = unstable_cache(
  async (page: number) => getSeasonNow(page),
  ["jikan-season-now"],
  { revalidate: 3600, tags: ["season"] }
);

export const cachedGetSeasonUpcoming = unstable_cache(
  async (page: number) => getSeasonUpcoming(page),
  ["jikan-season-upcoming"],
  { revalidate: 3600, tags: ["season"] }
);

// Top manga — revalidate every hour
export const cachedGetTopManga = unstable_cache(
  async (page: number) => getTopManga(page),
  ["jikan-top-manga"],
  { revalidate: 3600, tags: ["manga"] }
);

// Browse manga — revalidate every 10 minutes (used on home page for rows)
export const cachedBrowseManga = unstable_cache(
  async (opts: MangaBrowseOptions) => browseManga(opts),
  ["jikan-browse-manga"],
  { revalidate: 600, tags: ["manga"] }
);

// Genre lists — revalidate once a day (genre counts change slowly)
export const cachedGetGenres = unstable_cache(
  async () => getGenres(),
  ["jikan-genres"],
  { revalidate: 86400, tags: ["genres"] }
);

export const cachedGetMangaGenres = unstable_cache(
  async () => getMangaGenres(),
  ["jikan-manga-genres"],
  { revalidate: 86400, tags: ["genres"] }
);

// Anime/manga detail pages — revalidate once a day
export const cachedGetAnimeById = unstable_cache(
  async (id: number) => getAnimeById(id),
  ["jikan-anime-by-id"],
  { revalidate: 86400, tags: ["anime-detail"] }
);

export const cachedGetMangaById = unstable_cache(
  async (id: number) => getMangaById(id),
  ["jikan-manga-by-id"],
  { revalidate: 86400, tags: ["manga-detail"] }
);
