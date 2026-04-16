import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import WatchlistClient from "./WatchlistClient";
import type { WatchlistItem } from "./WatchlistClient";

export const revalidate = 0;

export default async function WatchlistPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/watchlist");

  const { data: items } = await supabase
    .from("watchlist")
    .select(
      "mal_id, title, image_url, score, status, user_rating, episodes_watched, total_episodes"
    )
    .eq("user_id", user.id)
    .order("added_at", { ascending: false });

  const watchlistItems = (items ?? []) as WatchlistItem[];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">My List</h1>
          <p className="text-zinc-500 text-sm mt-1">
            {watchlistItems.length === 0
              ? "No anime tracked yet"
              : `${watchlistItems.length} anime tracked`}
          </p>
        </div>
        <Link
          href="/profile"
          className="text-zinc-500 hover:text-white text-sm transition-colors"
        >
          Profile →
        </Link>
      </div>

      <WatchlistClient items={watchlistItems} />
    </div>
  );
}
