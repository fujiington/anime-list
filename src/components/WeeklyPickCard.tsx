import Image from "next/image";
import Link from "next/link";
import type { Anime } from "@/lib/jikan";

export default function WeeklyPickCard({ anime }: { anime: Anime }) {
  const title = anime.title_english || anime.title;
  const imageUrl = anime.images.webp?.large_image_url || anime.images.jpg.large_image_url;

  return (
    <section className="mb-10">
      <h2 className="text-white font-semibold text-base tracking-wide mb-3">
        🎯 Weekly Recommendation
      </h2>
      <Link href={`/anime/${anime.mal_id}`} className="group block">
        <div className="relative rounded-xl overflow-hidden border border-zinc-800 hover:border-red-900 transition-all bg-zinc-900">
          {/* blurred backdrop */}
          <Image
            src={imageUrl}
            alt=""
            fill
            className="object-cover blur-xl scale-110 brightness-[0.15] group-hover:brightness-[0.2] transition-all"
            unoptimized
          />
          <div className="relative flex gap-4 p-4 sm:p-5">
            {/* poster */}
            <div className="relative w-20 sm:w-28 shrink-0 aspect-[3/4] rounded-lg overflow-hidden border border-white/10">
              <Image src={imageUrl} alt={title} fill className="object-cover" unoptimized />
            </div>

            {/* info */}
            <div className="flex-1 min-w-0 space-y-2">
              <div className="flex flex-wrap gap-1.5">
                <span className="bg-red-900/80 text-white text-xs px-2 py-0.5 rounded-full font-medium">
                  ★ Pick of the Week
                </span>
                {anime.score && (
                  <span className="bg-black/60 border border-zinc-700 text-white text-xs px-2 py-0.5 rounded-full">
                    {anime.score.toFixed(1)} / 10
                  </span>
                )}
                {anime.type && (
                  <span className="bg-black/60 border border-zinc-700 text-zinc-400 text-xs px-2 py-0.5 rounded-full">
                    {anime.type}
                  </span>
                )}
              </div>

              <h3 className="text-white font-bold text-base sm:text-lg leading-tight line-clamp-1">
                {title}
              </h3>

              {anime.genres?.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {anime.genres.slice(0, 4).map((g) => (
                    <span key={g.mal_id} className="bg-white/10 text-zinc-400 text-xs px-2 py-0.5 rounded">
                      {g.name}
                    </span>
                  ))}
                </div>
              )}

              {anime.synopsis && (
                <p className="text-zinc-400 text-xs sm:text-sm leading-relaxed line-clamp-2">
                  {anime.synopsis}
                </p>
              )}

              <p className="text-red-500 text-xs font-medium group-hover:text-red-400 transition-colors">
                View Details →
              </p>
            </div>
          </div>
        </div>
      </Link>
    </section>
  );
}
