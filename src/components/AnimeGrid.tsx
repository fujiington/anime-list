import AnimeCard from "./AnimeCard";
import type { Anime } from "@/lib/jikan";

interface AnimeGridProps {
  anime: Anime[];
  loading?: boolean;
}

const SKELETON_COUNT = 20;

export default function AnimeGrid({ anime, loading = false }: AnimeGridProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {Array.from({ length: SKELETON_COUNT }).map((_, i) => (
          <div key={i} className="bg-zinc-900 rounded-lg overflow-hidden border border-zinc-800 animate-pulse">
            <div className="aspect-[3/4] bg-zinc-800" />
            <div className="p-2.5 space-y-1.5">
              <div className="h-3 bg-zinc-800 rounded w-4/5" />
              <div className="h-3 bg-zinc-800 rounded w-2/5" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (anime.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-zinc-600">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mb-4">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <p className="text-sm">No results found</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
      {anime.map((a) => (
        <AnimeCard key={a.mal_id} anime={a} />
      ))}
    </div>
  );
}
