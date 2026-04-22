import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";

export const revalidate = 0;

export default async function StatsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/stats");

  const [{ data: watchlistRaw }, { data: mangaRaw }] = await Promise.all([
    supabase
      .from("watchlist")
      .select("status, user_rating, episodes_watched, total_episodes")
      .eq("user_id", user.id),
    supabase
      .from("manga_list")
      .select("status, user_rating, chapters_read, total_chapters")
      .eq("user_id", user.id),
  ]);

  const watchlist = watchlistRaw ?? [];
  const manga = mangaRaw ?? [];

  // ── Anime stats ─────────────────────────────────────────────────────────────
  const animeCounts: Record<string, number> = {
    watching: 0,
    completed: 0,
    plan_to_watch: 0,
    on_hold: 0,
    dropped: 0,
  };
  let totalEpsWatched = 0;
  const animeRatings: number[] = [];

  for (const item of watchlist) {
    animeCounts[item.status] = (animeCounts[item.status] ?? 0) + 1;
    totalEpsWatched += item.episodes_watched ?? 0;
    if (item.user_rating != null) animeRatings.push(item.user_rating);
  }

  const avgAnimeRating =
    animeRatings.length > 0
      ? (animeRatings.reduce((a, b) => a + b, 0) / animeRatings.length).toFixed(1)
      : null;

  // ── Manga stats ─────────────────────────────────────────────────────────────
  const mangaCounts: Record<string, number> = {
    reading: 0,
    completed: 0,
    plan_to_read: 0,
    on_hold: 0,
    dropped: 0,
  };
  let totalChaptersRead = 0;
  const mangaRatings: number[] = [];

  for (const item of manga) {
    mangaCounts[item.status] = (mangaCounts[item.status] ?? 0) + 1;
    totalChaptersRead += item.chapters_read ?? 0;
    if (item.user_rating != null) mangaRatings.push(item.user_rating);
  }

  const avgMangaRating =
    mangaRatings.length > 0
      ? (mangaRatings.reduce((a, b) => a + b, 0) / mangaRatings.length).toFixed(1)
      : null;

  const animeStatuses = [
    { key: "watching",      label: "Watching",       color: "bg-green-500",  count: animeCounts.watching },
    { key: "completed",     label: "Completed",      color: "bg-blue-500",   count: animeCounts.completed },
    { key: "plan_to_watch", label: "Plan to Watch",  color: "bg-zinc-400",   count: animeCounts.plan_to_watch },
    { key: "on_hold",       label: "On Hold",        color: "bg-yellow-500", count: animeCounts.on_hold },
    { key: "dropped",       label: "Dropped",        color: "bg-red-500",    count: animeCounts.dropped },
  ];

  const mangaStatuses = [
    { key: "reading",       label: "Reading",        color: "bg-green-500",  count: mangaCounts.reading },
    { key: "completed",     label: "Completed",      color: "bg-blue-500",   count: mangaCounts.completed },
    { key: "plan_to_read",  label: "Plan to Read",   color: "bg-zinc-400",   count: mangaCounts.plan_to_read },
    { key: "on_hold",       label: "On Hold",        color: "bg-yellow-500", count: mangaCounts.on_hold },
    { key: "dropped",       label: "Dropped",        color: "bg-red-500",    count: mangaCounts.dropped },
  ];

  return (
    <div className="space-y-8 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">My Stats</h1>
          <p className="text-zinc-500 text-sm mt-1">Your anime & manga activity</p>
        </div>
        <Link href="/watchlist" className="text-zinc-500 hover:text-white text-sm transition-colors">
          ← Watchlist
        </Link>
      </div>

      {/* Overview cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <BigStat label="Anime Tracked" value={String(watchlist.length)} />
        <BigStat label="Episodes Watched" value={String(totalEpsWatched)} />
        <BigStat label="Manga Tracked" value={String(manga.length)} />
        <BigStat label="Chapters Read" value={String(totalChaptersRead)} />
      </div>

      {/* Anime breakdown */}
      <Section title="Anime Breakdown">
        <StatusBar statuses={animeStatuses} total={watchlist.length} />
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-4">
          {animeStatuses.map((s) => (
            <StatusChip key={s.key} label={s.label} count={s.count} dot={s.color} />
          ))}
          {avgAnimeRating && (
            <StatusChip label="Avg Rating" count={parseFloat(avgAnimeRating)} dot="bg-red-500" suffix="/10" />
          )}
        </div>
      </Section>

      {/* Manga breakdown */}
      <Section title="Manga Breakdown">
        <StatusBar statuses={mangaStatuses} total={manga.length} />
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-4">
          {mangaStatuses.map((s) => (
            <StatusChip key={s.key} label={s.label} count={s.count} dot={s.color} />
          ))}
          {avgMangaRating && (
            <StatusChip label="Avg Rating" count={parseFloat(avgMangaRating)} dot="bg-red-500" suffix="/10" />
          )}
        </div>
      </Section>

      {/* Rating distribution (combined) */}
      {(animeRatings.length > 0 || mangaRatings.length > 0) && (
        <Section title="Rating Distribution">
          <RatingHistogram animeRatings={animeRatings} mangaRatings={mangaRatings} />
        </Section>
      )}
    </div>
  );
}

// ── Sub-components ───────────────────────────────────────────────────────────

function BigStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-center">
      <p className="text-2xl font-bold text-white">{value}</p>
      <p className="text-zinc-500 text-xs mt-1">{label}</p>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <h2 className="text-white font-semibold text-sm uppercase tracking-wider">{title}</h2>
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">{children}</div>
    </div>
  );
}

function StatusBar({
  statuses,
  total,
}: {
  statuses: { color: string; count: number }[];
  total: number;
}) {
  if (total === 0) return <p className="text-zinc-600 text-sm">No data yet.</p>;
  return (
    <div className="flex h-3 rounded-full overflow-hidden gap-px">
      {statuses
        .filter((s) => s.count > 0)
        .map((s, i) => (
          <div
            key={i}
            className={`${s.color} transition-all`}
            style={{ width: `${(s.count / total) * 100}%` }}
          />
        ))}
    </div>
  );
}

function StatusChip({
  label,
  count,
  dot,
  suffix = "",
}: {
  label: string;
  count: number;
  dot: string;
  suffix?: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className={`w-2 h-2 rounded-full shrink-0 ${dot}`} />
      <span className="text-zinc-400 text-xs flex-1">{label}</span>
      <span className="text-white text-xs font-semibold">
        {count}
        {suffix}
      </span>
    </div>
  );
}

function RatingHistogram({
  animeRatings,
  mangaRatings,
}: {
  animeRatings: number[];
  mangaRatings: number[];
}) {
  const all = [...animeRatings, ...mangaRatings];
  const buckets = Array.from({ length: 10 }, (_, i) => ({
    score: i + 1,
    count: all.filter((r) => r === i + 1).length,
  }));
  const max = Math.max(...buckets.map((b) => b.count), 1);

  return (
    <div className="flex items-end gap-1 h-20">
      {buckets.map((b) => (
        <div key={b.score} className="flex-1 flex flex-col items-center gap-1">
          <div
            className="w-full bg-red-800/70 rounded-t transition-all"
            style={{ height: `${(b.count / max) * 56}px` }}
          />
          <span className="text-zinc-600 text-[10px]">{b.score}</span>
        </div>
      ))}
    </div>
  );
}
