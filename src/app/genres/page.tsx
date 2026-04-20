import Link from "next/link";
import { cachedGetGenres, cachedGetMangaGenres } from "@/lib/jikanCache";
import { getSiteMode } from "@/lib/mode";

export const revalidate = 86400;

// Pre-defined gradient pairs — index by mal_id % length so classes are static
const COLORS = [
  ["bg-red-950",    "border-red-900/40",    "text-red-300"],
  ["bg-blue-950",   "border-blue-900/40",   "text-blue-300"],
  ["bg-purple-950", "border-purple-900/40", "text-purple-300"],
  ["bg-green-950",  "border-green-900/40",  "text-green-300"],
  ["bg-orange-950", "border-orange-900/40", "text-orange-300"],
  ["bg-pink-950",   "border-pink-900/40",   "text-pink-300"],
  ["bg-yellow-950", "border-yellow-900/40", "text-yellow-300"],
  ["bg-cyan-950",   "border-cyan-900/40",   "text-cyan-300"],
  ["bg-indigo-950", "border-indigo-900/40", "text-indigo-300"],
  ["bg-teal-950",   "border-teal-900/40",   "text-teal-300"],
];

const EXCLUDED_GENRES = new Set([
  "Hentai", "Erotica", "Ecchi", "Gag Humor",
  "Sexual Content", "Magical Sex Shift",
]);

export default async function GenresPage() {
  const mode = await getSiteMode();
  let genres: { mal_id: number; name: string; count: number }[] = [];
  try {
    const data = await (mode === "manga" ? cachedGetMangaGenres() : cachedGetGenres());
    genres = data.data
      .filter((g) => !EXCLUDED_GENRES.has(g.name))
      .sort((a, b) => b.count - a.count);
  } catch {
    // show empty state
  }

  const label = mode === "manga" ? "manga" : "anime";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Genres</h1>
        <p className="text-zinc-500 text-sm mt-1">Browse {label} by genre</p>
      </div>

      {genres.length === 0 ? (
        <p className="text-zinc-600 text-sm">Could not load genres.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {genres.map((g) => {
            const [bg, border, accent] = COLORS[g.mal_id % COLORS.length];
            return (
              <Link
                key={g.mal_id}
                href={`/genres/${g.mal_id}?name=${encodeURIComponent(g.name)}`}
                className={`${bg} ${border} border rounded-lg p-4 hover:brightness-125 transition-all group hover:-translate-y-0.5`}
              >
                <h3 className={`font-semibold text-sm text-white`}>{g.name}</h3>
                <p className={`${accent} text-xs mt-1 opacity-70`}>
                  {g.count.toLocaleString()} {label}
                </p>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
