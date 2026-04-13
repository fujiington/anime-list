import HeroCarousel from "@/components/HeroCarousel";
import AnimeRow from "@/components/AnimeRow";
import WeeklyPickCard from "@/components/WeeklyPickCard";
import HomeSearchBar from "@/components/HomeSearchBar";
import { getSeasonNow, getSeasonUpcoming } from "@/lib/jikan";

export const revalidate = 3600;

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

export default async function HomePage() {
  const [seasonRes, upcomingRes] = await Promise.allSettled([
    getSeasonNow(1, 25),
    getSeasonUpcoming(1, 12),
  ]);

  function dedup<T extends { mal_id: number }>(arr: T[]): T[] {
    const seen = new Set<number>();
    return arr.filter((a) => seen.has(a.mal_id) ? false : (seen.add(a.mal_id), true));
  }

  const seasonRaw = dedup(seasonRes.status  === "fulfilled" ? seasonRes.value.data  : []);
  const upcoming  = dedup(upcomingRes.status === "fulfilled" ? upcomingRes.value.data : []);

  const byScore = [...seasonRaw].sort((a, b) => (b.score ?? 0) - (a.score ?? 0));

  const topFive = byScore.slice(0, 5);

  const pool = byScore.slice(5, 15);
  const weekIdx = Math.floor(Date.now() / WEEK_MS) % Math.max(pool.length, 1);
  const weeklyPick = pool[weekIdx] ?? null;

  const usedIds = new Set([...topFive.map((a) => a.mal_id), weeklyPick?.mal_id]);

  const airingRow = byScore.filter((a) => !usedIds.has(a.mal_id)).slice(0, 12);

  const seasonRow = seasonRaw.filter((a) => !usedIds.has(a.mal_id)).slice(0, 12);

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