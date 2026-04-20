import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import MangaListClient from "./MangaListClient";
import type { MangaListItem } from "./MangaListClient";

export const revalidate = 0;

export default async function MangaListPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/manga-list");

  const { data: items } = await supabase
    .from("manga_list")
    .select(
      "mal_id, title, image_url, score, status, user_rating, chapters_read, total_chapters"
    )
    .eq("user_id", user.id)
    .order("mal_id", { ascending: false });

  const mangaListItems = (items ?? []).map((item) => ({
    ...item,
    chapters_read: item.chapters_read ?? 0,
  })) as MangaListItem[];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Reading List</h1>
          <p className="text-zinc-500 text-sm mt-1">
            {mangaListItems.length === 0
              ? "No manga tracked yet"
              : `${mangaListItems.length} manga tracked`}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/watchlist"
            className="text-zinc-500 hover:text-white text-sm transition-colors"
          >
            Anime List →
          </Link>
          <Link
            href="/profile"
            className="text-zinc-500 hover:text-white text-sm transition-colors"
          >
            Profile →
          </Link>
        </div>
      </div>

      <MangaListClient items={mangaListItems} />
    </div>
  );
}
