import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

export const revalidate = 60;

interface Props {
  params: Promise<{ username: string }>;
}

const AVATAR_COLORS = [
  "bg-red-800","bg-blue-800","bg-green-800","bg-purple-800",
  "bg-orange-800","bg-pink-800","bg-teal-800","bg-indigo-800",
];
function avatarColor(id: string) {
  const hash = id.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

export default async function PublicProfilePage({ params }: Props) {
  const { username } = await params;
  const supabase = await createClient();

  // Look up profile by username
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, username, avatar_url, created_at")
    .eq("username", username)
    .maybeSingle();

  if (!profile) notFound();

  // Fetch their lists — only visible if RLS allows public read
  const [{ data: watchlistRaw }, { data: mangaRaw }] = await Promise.all([
    supabase
      .from("watchlist")
      .select("mal_id, title, image_url, status, user_rating, episodes_watched, total_episodes")
      .eq("user_id", profile.id)
      .order("added_at", { ascending: false }),
    supabase
      .from("manga_list")
      .select("mal_id, title, image_url, status, user_rating, chapters_read, total_chapters")
      .eq("user_id", profile.id)
      .order("added_at", { ascending: false }),
  ]);

  const watchlist = watchlistRaw ?? [];
  const manga = mangaRaw ?? [];

  // Stats
  const animeCompleted = watchlist.filter((i) => i.status === "completed").length;
  const animeWatching  = watchlist.filter((i) => i.status === "watching").length;
  const mangaCompleted = manga.filter((i) => i.status === "completed").length;
  const mangaReading   = manga.filter((i) => i.status === "reading").length;

  const memberSince = new Date(profile.created_at).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
  });

  const recentAnime = watchlist.slice(0, 10);
  const recentManga = manga.slice(0, 10);

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {/* Profile header */}
      <div className="flex items-center gap-5">
        <div className="shrink-0">
          {profile.avatar_url ? (
            <div className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-zinc-700">
              <Image src={profile.avatar_url} alt={profile.username ?? "avatar"} fill className="object-cover" unoptimized sizes="64px" />
            </div>
          ) : (
            <div className={`w-16 h-16 rounded-full flex items-center justify-center text-white text-2xl font-bold ${avatarColor(profile.id)}`}>
              {(profile.username ?? "?")[0].toUpperCase()}
            </div>
          )}
        </div>
        <div>
          <h1 className="text-xl font-bold text-white">{profile.username}</h1>
          <p className="text-zinc-500 text-sm mt-0.5">Member since {memberSince}</p>
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <MiniStat label="Anime" value={String(watchlist.length)} />
        <MiniStat label="Completed" value={String(animeCompleted)} />
        <MiniStat label="Manga" value={String(manga.length)} />
        <MiniStat label="Reading" value={String(mangaReading)} />
      </div>

      {/* Recent anime */}
      {recentAnime.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-white font-semibold text-sm uppercase tracking-wider">
            Anime List
            <span className="ml-2 text-zinc-600 font-normal normal-case text-xs">{watchlist.length} total</span>
          </h2>
          <div className="flex gap-3 overflow-x-auto pb-2" style={{ scrollbarWidth: "none" }}>
            {recentAnime.map((item) => (
              <Link key={item.mal_id} href={`/anime/${item.mal_id}`} className="flex-none w-24 group">
                <div className="relative aspect-[3/4] rounded-lg overflow-hidden bg-zinc-800 border border-zinc-800 group-hover:border-red-900 transition-colors">
                  {item.image_url && (
                    <Image src={item.image_url} alt={item.title} fill className="object-cover" unoptimized sizes="96px" />
                  )}
                  {item.user_rating != null && (
                    <div className="absolute top-1.5 left-1.5 bg-black/70 text-white text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5">
                      <svg width="8" height="8" viewBox="0 0 24 24" fill="#ef4444" stroke="none">
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                      </svg>
                      {item.user_rating}
                    </div>
                  )}
                </div>
                <p className="text-zinc-400 text-xs mt-1.5 line-clamp-2 group-hover:text-white transition-colors">{item.title}</p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Recent manga */}
      {recentManga.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-white font-semibold text-sm uppercase tracking-wider">
            Manga List
            <span className="ml-2 text-zinc-600 font-normal normal-case text-xs">{manga.length} total</span>
          </h2>
          <div className="flex gap-3 overflow-x-auto pb-2" style={{ scrollbarWidth: "none" }}>
            {recentManga.map((item) => (
              <Link key={item.mal_id} href={`/manga/${item.mal_id}`} className="flex-none w-24 group">
                <div className="relative aspect-[3/4] rounded-lg overflow-hidden bg-zinc-800 border border-zinc-800 group-hover:border-red-900 transition-colors">
                  {item.image_url && (
                    <Image src={item.image_url} alt={item.title} fill className="object-cover" unoptimized sizes="96px" />
                  )}
                  {item.user_rating != null && (
                    <div className="absolute top-1.5 left-1.5 bg-black/70 text-white text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5">
                      <svg width="8" height="8" viewBox="0 0 24 24" fill="#ef4444" stroke="none">
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                      </svg>
                      {item.user_rating}
                    </div>
                  )}
                </div>
                <p className="text-zinc-400 text-xs mt-1.5 line-clamp-2 group-hover:text-white transition-colors">{item.title}</p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {watchlist.length === 0 && manga.length === 0 && (
        <p className="text-zinc-600 text-sm text-center py-12">
          {profile.username}&apos;s list is empty or private.
        </p>
      )}
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-center">
      <p className="text-lg font-bold text-white">{value}</p>
      <p className="text-zinc-500 text-xs mt-0.5">{label}</p>
    </div>
  );
}
