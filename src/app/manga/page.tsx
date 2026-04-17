import Link from "next/link";
import Image from "next/image";
import { getTopManga, browseManga } from "@/lib/jikan";
import type { Manga } from "@/lib/jikan";

export const revalidate = 3600;

function MangaCard({ manga }: { manga: Manga }) {
  const title = manga.title_english || manga.title;
  const imageUrl =
    manga.images.webp?.large_image_url || manga.images.jpg.large_image_url;

  return (
    <Link href={`/manga/${manga.mal_id}`} className="group block">
      <article className="bg-zinc-900 rounded-xl overflow-hidden border border-zinc-800 hover:border-red-900/60 transition-all duration-200 hover:-translate-y-0.5">
        <div className="relative aspect-[3/4] w-full bg-zinc-800 overflow-hidden">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={title}
              fill
              sizes="(max-width: 640px) 50vw, 20vw"
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              unoptimized
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-zinc-700">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
              </svg>
            </div>
          )}
          {manga.score && (
            <div className="absolute top-2 left-2 bg-black/70 backdrop-blur-sm text-white text-xs font-semibold px-2 py-1 rounded-lg flex items-center gap-1">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="#ef4444" stroke="none">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
              {manga.score.toFixed(1)}
            </div>
          )}
          {manga.rank && (
            <div className="absolute top-2 right-2 bg-black/70 backdrop-blur-sm text-zinc-300 text-[10px] font-semibold px-2 py-1 rounded-lg">
              #{manga.rank}
            </div>
          )}
        </div>
        <div className="p-2.5">
          <h3 className="text-white text-xs font-medium line-clamp-2 leading-snug">
            {title}
          </h3>
          {manga.type && (
            <p className="text-zinc-600 text-[10px] mt-1">{manga.type}</p>
          )}
        </div>
      </article>
    </Link>
  );
}

function Section({
  title,
  manga,
  href,
}: {
  title: string;
  manga: Manga[];
  href: string;
}) {
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">{title}</h2>
        <Link
          href={href}
          className="text-xs text-zinc-500 hover:text-red-400 transition-colors"
        >
          See all →
        </Link>
      </div>
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
        {manga.slice(0, 12).map((m) => (
          <MangaCard key={m.mal_id} manga={m} />
        ))}
      </div>
    </section>
  );
}

export default async function MangaPage() {
  const [topRes, popularRes, manhwaRes] = await Promise.allSettled([
    getTopManga(1),
    browseManga({ orderBy: "popularity" }),
    browseManga({ type: "manhwa", orderBy: "score" }),
  ]);

  const top: Manga[] =
    topRes.status === "fulfilled" ? topRes.value.data : [];
  const popular: Manga[] =
    popularRes.status === "fulfilled" ? popularRes.value.data : [];
  const manhwa: Manga[] =
    manhwaRes.status === "fulfilled" ? manhwaRes.value.data : [];

  if (top.length === 0) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Manga</h1>
        <p className="text-zinc-500 text-sm">Could not load manga right now.</p>
      </div>
    );
  }

  const topManga = top[0];
  const topTitle = topManga.title_english || topManga.title;
  const topImage =
    topManga.images.webp?.large_image_url || topManga.images.jpg.large_image_url;

  return (
    <div className="space-y-10">
      {/* Hero */}
      <div className="relative -mx-4 -mt-6 h-64 sm:h-80 overflow-hidden">
        {topImage && (
          <Image
            src={topImage}
            alt={topTitle}
            fill
            className="object-cover object-top scale-110 blur-sm opacity-30"
            unoptimized
            priority
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent" />
        <div className="absolute inset-0 flex items-end px-4 pb-6 gap-4">
          <div className="relative w-24 aspect-[3/4] rounded-xl overflow-hidden border border-zinc-700 shrink-0 shadow-2xl">
            {topImage && (
              <Image src={topImage} alt={topTitle} fill className="object-cover" unoptimized />
            )}
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="bg-red-900 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                #1 Manga
              </span>
              {topManga.type && (
                <span className="text-zinc-500 text-xs">{topManga.type}</span>
              )}
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white leading-tight line-clamp-2">
              {topTitle}
            </h1>
            <div className="flex items-center gap-3 text-xs text-zinc-400">
              {topManga.score && (
                <span className="flex items-center gap-1">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="#ef4444" stroke="none">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                  </svg>
                  {topManga.score.toFixed(1)}
                </span>
              )}
              {topManga.chapters && <span>{topManga.chapters} ch</span>}
              <span>{topManga.status}</span>
            </div>
            <Link
              href={`/manga/${topManga.mal_id}`}
              className="inline-block bg-red-900 hover:bg-red-800 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-colors"
            >
              View Details
            </Link>
          </div>
        </div>
      </div>

      {/* Top Manga */}
      <Section title="Top Manga" manga={top} href="/manga/browse" />

      {/* Most Popular */}
      {popular.length > 0 && (
        <Section title="Most Popular" manga={popular} href="/manga/browse?orderBy=popularity" />
      )}

      {/* Manhwa */}
      {manhwa.length > 0 && (
        <Section title="Manhwa" manga={manhwa} href="/manga/browse?type=manhwa" />
      )}

      {/* Reading list link */}
      <div className="flex justify-center pb-4">
        <Link
          href="/manga-list"
          className="inline-flex items-center gap-2 text-zinc-500 hover:text-white text-sm border border-zinc-800 hover:border-zinc-700 px-4 py-2.5 rounded-xl transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
          </svg>
          My Reading List
        </Link>
      </div>
    </div>
  );
}
