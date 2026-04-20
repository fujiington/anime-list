"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";

export interface RatingItem {
  mal_id: number;
  title: string;
  image_url: string | null;
  user_rating: number;
  media: "anime" | "manga";
}

type Filter = "all" | "anime" | "manga";

const FILTER_LABELS: { key: Filter; label: string }[] = [
  { key: "all",   label: "All"   },
  { key: "anime", label: "Anime" },
  { key: "manga", label: "Manga" },
];

// Filled stars for a given 1-10 rating, displayed out of 5
function StarDisplay({ rating }: { rating: number }) {
  const filled = Math.round(rating / 2); // 1-10 → 1-5
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <svg key={i} width="14" height="14" viewBox="0 0 24 24"
          fill={i < filled ? "#ef4444" : "none"}
          stroke={i < filled ? "#ef4444" : "#52525b"}
          strokeWidth="1.5"
        >
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      ))}
      <span className="ml-1.5 text-sm font-bold text-white">{rating}</span>
      <span className="text-xs text-zinc-600">/10</span>
    </div>
  );
}

export default function RatingsClient({ items }: { items: RatingItem[] }) {
  const [filter, setFilter] = useState<Filter>("all");
  const [sortAsc, setSortAsc] = useState(false);

  const filtered = items
    .filter((i) => filter === "all" || i.media === filter)
    .sort((a, b) => sortAsc ? a.user_rating - b.user_rating : b.user_rating - a.user_rating);

  if (items.length === 0) {
    return (
      <div className="text-center py-24 space-y-4">
        <div className="w-16 h-16 bg-zinc-900 rounded-full flex items-center justify-center mx-auto">
          <svg className="text-zinc-700" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
        </div>
        <div>
          <p className="text-zinc-400 text-sm font-medium">No ratings yet</p>
          <p className="text-zinc-600 text-xs mt-1">Rate anime or manga to see them here</p>
        </div>
        <Link
          href="/browse"
          className="inline-block bg-red-900 hover:bg-red-800 text-white text-sm px-5 py-2.5 rounded-xl transition-colors font-medium"
        >
          Browse
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filter + sort row */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex gap-1.5 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
          {FILTER_LABELS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`flex-shrink-0 inline-flex items-center gap-1.5 text-xs font-medium px-3.5 py-2 rounded-full transition-all ${
                filter === f.key
                  ? "bg-red-900 text-white"
                  : "bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700"
              }`}
            >
              {f.label}
              <span className={`text-[10px] font-semibold ${filter === f.key ? "opacity-70" : "text-zinc-600"}`}>
                {f.key === "all" ? items.length : items.filter((i) => i.media === f.key).length}
              </span>
            </button>
          ))}
        </div>
        <button
          onClick={() => setSortAsc((v) => !v)}
          className="flex-shrink-0 inline-flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700 transition-all"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            {sortAsc ? (
              <path d="M12 20V4M5 11l7-7 7 7" />
            ) : (
              <path d="M12 4v16M5 13l7 7 7-7" />
            )}
          </svg>
          {sortAsc ? "Low → High" : "High → Low"}
        </button>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <p className="text-zinc-600 text-sm py-12 text-center">Nothing here yet.</p>
      ) : (
        <div className="space-y-1">
          {filtered.map((item) => (
            <RatingRow key={`${item.media}-${item.mal_id}`} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}

function RatingRow({ item }: { item: RatingItem }) {
  const href = item.media === "anime" ? `/anime/${item.mal_id}` : `/manga/${item.mal_id}`;
  const scoreBarPct = (item.user_rating / 10) * 100;

  return (
    <div className="bg-zinc-900/40 hover:bg-zinc-900 border border-zinc-800/50 hover:border-zinc-800 rounded-xl overflow-hidden transition-all group">
      <div className="flex items-center gap-3 px-2.5 pt-2.5 pb-2.5">
        {/* Poster */}
        <Link href={href} className="shrink-0">
          <div className="relative w-10 h-[58px] rounded-lg overflow-hidden bg-zinc-800">
            {item.image_url ? (
              <Image
                src={item.image_url}
                alt={item.title}
                fill
                className="object-cover"
                unoptimized
                sizes="40px"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-zinc-700">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                </svg>
              </div>
            )}
          </div>
        </Link>

        {/* Info */}
        <div className="flex-1 min-w-0 space-y-1.5">
          <Link href={href}>
            <p className="text-white text-sm font-medium line-clamp-1 group-hover:text-red-300 transition-colors">
              {item.title}
            </p>
          </Link>
          <StarDisplay rating={item.user_rating} />
        </div>

        {/* Media badge */}
        <span className={`shrink-0 text-[10px] font-semibold px-2 py-1 rounded-full border ${
          item.media === "anime"
            ? "bg-blue-950/60 border-blue-800 text-blue-300"
            : "bg-purple-950/60 border-purple-800 text-purple-300"
        }`}>
          {item.media === "anime" ? "Anime" : "Manga"}
        </span>
      </div>

      {/* Score fill bar */}
      <div className="h-1 bg-zinc-800">
        <div
          className="h-full bg-red-700/80 transition-all"
          style={{ width: `${scoreBarPct}%` }}
        />
      </div>
    </div>
  );
}
