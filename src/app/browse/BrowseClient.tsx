"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import SearchBar from "@/components/SearchBar";
import SortBar from "@/components/SortBar";
import AnimeGrid from "@/components/AnimeGrid";
import Pagination from "@/components/Pagination";
import { browseAnime, getGenres } from "@/lib/jikan";
import type { Anime, PaginationData } from "@/lib/jikan";

export default function BrowseClient() {
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

  const [anime,        setAnime]        = useState<Anime[]>([]);
  const [pagination,   setPagination]   = useState<PaginationData | null>(null);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState<string | null>(null);
  const [genreOptions, setGenreOptions] = useState<{ value: string; label: string }[]>([]);
  const lastKeyRef = useRef<string>("");

  useEffect(() => {
    getGenres().then((res) => {
      setGenreOptions(res.data.map((g) => ({ value: String(g.mal_id), label: g.name })));
    }).catch(() => {});
  }, []);

  function pushURL(overrides: Record<string, string>) {
    const p = new URLSearchParams();
    const merged = { q: query, orderBy, sort, status, type, genre, page: String(page), ...overrides };
    for (const [k, v] of Object.entries(merged)) if (v && v !== "1") p.set(k, v);
    if (merged.page && merged.page !== "1") p.set("page", merged.page);
    router.push(`${pathname}?${p.toString()}`, { scroll: false });
  }

  const fetchData = useCallback(async () => {
    const key = `${query}|${page}|${orderBy}|${sort}|${status}|${type}|${genre}`;
    if (key === lastKeyRef.current) return;
    lastKeyRef.current = key;
    setLoading(true);
    setError(null);
    try {
      const genreIds = genre ? [parseInt(genre, 10)] : [];
      const data = await browseAnime({ query, page, orderBy: orderBy as never, sort: sort as never, status: status as never, type: type as never, genres: genreIds });
      const seen = new Set<number>();
      const deduped = data.data.filter((a) => seen.has(a.mal_id) ? false : (seen.add(a.mal_id), true));
      setAnime(deduped);
      setPagination(data.pagination);
    } catch {
      setError("Failed to load anime. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [query, page, orderBy, sort, status, type, genre]);

  useEffect(() => { fetchData(); }, [fetchData]);

  function handleSearch(q: string) {
    setQuery(q);
    setPage(1);
    pushURL({ q, page: "1" });
  }

  function handleFilter(key: string, value: string) {
    const updates: Record<string, string> = { [key]: value, page: "1" };
    if (key === "orderBy") { setOrderBy(value); }
    if (key === "sort")    { setSort(value); }
    if (key === "status")  { setStatus(value); }
    if (key === "type")    { setType(value); }
    if (key === "genre")   { setGenre(value); }
    setPage(1);
    pushURL(updates);
  }

  function handlePrev() {
    const p = Math.max(1, page - 1);
    setPage(p);
    pushURL({ page: String(p) });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleNext() {
    const p = page + 1;
    setPage(p);
    pushURL({ page: String(p) });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <div className="space-y-5">
      {/* Header row */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Browse Anime</h1>
          {query
            ? <p className="text-zinc-500 text-sm mt-1">Results for &ldquo;{query}&rdquo;</p>
            : <p className="text-zinc-500 text-sm mt-1">Discover your next favourite</p>
          }
        </div>
        <div className="w-full sm:max-w-xs">
          <SearchBar onSearch={handleSearch} initialQuery={query} />
        </div>
      </div>

      {/* Sort / filter */}
      <SortBar orderBy={orderBy} sort={sort} status={status} type={type} genre={genre} genreOptions={genreOptions} onChange={handleFilter} />

      {/* Page info */}
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

      <AnimeGrid anime={anime} loading={loading} />

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
