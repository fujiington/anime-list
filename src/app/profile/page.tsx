import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import ProfileClient from "./ProfileClient";

export const revalidate = 0;

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/profile");

  const [{ data: profile }, { data: watchlistItems }, { data: mangaRated }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
    supabase.from("watchlist").select("status, user_rating").eq("user_id", user.id),
    supabase
      .from("manga_list")
      .select("user_rating")
      .eq("user_id", user.id)
      .not("user_rating", "is", null),
  ]);

  const items = watchlistItems ?? [];
  const stats = {
    watching:      items.filter((i) => i.status === "watching").length,
    completed:     items.filter((i) => i.status === "completed").length,
    plan_to_watch: items.filter((i) => i.status === "plan_to_watch").length,
    on_hold:       items.filter((i) => i.status === "on_hold").length,
    dropped:       items.filter((i) => i.status === "dropped").length,
  };

  const animeRatings = items.filter((i) => i.user_rating != null).map((i) => i.user_rating as number);
  const mangaRatings = (mangaRated ?? []).map((i) => i.user_rating as number);
  const allRatings = [...animeRatings, ...mangaRatings];
  const ratingCount = allRatings.length;
  const avgRating = ratingCount > 0
    ? Math.round((allRatings.reduce((a, b) => a + b, 0) / ratingCount) * 10) / 10
    : null;

  return (
    <ProfileClient user={user} initialProfile={profile} stats={stats} ratingCount={ratingCount} avgRating={avgRating} />
  );
}
