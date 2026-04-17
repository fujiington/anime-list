"use client";

import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { SiteMode } from "@/lib/mode";

export default function ModeToggle({ initialMode }: { initialMode: SiteMode }) {
  const [mode, setMode] = useState<SiteMode>(initialMode);
  const router = useRouter();
  const isManga = mode === "manga";

  function toggle() {
    const next: SiteMode = isManga ? "anime" : "manga";
    document.cookie = `siteMode=${next}; path=/; max-age=31536000; SameSite=Lax`;
    setMode(next);
    router.refresh();
  }

  return (
    <div className="flex items-center gap-3 shrink-0">
      <div className="flex items-center gap-2.5">
        <Image
          src="/web-app-manifest-192x192.png"
          alt={isManga ? "MangaList" : "AnimeList"}
          width={36}
          height={36}
          className="rounded-lg"
        />
        <span className="text-white font-semibold text-sm tracking-wide">
          {isManga ? (
            <>Manga<span className="text-red-800">List</span></>
          ) : (
            <>Anime<span className="text-red-800">List</span></>
          )}
        </span>
      </div>

      <button
        onClick={toggle}
        title={isManga ? "Switch to Anime" : "Switch to Manga"}
        className="flex items-center bg-zinc-800 hover:bg-zinc-700 rounded-full p-0.5 gap-0.5 transition-colors"
        aria-label={isManga ? "Switch to Anime" : "Switch to Manga"}
      >
        <span
          className={`text-xs px-3 py-1 rounded-full transition-all duration-200 font-semibold ${
            !isManga ? "bg-red-900 text-white" : "text-zinc-500 hover:text-zinc-300"
          }`}
        >
          Anime
        </span>
        <span
          className={`text-xs px-3 py-1 rounded-full transition-all duration-200 font-semibold ${
            isManga ? "bg-red-900 text-white" : "text-zinc-500 hover:text-zinc-300"
          }`}
        >
          Manga
        </span>
      </button>
    </div>
  );
}
