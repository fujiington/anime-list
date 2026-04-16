import HeroCarousel from "@/components/HeroCarousel";
import AnimeRow from "@/components/AnimeRow";
import WeeklyPickCard from "@/components/WeeklyPickCard";
import HomeSearchBar from "@/components/HomeSearchBar";
import { getSeasonNow, getSeasonUpcoming } from "@/lib/jikan";
import type { Anime } from "@/lib/jikan";

export const revalidate = 3600;

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

function dedup<T extends { mal_id: number }>(arr: T[]): T[] {
  const seen = new Set<number>();
  return arr.filter((a) => (seen.has(a.mal_id) ? false : (seen.add(a.mal_id), true)));
}

export default async function HomePage() {
  // Fetch page 1 of both in parallel, then page 2 of each sequentially to respect rate limits
  const [seasonRes1, upcomingRes1] = await Promise.allSettled([
    getSeasonNow(1),
    getSeasonUpcoming(1),
  ]);

  const seasonPage1: Anime[] = seasonRes1.status === "fulfilled" ? seasonRes1.value.data : [];
  const upcomingPage1: Anime[] = upcomingRes1.status === "fulfilled" ? upcomingRes1.value.data : [];

  const hasMoreSeason = seasonRes1.status === "fulfilled" && seasonRes1.value.pagination.has_next_page;
  const hasMoreUpcoming = upcomingRes1.status === "fulfilled" && upcomingRes1.value.pagination.has_next_page;

  const seasonPage2: Anime[] = hasMoreSeason
    ? await getSeasonNow(2).then((r) => r.data).catch(() => [])
    : [];

  const upcomingPage2: Anime[] = hasMoreUpcoming
    ? await getSeasonUpcoming(2).then((r) => r.data).catch(() => [])
    : [];

  const seasonRaw = dedup([...seasonPage1, ...seasonPage2]);
  const upcoming = dedup([...upcomingPage1, ...upcomingPage2]);

  const byScore = [...seasonRaw].sort((a, b) => (b.score ?? 0) - (a.score ?? 0));

  const topFive = byScore.slice(0, 5);

  const pool = byScore.slice(5, 15);
  const weekIdx = Math.floor(Date.now() / WEEK_MS) % Math.max(pool.length, 1);
  const weeklyPick = pool[weekIdx] ?? null;

  // Keep track of all IDs already shown so rows don't overlap
  const usedIds = new Set<number>([
    ...topFive.map((a) => a.mal_id),
    ...(weeklyPick ? [weeklyPick.mal_id] : []),
  ]);

  const airingRow = byScore
    .filter((a) => !usedIds.has(a.mal_id))
    .slice(0, 20);

  airingRow.forEach((a) => usedIds.add(a.mal_id));

  const seasonRow = seasonRaw
    .filter((a) => !usedIds.has(a.mal_id))
    .slice(0, 20);

  return (
    <div>
      {topFive.length > 0 && (
        <div className="-mx-4 -mt-6 mb-8">
          <HeroCarousel slides={topFive} />
        </div>
      )}

      <div className="flex flex-col items-center gap-3 mb-10">
        <p className="text-zinc-500 text-sm">Search thousands of titles</p>
        <HomeSearchBar />
      </div>

      {weeklyPick && <WeeklyPickCard anime={weeklyPick} />}

      <AnimeRow title="Currently Airing"  anime={airingRow} seeAllHref="/browse?status=airing" />
      <AnimeRow title="New This Season"   anime={seasonRow} seeAllHref="/browse?orderBy=start_date&sort=desc" />
      <AnimeRow title="Upcoming Releases" anime={upcoming}  seeAllHref="/browse?status=upcoming" />
    </div>
  );
}