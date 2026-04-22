import { Suspense } from "react";
import HeroCarousel from "@/components/HeroCarousel";
import AnimeRow from "@/components/AnimeRow";
import MangaRow from "@/components/MangaRow";
import WeeklyPickCard from "@/components/WeeklyPickCard";
import HomeSearchBar from "@/components/HomeSearchBar";
import { cachedGetSeasonNow, cachedGetSeasonUpcoming, cachedGetTopManga, cachedBrowseManga, cachedBrowseAnime } from "@/lib/jikanCache";
import { getSiteMode } from "@/lib/mode";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import Image from "next/image";
import type { Anime, Manga } from "@/lib/jikan";

export const revalidate = 0;

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

function dedup<T extends { mal_id: number }>(arr: T[]): T[] {
  const seen = new Set<number>();
  return arr.filter((a) => (seen.has(a.mal_id) ? false : (seen.add(a.mal_id), true)));
}

// ── User activity sections ────────────────────────────────────────────────

async function ContinueWatchingSection() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: watching } = await supabase
    .from("watchlist")
    .select("mal_id, title, image_url, episodes_watched, total_episodes")
    .eq("user_id", user.id)
    .eq("status", "watching")
    .order("added_at", { ascending: false })
    .limit(12);

  const { data: reading } = await supabase
    .from("manga_list")
    .select("mal_id, title, image_url, chapters_read, total_chapters")
    .eq("user_id", user.id)
    .eq("status", "reading")
    .order("added_at", { ascending: false })
    .limit(12);

  const hasWatching = (watching?.length ?? 0) > 0;
  const hasReading = (reading?.length ?? 0) > 0;
  if (!hasWatching && !hasReading) return null;

  return (
    <div className="space-y-5 mb-10">
      {hasWatching && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-white font-semibold text-base tracking-wide">Continue Watching</h2>
            <Link href="/watchlist?status=watching" className="text-zinc-500 hover:text-red-500 text-xs transition-colors">
              See All →
            </Link>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
            {watching!.map((item) => {
              const pct = item.total_episodes && item.total_episodes > 0
                ? Math.min(100, (item.episodes_watched / item.total_episodes) * 100)
                : null;
              return (
                <Link key={item.mal_id} href={`/anime/${item.mal_id}`} className="flex-none w-28 group">
                  <div className="relative aspect-[3/4] rounded-lg overflow-hidden bg-zinc-800 border border-zinc-800 group-hover:border-red-900 transition-colors">
                    {item.image_url && (
                      <Image src={item.image_url} alt={item.title} fill className="object-cover" unoptimized sizes="112px" />
                    )}
                    {pct !== null && (
                      <div className="absolute bottom-0 left-0 right-0 h-1 bg-zinc-800">
                        <div className="h-full bg-red-600" style={{ width: `${pct}%` }} />
                      </div>
                    )}
                  </div>
                  <p className="text-zinc-400 text-xs mt-1.5 line-clamp-2 group-hover:text-white transition-colors">{item.title}</p>
                  <p className="text-zinc-600 text-[10px] mt-0.5">Ep {item.episodes_watched}/{item.total_episodes ?? "?"}</p>
                </Link>
              );
            })}
          </div>
        </section>
      )}
      {hasReading && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-white font-semibold text-base tracking-wide">Continue Reading</h2>
            <Link href="/manga-list?status=reading" className="text-zinc-500 hover:text-red-500 text-xs transition-colors">
              See All →
            </Link>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
            {reading!.map((item) => {
              const pct = item.total_chapters && item.total_chapters > 0
                ? Math.min(100, (item.chapters_read / item.total_chapters) * 100)
                : null;
              return (
                <Link key={item.mal_id} href={`/manga/${item.mal_id}`} className="flex-none w-28 group">
                  <div className="relative aspect-[3/4] rounded-lg overflow-hidden bg-zinc-800 border border-zinc-800 group-hover:border-red-900 transition-colors">
                    {item.image_url && (
                      <Image src={item.image_url} alt={item.title} fill className="object-cover" unoptimized sizes="112px" />
                    )}
                    {pct !== null && (
                      <div className="absolute bottom-0 left-0 right-0 h-1 bg-zinc-800">
                        <div className="h-full bg-red-600" style={{ width: `${pct}%` }} />
                      </div>
                    )}
                  </div>
                  <p className="text-zinc-400 text-xs mt-1.5 line-clamp-2 group-hover:text-white transition-colors">{item.title}</p>
                  <p className="text-zinc-600 text-[10px] mt-0.5">Ch {item.chapters_read}/{item.total_chapters ?? "?"}</p>
                </Link>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}

async function RecentlyAddedSection() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: items } = await supabase
    .from("watchlist")
    .select("mal_id, title, image_url, status")
    .eq("user_id", user.id)
    .order("added_at", { ascending: false })
    .limit(10);

  if (!items || items.length === 0) return null;

  return (
    <section className="mb-10">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-white font-semibold text-base tracking-wide">Recently Added</h2>
        <Link href="/watchlist" className="text-zinc-500 hover:text-red-500 text-xs transition-colors">
          See All →
        </Link>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
        {items.map((item) => (
          <Link key={item.mal_id} href={`/anime/${item.mal_id}`} className="flex-none w-28 group">
            <div className="relative aspect-[3/4] rounded-lg overflow-hidden bg-zinc-800 border border-zinc-800 group-hover:border-red-900 transition-colors">
              {item.image_url && (
                <Image src={item.image_url} alt={item.title} fill className="object-cover" unoptimized sizes="112px" />
              )}
            </div>
            <p className="text-zinc-400 text-xs mt-1.5 line-clamp-2 group-hover:text-white transition-colors">{item.title}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}

// ── Skeletons ──────────────────────────────────────────────────────────────
function CardRowSkeleton() {
  return (
    <div className="space-y-3 mb-10">
      <div className="h-5 w-40 bg-zinc-800 rounded animate-pulse" />
      <div className="flex gap-3 overflow-hidden">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex-none w-32">
            <div className="aspect-[3/4] bg-zinc-800 rounded-lg animate-pulse" />
            <div className="mt-2 h-3 bg-zinc-800 rounded animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
}

function AnimeHomeSkeleton() {
  return (
    <div>
      <div className="-mx-4 -mt-6 mb-8 h-64 sm:h-96 bg-zinc-900 animate-pulse" />
      <div className="flex flex-col items-center gap-3 mb-10">
        <div className="h-4 w-44 bg-zinc-800 rounded animate-pulse" />
        <div className="h-10 w-64 bg-zinc-800 rounded-full animate-pulse" />
      </div>
      <CardRowSkeleton />
      <CardRowSkeleton />
      <CardRowSkeleton />
    </div>
  );
}

// ── Data components (stream in after shell) ────────────────────────────────
async function AnimeHomeData() {
  const [season1Res, season2Res, upcomingRes, favoritesRes] = await Promise.allSettled([
    cachedGetSeasonNow(1),
    cachedGetSeasonNow(2),
    cachedGetSeasonUpcoming(1),
    cachedBrowseAnime({ orderBy: "favorites", sort: "desc" }),
  ]);

  const seasonPage1: Anime[] = season1Res.status === "fulfilled" ? season1Res.value.data : [];
  const seasonPage2: Anime[] = season2Res.status === "fulfilled" ? season2Res.value.data : [];
  const upcoming: Anime[]    = upcomingRes.status === "fulfilled" ? dedup(upcomingRes.value.data) : [];
  const favorites: Anime[]   = favoritesRes.status === "fulfilled" ? favoritesRes.value.data : [];

  const seasonRaw = dedup([...seasonPage1, ...seasonPage2]);
  const byScore   = [...seasonRaw].sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
  const topFive   = byScore.slice(0, 5);

  const pool    = byScore.slice(5, 15);
  const weekIdx = Math.floor(Date.now() / WEEK_MS) % Math.max(pool.length, 1);
  const weeklyPick = pool[weekIdx] ?? null;

  const usedIds = new Set<number>([
    ...topFive.map((a) => a.mal_id),
    ...(weeklyPick ? [weeklyPick.mal_id] : []),
  ]);

  const airingRow = byScore.filter((a) => !usedIds.has(a.mal_id)).slice(0, 20);
  airingRow.forEach((a) => usedIds.add(a.mal_id));
  const seasonRow = seasonRaw.filter((a) => !usedIds.has(a.mal_id)).slice(0, 20);

  return (
    <div>
      {topFive.length > 0 && (
        <div className="-mx-4 -mt-6 mb-8">
          <HeroCarousel slides={topFive} />
        </div>
      )}

      <div className="flex flex-col items-center gap-3 mb-10">
        <p className="text-zinc-500 text-sm">Search thousands of titles</p>
        <HomeSearchBar placeholder="Search anime titles..." />
      </div>

      <Suspense fallback={null}>
        <ContinueWatchingSection />
      </Suspense>

      {weeklyPick && <WeeklyPickCard anime={weeklyPick} />}

      <AnimeRow title="Currently Airing"  anime={airingRow} seeAllHref="/browse?status=airing" />
      <AnimeRow title="New This Season"   anime={seasonRow} seeAllHref="/browse?orderBy=start_date&sort=desc" />
      <AnimeRow title="Upcoming Releases" anime={upcoming}  seeAllHref="/browse?status=upcoming" />
      <AnimeRow title="All Time Favorites" anime={favorites} seeAllHref="/browse?orderBy=favorites&sort=desc" />

      <Suspense fallback={null}>
        <RecentlyAddedSection />
      </Suspense>
    </div>
  );
}

async function MangaHomeData() {
  const [topRes, popularRes, manhwaRes] = await Promise.allSettled([
    cachedGetTopManga(1),
    cachedBrowseManga({ orderBy: "popularity" }),
    cachedBrowseManga({ type: "manhwa", orderBy: "score" }),
  ]);

  const top: Manga[]     = topRes.status     === "fulfilled" ? topRes.value.data     : [];
  const popular: Manga[] = popularRes.status === "fulfilled" ? popularRes.value.data : [];
  const manhwa: Manga[]  = manhwaRes.status  === "fulfilled" ? manhwaRes.value.data  : [];

  return (
    <>
      <MangaRow title="Top Rated Manga" manga={top}     seeAllHref="/browse?orderBy=score" />
      <MangaRow title="Most Popular"    manga={popular} seeAllHref="/browse?orderBy=popularity" />
      <MangaRow title="Top Manhwa"      manga={manhwa}  seeAllHref="/browse?type=manhwa" />
    </>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────
export default async function HomePage() {
  const mode = await getSiteMode();

  if (mode === "manga") {
    return (
      <div>
        <div className="flex flex-col items-center gap-3 mb-10">
          <p className="text-zinc-500 text-sm">Search thousands of titles</p>
          <HomeSearchBar placeholder="Search manga titles..." />
        </div>
        <Suspense fallback={<><CardRowSkeleton /><CardRowSkeleton /><CardRowSkeleton /></>}>
          <MangaHomeData />
        </Suspense>
      </div>
    );
  }

  return (
    <Suspense fallback={<AnimeHomeSkeleton />}>
      <AnimeHomeData />
    </Suspense>
  );
}
