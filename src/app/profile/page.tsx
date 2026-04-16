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

  const [{ data: profile }, { data: watchlistItems }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
    supabase.from("watchlist").select("status").eq("user_id", user.id),
  ]);

  const items = watchlistItems ?? [];
  const stats = {
    watching:      items.filter((i) => i.status === "watching").length,
    completed:     items.filter((i) => i.status === "completed").length,
    plan_to_watch: items.filter((i) => i.status === "plan_to_watch").length,
    on_hold:       items.filter((i) => i.status === "on_hold").length,
    dropped:       items.filter((i) => i.status === "dropped").length,
  };

  return (
    <ProfileClient user={user} initialProfile={profile} stats={stats} />
  );
}
