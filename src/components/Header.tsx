import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import UserMenu from "@/components/UserMenu";
import ModeToggle from "@/components/ModeToggle";
import { getSiteMode } from "@/lib/mode";

export default async function Header() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const mode = await getSiteMode();

  return (
    <header className="sticky top-0 z-50 bg-black/80 backdrop-blur-md border-b border-zinc-800">
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
        <ModeToggle initialMode={mode} />
        <nav className="hidden sm:flex items-center gap-5 text-zinc-400 text-sm">
          <Link href="/" className="hover:text-white transition-colors">Home</Link>
          <Link href="/browse" className="hover:text-white transition-colors">Browse</Link>
          <Link href="/genres" className="hover:text-white transition-colors">Genres</Link>
          {mode === "anime" ? (
            <Link href="/browse?status=airing" className="hover:text-white transition-colors">Airing</Link>
          ) : (
            <Link href="/browse?status=publishing" className="hover:text-white transition-colors">Publishing</Link>
          )}
        </nav>
        <UserMenu user={user} />
      </div>
    </header>
  );
}
