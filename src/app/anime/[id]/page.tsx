import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cachedGetAnimeById, cachedGetAnimeRecommendations } from "@/lib/jikanCache";
import { createClient } from "@/lib/supabase/server";
import WatchlistButton, { type WatchlistEntry } from "@/components/WatchlistButton";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function AnimeDetailPage({ params }: Props) {
  const { id } = await params;
  const animeId = parseInt(id, 10);
  if (isNaN(animeId)) notFound();

  let anime;
  try {
    const res = await cachedGetAnimeById(animeId);
    anime = res.data;
  } catch {
    notFound();
  }

  const recommendations = await cachedGetAnimeRecommendations(animeId).catch(() => []);

  const title = anime.title_english || anime.title;
  const imageUrl = anime.images.webp?.large_image_url || anime.images.jpg.large_image_url;

  // Check watchlist status
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  let entry: WatchlistEntry | null = null;
  if (user) {
    const { data } = await supabase
      .from("watchlist")
      .select("status, user_rating, episodes_watched, total_episodes")
      .eq("user_id", user.id)
      .eq("mal_id", animeId)
      .maybeSingle();
    entry = data as WatchlistEntry | null;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-zinc-500 hover:text-white text-sm transition-colors"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="19" y1="12" x2="5" y2="12" />
          <polyline points="12 19 5 12 12 5" />
        </svg>
        Back
      </Link>

      <div className="flex flex-col sm:flex-row gap-6">
        {/* Poster */}
        <div className="shrink-0 self-start">
          <div className="relative w-48 aspect-[3/4] rounded-lg overflow-hidden bg-zinc-900 border border-zinc-800">
            <Image
              src={imageUrl}
              alt={title}
              fill
              className="object-cover"
              sizes="192px"
              priority
              unoptimized
            />
          </div>
        </div>

        {/* Info */}
        <div className="flex-1 space-y-4">
          <div>
            <h1 className="text-2xl font-bold leading-tight">{title}</h1>
            {anime.title_english && anime.title !== anime.title_english && (
              <p className="text-zinc-500 text-sm mt-1">{anime.title}</p>
            )}
          </div>

          {/* Watchlist */}
          <WatchlistButton
            malId={animeId}
            title={title}
            imageUrl={imageUrl}
            score={anime.score}
            totalEpisodes={anime.episodes ?? null}
            initialEntry={entry}
            isLoggedIn={!!user}
          />

          {/* Stats */}
          <div className="flex flex-wrap gap-2">
            {anime.score && (
              <Stat label="Score" value={`★ ${anime.score.toFixed(1)}`} accent />
            )}
            {anime.rank && <Stat label="Rank" value={`#${anime.rank}`} />}
            {anime.type && <Stat label="Type" value={anime.type} />}
            {anime.episodes && <Stat label="Episodes" value={String(anime.episodes)} />}
            {anime.status && <Stat label="Status" value={anime.status} />}
            {anime.rating && <Stat label="Rating" value={anime.rating} />}
          </div>

          {/* Genres */}
          {anime.genres?.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {anime.genres.map((g) => (
                <span
                  key={g.mal_id}
                  className="bg-zinc-900 border border-zinc-700 text-zinc-300 text-xs px-2 py-1 rounded"
                >
                  {g.name}
                </span>
              ))}
            </div>
          )}

          {/* Studios */}
          {anime.studios?.length > 0 && (
            <p className="text-zinc-500 text-sm">
              <span className="text-zinc-400">Studio:</span>{" "}
              {anime.studios.map((s) => s.name).join(", ")}
            </p>
          )}

          {/* Aired */}
          {anime.aired?.string && (
            <p className="text-zinc-500 text-sm">
              <span className="text-zinc-400">Aired:</span> {anime.aired.string}
            </p>
          )}

          {/* Synopsis */}
          {anime.synopsis && (
            <div className="space-y-1">
              <h2 className="text-white text-sm font-semibold uppercase tracking-wider">Description</h2>
              <p className="text-zinc-400 text-sm leading-relaxed">{anime.synopsis}</p>
            </div>
          )}

          {/* Trailer */}
          {anime.trailer?.youtube_id && (
            <a
              href={`https://www.youtube.com/watch?v=${anime.trailer.youtube_id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-red-900 hover:bg-red-800 text-white text-sm px-4 py-2 rounded-lg transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
              Watch Trailer
            </a>
          )}
        </div>
      </div>

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-white font-semibold text-base tracking-wide">Recommended</h2>
          <div className="flex gap-3 overflow-x-auto pb-2" style={{ scrollbarWidth: "none" }}>
            {recommendations.map((rec) => (
              <Link
                key={rec.mal_id}
                href={`/anime/${rec.mal_id}`}
                className="flex-none w-28 group"
              >
                <div className="relative aspect-[3/4] rounded-lg overflow-hidden bg-zinc-800 border border-zinc-800 group-hover:border-red-900 transition-colors">
                  <Image
                    src={rec.images.webp?.large_image_url || rec.images.jpg.large_image_url}
                    alt={rec.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                    unoptimized
                    sizes="112px"
                  />
                </div>
                <p className="text-zinc-400 text-xs mt-1.5 line-clamp-2 group-hover:text-white transition-colors">
                  {rec.title}
                </p>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className={`flex flex-col items-center px-3 py-2 rounded-lg border text-center min-w-[64px] ${accent ? "bg-red-950/40 border-red-900" : "bg-zinc-900 border-zinc-800"}`}>
      <span className={`text-sm font-bold ${accent ? "text-red-400" : "text-white"}`}>{value}</span>
      <span className="text-zinc-600 text-xs">{label}</span>
    </div>
  );
}
