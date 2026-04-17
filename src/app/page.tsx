import HeroCarousel from "@/components/HeroCarousel";
import AnimeRow from "@/components/AnimeRow";
import MangaRow from "@/components/MangaRow";
import WeeklyPickCard from "@/components/WeeklyPickCard";
import HomeSearchBar from "@/components/HomeSearchBar";
import { getSeasonNow, getSeasonUpcoming, getTopManga, browseManga } from "@/lib/jikan";
import { getSiteMode } from "@/lib/mode";
import type { Anime, Manga } from "@/lib/jikan";

export const revalidate = 3600;

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

function dedup<T extends { mal_id: number }>(arr: T[]): T[] {
  const seen = new Set<number>();
  return arr.filter((a) => (seen.has(a.mal_id) ? false : (seen.add(a.mal_id), true)));
}

export default async function HomePage() {
  const mode = await getSiteMode();

  if (mode === "manga") {
    const [topRes, popularRes, manhwaRes] = await Promise.allSettled([
      getTopManga(1),
      browseManga({ orderBy: "popularity" }),
      browseManga({ type: "manhwa", orderBy: "score" }),
    ]);

    const top: Manga[]     = topRes.status     === "fulfilled" ? topRes.value.data     : [];
    const popular: Manga[] = popularRes.status === "fulfilled" ? popularRes.value.data : [];
    const manhwa: Manga[]  = manhwaRes.status  === "fulfilled" ? manhwaRes.value.data  : [];

    return (
      <div>
        <div className="flex flex-col items-center gap-3 mb-10">
          <p className="text-zinc-500 text-sm">Search thousands of titles</p>
          <HomeSearchBar placeholder="Search manga titles..." />
        </div>
        <MangaRow title="Top Rated Manga"  manga={top}     seeAllHref="/browse?orderBy=score" />
        <MangaRow title="Most Popular"     manga={popular} seeAllHref="/browse?orderBy=popularity" />
        <MangaRow title="Top Manhwa"       manga={manhwa}  seeAllHref="/browse?type=manhwa" />
      </div>
    );
  }

  // ── Anime mode ─────────────────────────────────────────────────────────────
  // All 3 in parallel — Jikan allows 3 req/s so no 429 risk.
  const [season1Res, season2Res, upcomingRes] = await Promise.allSettled([
    getSeasonNow(1),
    getSeasonNow(2),
    getSeasonUpcoming(1),
  ]);

  const seasonPage1: Anime[] = season1Res.status === "fulfilled" ? season1Res.value.data : [];
  const seasonPage2: Anime[] = season2Res.status === "fulfilled" ? season2Res.value.data : [];
  const upcoming: Anime[]    = upcomingRes.status === "fulfilled" ? dedup(upcomingRes.value.data) : [];

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

      {weeklyPick && <WeeklyPickCard anime={weeklyPick} />}

      <AnimeRow title="Currently Airing"  anime={airingRow} seeAllHref="/browse?status=airing" />
      <AnimeRow title="New This Season"   anime={seasonRow} seeAllHref="/browse?orderBy=start_date&sort=desc" />
      <AnimeRow title="Upcoming Releases" anime={upcoming}  seeAllHref="/browse?status=upcoming" />
    </div>
  );
}