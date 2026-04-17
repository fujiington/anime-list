"use client";

import { useRef } from "react";
import Link from "next/link";
import MangaCard from "./MangaCard";
import type { Manga } from "@/lib/jikan";

interface MangaRowProps {
  title: string;
  manga: Manga[];
  seeAllHref?: string;
}

export default function MangaRow({ title, manga, seeAllHref }: MangaRowProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const unique = manga.filter((m, i, arr) => arr.findIndex((x) => x.mal_id === m.mal_id) === i);

  function scroll(dir: "left" | "right") {
    scrollRef.current?.scrollBy({ left: dir === "right" ? 320 : -320, behavior: "smooth" });
  }

  if (unique.length === 0) return null;

  return (
    <section className="mb-10">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-white font-semibold text-base tracking-wide">{title}</h2>
        <div className="flex items-center gap-1">
          {seeAllHref && (
            <Link
              href={seeAllHref}
              className="text-zinc-500 hover:text-red-500 text-xs mr-2 transition-colors"
            >
              See All →
            </Link>
          )}
          <button
            onClick={() => scroll("left")}
            className="p-1.5 rounded text-zinc-600 hover:text-white hover:bg-zinc-800 transition-colors"
            aria-label="Scroll left"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <button
            onClick={() => scroll("right")}
            className="p-1.5 rounded text-zinc-600 hover:text-white hover:bg-zinc-800 transition-colors"
            aria-label="Scroll right"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        </div>
      </div>
      <div
        ref={scrollRef}
        className="flex gap-3 overflow-x-auto scrollbar-hide pb-2"
        style={{ scrollSnapType: "x mandatory" }}
      >
        {unique.map((m) => (
          <div key={m.mal_id} className="shrink-0 w-32 sm:w-36" style={{ scrollSnapAlign: "start" }}>
            <MangaCard manga={m} />
          </div>
        ))}
      </div>
    </section>
  );
}
