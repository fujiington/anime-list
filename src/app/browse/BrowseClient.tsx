"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import SearchBar from "@/components/SearchBar";
import SortBar from "@/components/SortBar";
import AnimeGrid from "@/components/AnimeGrid";
import MangaGrid from "@/components/MangaGrid";
import Pagination from "@/components/Pagination";
import { browseAnime, browseManga, getGenres, getMangaGenres } from "@/lib/jikan";
import type { Anime, Manga, PaginationData } from "@/lib/jikan";
import type { SiteMode } from "@/lib/mode";

export default function BrowseClient({ mode }: { mode: SiteMode }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const [query,   setQuery]   = useState(() => searchParams.get("q")       ?? "");
  const [orderBy, setOrderBy] = useState(() => searchParams.get("orderBy") ?? "score");
  const [sort,    setSort]    = useState(() => searchParams.get("sort")    ?? "desc");
  const [status,  setStatus]  = useState(() => searchParams.get("status")  ?? "");
  const [type,    setType]    = useState(() => searchParams.get("type")    ?? "");
  const [genre,   setGenre]   = useState(() => searchParams.get("genre")   ?? "");
  const [page,    setPage]    = useState(() => parseInt(searchParams.get("page") ?? "1", 10) || 1);

  const [results,      setResults]      = useState<(Anime | Manga)[]>([]);
  const [pagination,   setPagination]   = useState<PaginationData | null>(null);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState<string | null>(null);
  const [genreOptions, setGenreOptions] = useState<{ value: string; label: string }[]>([]);
  const lastKeyRef = useRef<string>("");

  useEffect(() => {
    const fetchGenres = mode === "manga" ? getMangaGenres : getGenres;
    fetchGenres().then((res) => {
      setGenreOptions(res.data.map((g) => ({ value: String(g.mal_id), label: g.name })));
    }).catch(() => {});
  }, [mode]);

  // Reset state when mode changes
  useEffect(() => {
    setQuery(""); setOrderBy("score"); setSort("desc");
    setStatus(""); setType(""); setGenre(""); setPage(1);
    lastKeyRef.current = "";
  }, [mode]);

  function pushURL(overrides: Record<string, string>) {
    const p = new URLSearchParams();
    const merged = { q: query, orderBy, sort, status, type, genre, page: String(page), ...overrides };
    for (const [k, v] of Object.entries(merged)) if (v && v !== "1") p.set(k, v);
    if (merged.page && merged.page !== "1") p.set("page", merged.page);
    router.push(`${pathname}?${p.toString()}`, { scroll: false });
  }

  const fetchData = useCallback(async () => {
    const key = `${mode}|${query}|${page}|${orderBy}|${sort}|${status}|${type}|${genre}`;
    if (key === lastKeyRef.current) return;
    lastKeyRef.current = key;
    setLoading(true);
    setError(null);
    try {
      const genreIds = genre ? [parseInt(genre, 10)] : [];
      if (mode === "manga") {
        const data = await browseManga({ query, page, orderBy: orderBy as never, sort: sort as never, type: type as never, genres: genreIds });
        setResults(data.data);
        setPagination(data.pagination);
      } else {
        const data = await browseAnime({ query, page, orderBy: orderBy as never, sort: sort as never, status: status as never, type: type as never, genres: genreIds });
        const seen = new Set<number>();
        setResults(data.data.filter((a) => seen.has(a.mal_id) ? false : (seen.add(a.mal_id), true)));
        setPagination(data.pagination);
      }
    } catch {
      setError(`Failed to load ${mode}. Please try again.`);
    } finally {
      setLoading(false);
    }
  }, [mode, query, page, orderBy, sort, status, type, genre]);

  useEffect(() => { fetchData(); }, [fetchData]);

  function handleSearch(q: string) {
    setQuery(q); setPage(1);
    pushURL({ q, page: "1" });
  }

  function handleFilter(key: string, value: string) {
    const updates: Record<string, string> = { [key]: value, page: "1" };
    if (key === "orderBy") setOrderBy(value);
    if (key === "sort")    setSort(value);
    if (key === "status")  setStatus(value);
    if (key === "type")    setType(value);
    if (key === "genre")   setGenre(value);
    setPage(1);
    pushURL(updates);
  }

  function handlePrev() {
    const p = Math.max(1, page - 1);
    setPage(p); pushURL({ page: String(p) });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleNext() {
    const p = page + 1;
    setPage(p); pushURL({ page: String(p) });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const label = mode === "manga" ? "Manga" : "Anime";

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Browse {label}</h1>
          {query
            ? <p className="text-zinc-500 text-sm mt-1">Results for &ldquo;{query}&rdquo;</p>
            : <p className="text-zinc-500 text-sm mt-1">Discover your next favourite</p>
          }
        </div>
        <div className="w-full sm:max-w-xs">
          <SearchBar onSearch={handleSearch} initialQuery={query} />
        </div>
      </div>

      <SortBar
        orderBy={orderBy} sort={sort} status={status} type={type}
        genre={genre} genreOptions={genreOptions}
        onChange={handleFilter}
        mode={mode}
      />

      {pagination && (
        <p className="text-zinc-600 text-xs">
          Page {page} of {pagination.last_visible_page}
        </p>
      )}

      {error && (
        <div className="bg-red-950/40 border border-red-900 text-red-300 text-sm rounded-lg px-4 py-3">
          {error}
        </div>
      )}

      {mode === "manga"
        ? <MangaGrid manga={results as Manga[]} loading={loading} />
        : <AnimeGrid anime={results as Anime[]} loading={loading} />
      }

      {!loading && pagination && (pagination.has_next_page || page > 1) && (
        <Pagination
          currentPage={page}
          hasNextPage={pagination.has_next_page}
          onPrev={handlePrev}
          onNext={handleNext}
        />
      )}
    </div>
  );
}
