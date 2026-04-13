import Image from "next/image";
import Link from "next/link";
import type { Anime } from "@/lib/jikan";

interface AnimeCardProps {
  anime: Anime;
}

export default function AnimeCard({ anime }: AnimeCardProps) {
  const title = anime.title_english || anime.title;
  const imageUrl = anime.images.webp?.large_image_url || anime.images.jpg.large_image_url;

  return (
    <Link href={`/anime/${anime.mal_id}`} className="group block">
      <article className="bg-zinc-900 rounded-lg overflow-hidden border border-zinc-800 hover:border-red-900 transition-all duration-200 hover:-translate-y-0.5">
        <div className="relative aspect-[3/4] w-full overflow-hidden bg-zinc-800">
          <Image
            src={imageUrl}
            alt={title}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            unoptimized
          />
          {anime.score && (
            <div className="absolute top-2 left-2 bg-black/70 backdrop-blur-sm text-white text-xs font-semibold px-2 py-1 rounded flex items-center gap-1">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="#ef4444" stroke="none">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
              {anime.score.toFixed(1)}
            </div>
          )}
          {anime.type && (
            <div className="absolute top-2 right-2 bg-red-900/80 backdrop-blur-sm text-white text-xs px-2 py-1 rounded">
              {anime.type}
            </div>
          )}
        </div>
        <div className="p-2.5">
          <h3 className="text-white text-xs font-medium line-clamp-2 leading-snug">
            {title}
          </h3>
          <p className="text-zinc-500 text-xs mt-1">
            {anime.episodes ? `${anime.episodes} eps` : "? eps"}
            {anime.status === "Currently Airing" && (
              <span className="ml-2 text-green-500">• Airing</span>
            )}
          </p>
        </div>
      </article>
    </Link>
  );
}
