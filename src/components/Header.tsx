import Link from "next/link";
import Image from "next/image";

export default function Header() {
  return (
    <header className="sticky top-0 z-50 bg-black/80 backdrop-blur-md border-b border-zinc-800">
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2.5 shrink-0">
          <Image
            src="/web-app-manifest-192x192.png"
            alt="AnimeList"
            width={36}
            height={36}
            className="rounded-lg"
          />
          <span className="text-white font-semibold text-sm tracking-wide">
            Anime<span className="text-red-800">List</span>
          </span>
        </Link>
        <nav className="hidden sm:flex items-center gap-5 text-zinc-400 text-sm">
          <Link href="/" className="hover:text-white transition-colors">Home</Link>
          <Link href="/browse" className="hover:text-white transition-colors">Browse</Link>
          <Link href="/genres" className="hover:text-white transition-colors">Genres</Link>
          <Link href="/browse?status=airing" className="hover:text-white transition-colors">Airing</Link>
        </nav>
      </div>
    </header>
  );
}
