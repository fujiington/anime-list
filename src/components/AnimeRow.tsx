"use client";

import { useRef } from "react";
import Link from "next/link";
import AnimeCard from "./AnimeCard";
import type { Anime } from "@/lib/jikan";

interface AnimeRowProps {
  title: string;
  anime: Anime[];
  seeAllHref?: string;
}

export default function AnimeRow({ title, anime, seeAllHref }: AnimeRowProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  // Guard: deduplicate by mal_id in case caller passes duplicates
  const unique = anime.filter((a, i, arr) => arr.findIndex((x) => x.mal_id === a.mal_id) === i);

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
            aria-label="scroll left"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <button
            onClick={() => scroll("right")}
            className="p-1.5 rounded text-zinc-600 hover:text-white hover:bg-zinc-800 transition-colors"
            aria-label="scroll right"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="flex gap-3 overflow-x-auto pb-2"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {unique.map((a) => (
          <div key={a.mal_id} className="shrink-0 w-[140px]">
            <AnimeCard anime={a} />
          </div>
        ))}
      </div>
    </section>
  );
}
