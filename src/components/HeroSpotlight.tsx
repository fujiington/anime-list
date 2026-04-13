import Image from "next/image";
import Link from "next/link";
import type { Anime } from "@/lib/jikan";

export default function HeroSpotlight({ anime }: { anime: Anime }) {
  const title = anime.title_english || anime.title;
  const imageUrl = anime.images.webp?.large_image_url || anime.images.jpg.large_image_url;

  return (
    <div className="relative w-full h-[400px] md:h-[460px] rounded-xl overflow-hidden mb-8">
      {/* blurred bg */}
      <Image
        src={imageUrl}
        alt=""
        fill
        className="object-cover scale-110 blur-md brightness-[0.25]"
        unoptimized
        priority
      />
      {/* gradients */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/95 via-black/60 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

      {/* content */}
      <div className="absolute inset-0 flex items-end p-6 md:p-10">
        <div className="flex items-end gap-6 max-w-3xl">
          {/* poster */}
          <div className="hidden sm:block relative w-36 aspect-[3/4] rounded-lg overflow-hidden border border-white/10 shrink-0 shadow-2xl">
            <Image src={imageUrl} alt={title} fill className="object-cover" unoptimized />
          </div>

          {/* info */}
          <div className="space-y-3 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="bg-green-700 text-white text-xs px-2.5 py-0.5 rounded-full font-medium">
                ● Airing
              </span>
              {anime.score && (
                <span className="bg-black/60 border border-zinc-700 text-white text-xs px-2.5 py-0.5 rounded-full flex items-center gap-1">
                  <span className="text-red-400">★</span>
                  {anime.score.toFixed(1)}
                </span>
              )}
              {anime.type && (
                <span className="bg-black/60 border border-zinc-700 text-zinc-300 text-xs px-2.5 py-0.5 rounded-full">
                  {anime.type}
                </span>
              )}
              {anime.episodes && (
                <span className="bg-black/60 border border-zinc-700 text-zinc-300 text-xs px-2.5 py-0.5 rounded-full">
                  {anime.episodes} eps
                </span>
              )}
            </div>

            <h1 className="text-2xl md:text-3xl font-bold text-white leading-tight line-clamp-2">
              {title}
            </h1>

            {anime.genres?.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {anime.genres.slice(0, 5).map((g) => (
                  <Link
                    key={g.mal_id}
                    href={`/genres/${g.mal_id}?name=${encodeURIComponent(g.name)}`}
                    className="bg-white/10 hover:bg-white/20 text-zinc-300 text-xs px-2.5 py-0.5 rounded-full transition-colors"
                  >
                    {g.name}
                  </Link>
                ))}
              </div>
            )}

            {anime.synopsis && (
              <p className="text-zinc-400 text-sm leading-relaxed line-clamp-2 max-w-xl">
                {anime.synopsis}
              </p>
            )}

            <div className="flex gap-3 pt-1">
              <Link
                href={`/anime/${anime.mal_id}`}
                className="bg-red-900 hover:bg-red-800 text-white text-sm px-5 py-2.5 rounded-lg transition-colors font-medium"
              >
                View Details
              </Link>
              {anime.trailer?.youtube_id && (
                <a
                  href={`https://www.youtube.com/watch?v=${anime.trailer.youtube_id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-white/10 hover:bg-white/20 text-white text-sm px-5 py-2.5 rounded-lg transition-colors flex items-center gap-2"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                    <polygon points="5 3 19 12 5 21 5 3" />
                  </svg>
                  Trailer
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
