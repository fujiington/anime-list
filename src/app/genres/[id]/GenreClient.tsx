"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import SortBar from "@/components/SortBar";
import AnimeGrid from "@/components/AnimeGrid";
import MangaGrid from "@/components/MangaGrid";
import Pagination from "@/components/Pagination";
import { browseAnime, browseManga } from "@/lib/jikan";
import type { Anime, Manga, PaginationData } from "@/lib/jikan";
import type { SiteMode } from "@/lib/mode";

interface Props {
  genreId: number;
  genreName: string;
  mode: SiteMode;
}

export default function GenreClient({ genreId, genreName, mode }: Props) {
  const [orderBy, setOrderBy] = useState("score");
  const [sort,    setSort]    = useState("desc");
  const [status,  setStatus]  = useState("");
  const [type,    setType]    = useState("");
  const [page,    setPage]    = useState(1);

  const [results,    setResults]    = useState<(Anime | Manga)[]>([]);
  const [pagination, setPagination] = useState<PaginationData | null>(null);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState<string | null>(null);
  const lastKeyRef = useRef<string>("");

  const fetchData = useCallback(async () => {
    const key = `${mode}|${genreId}|${page}|${orderBy}|${sort}|${status}|${type}`;
    if (key === lastKeyRef.current) return;
    lastKeyRef.current = key;
    setLoading(true);
    setError(null);
    try {
      if (mode === "manga") {
        const data = await browseManga({ genres: [genreId], page, orderBy: orderBy as never, sort: sort as never, type: type as never });
        setResults(data.data);
        setPagination(data.pagination);
      } else {
        const data = await browseAnime({ genres: [genreId], page, orderBy: orderBy as never, sort: sort as never, status: status as never, type: type as never });
        setResults(data.data);
        setPagination(data.pagination);
      }
    } catch {
      setError(`Failed to load ${mode} for this genre.`);
    } finally {
      setLoading(false);
    }
  }, [mode, genreId, page, orderBy, sort, status, type]);

  useEffect(() => { fetchData(); }, [fetchData]);

  function handleFilter(key: string, value: string) {
    if (key === "orderBy") setOrderBy(value);
    if (key === "sort")    setSort(value);
    if (key === "status")  setStatus(value);
    if (key === "type")    setType(value);
    setPage(1);
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <Link href="/genres" className="text-zinc-600 hover:text-white text-sm transition-colors">
          ← Genres
        </Link>
        <span className="text-zinc-700">/</span>
        <h1 className="text-2xl font-bold">{genreName}</h1>
        {pagination && (
          <span className="text-zinc-600 text-xs ml-auto">
            Page {page} of {pagination.last_visible_page}
          </span>
        )}
      </div>

      <SortBar orderBy={orderBy} sort={sort} status={status} type={type} onChange={handleFilter} mode={mode} />

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
          onPrev={() => { setPage((p) => Math.max(1, p - 1)); window.scrollTo({ top: 0, behavior: "smooth" }); }}
          onNext={() => { setPage((p) => p + 1); window.scrollTo({ top: 0, behavior: "smooth" }); }}
        />
      )}
    </div>
  );
}
