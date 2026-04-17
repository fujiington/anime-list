import MangaCard from "./MangaCard";
import type { Manga } from "@/lib/jikan";

interface MangaGridProps {
  manga: Manga[];
  loading?: boolean;
}

const SKELETON_COUNT = 20;

export default function MangaGrid({ manga, loading = false }: MangaGridProps) {
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

  if (manga.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-zinc-600">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mb-4">
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
        </svg>
        <p className="text-sm">No results found</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
      {manga.map((m) => (
        <MangaCard key={m.mal_id} manga={m} />
      ))}
    </div>
  );
}
