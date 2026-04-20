import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import RatingsClient from "./RatingsClient";
import type { RatingItem } from "./RatingsClient";

export const revalidate = 0;
export const dynamic = "force-dynamic";

export default async function RatingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/ratings");

  const [{ data: animeRated }, { data: mangaRated }] = await Promise.all([
    supabase
      .from("watchlist")
      .select("mal_id, title, image_url, user_rating")
      .eq("user_id", user.id)
      .not("user_rating", "is", null)
      .order("user_rating", { ascending: false }),
    supabase
      .from("manga_list")
      .select("mal_id, title, image_url, user_rating")
      .eq("user_id", user.id)
      .not("user_rating", "is", null)
      .order("user_rating", { ascending: false }),
  ]);

  const items: RatingItem[] = [
    ...(animeRated ?? []).map((r) => ({ ...r, user_rating: r.user_rating as number, media: "anime" as const })),
    ...(mangaRated ?? []).map((r) => ({ ...r, user_rating: r.user_rating as number, media: "manga" as const })),
  ].sort((a, b) => b.user_rating - a.user_rating);

  const totalCount = items.length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">My Ratings</h1>
          <p className="text-zinc-500 text-sm mt-1">
            {totalCount === 0
              ? "Nothing rated yet"
              : `${totalCount} title${totalCount !== 1 ? "s" : ""} rated`}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/watchlist" className="text-zinc-500 hover:text-white text-sm transition-colors">
            My List →
          </Link>
          <Link href="/profile" className="text-zinc-500 hover:text-white text-sm transition-colors">
            Profile →
          </Link>
        </div>
      </div>

      <RatingsClient items={items} />
    </div>
  );
}
