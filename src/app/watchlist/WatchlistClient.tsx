"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import WatchlistButton, { STATUS_CONFIG } from "@/components/WatchlistButton";
import type { WatchlistStatus, WatchlistEntry } from "@/components/WatchlistButton";

export interface WatchlistItem {
  mal_id: number;
  title: string;
  image_url: string | null;
  score: number | null;
  status: WatchlistStatus;
  user_rating: number | null;
  episodes_watched: number;
  total_episodes: number | null;
}

const TABS: { key: WatchlistStatus | "all"; label: string }[] = [
  { key: "all",           label: "All"           },
  { key: "watching",      label: "Watching"      },
  { key: "completed",     label: "Completed"     },
  { key: "plan_to_watch", label: "Plan to Watch" },
  { key: "on_hold",       label: "On Hold"       },
  { key: "dropped",       label: "Dropped"       },
];

export default function WatchlistClient({ items }: { items: WatchlistItem[] }) {
  const [activeTab, setActiveTab] = useState<WatchlistStatus | "all">("all");

  const counts = Object.fromEntries(
    TABS.map((t) => [
      t.key,
      t.key === "all" ? items.length : items.filter((i) => i.status === t.key).length,
    ])
  ) as Record<WatchlistStatus | "all", number>;

  const filtered =
    activeTab === "all" ? items : items.filter((i) => i.status === activeTab);

  if (items.length === 0) {
    return (
      <div className="text-center py-24 space-y-4">
        <div className="w-16 h-16 bg-zinc-900 rounded-full flex items-center justify-center mx-auto">
          <svg className="text-zinc-700" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
          </svg>
        </div>
        <div>
          <p className="text-zinc-400 text-sm font-medium">Your list is empty</p>
          <p className="text-zinc-600 text-xs mt-1">Add anime to start tracking</p>
        </div>
        <Link
          href="/browse"
          className="inline-block bg-red-900 hover:bg-red-800 text-white text-sm px-5 py-2.5 rounded-xl transition-colors font-medium"
        >
          Browse Anime
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex gap-1.5 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-shrink-0 inline-flex items-center gap-1.5 text-xs font-medium px-3.5 py-2 rounded-full transition-all ${
              activeTab === tab.key
                ? "bg-red-900 text-white"
                : "bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700"
            }`}
          >
            {tab.label}
            {counts[tab.key] > 0 && (
              <span
                className={`text-[10px] font-semibold min-w-[16px] text-center ${
                  activeTab === tab.key ? "opacity-70" : "text-zinc-600"
                }`}
              >
                {counts[tab.key]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <p className="text-zinc-600 text-sm py-12 text-center">
          Nothing here yet.
        </p>
      ) : (
        <div className="space-y-1">
          {filtered.map((item) => (
            <WatchlistRow key={item.mal_id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}

function WatchlistRow({ item }: { item: WatchlistItem }) {
  const cfg = STATUS_CONFIG[item.status];
  const initialEntry: WatchlistEntry = {
    status: item.status,
    user_rating: item.user_rating,
    episodes_watched: item.episodes_watched,
    total_episodes: item.total_episodes,
  };
  const hasProgress =
    item.total_episodes != null ? item.total_episodes > 0 : item.episodes_watched > 0;
  const progressPct =
    item.total_episodes && item.total_episodes > 0
      ? Math.min(100, (item.episodes_watched / item.total_episodes) * 100)
      : null;

  return (
    <div className="flex items-center gap-3 bg-zinc-900/40 hover:bg-zinc-900 border border-zinc-800/50 hover:border-zinc-800 rounded-xl p-2.5 transition-all group">
      {/* Poster */}
      <Link href={`/anime/${item.mal_id}`} className="shrink-0">
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
      <div className="flex-1 min-w-0 space-y-1">
        <Link href={`/anime/${item.mal_id}`}>
          <p className="text-white text-sm font-medium line-clamp-1 group-hover:text-red-300 transition-colors">
            {item.title}
          </p>
        </Link>
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`text-[11px] font-semibold ${cfg.color}`}>
            {cfg.label}
          </span>
          {item.user_rating != null && (
            <span className="inline-flex items-center gap-0.5 text-[11px] text-zinc-400">
              <svg width="9" height="9" viewBox="0 0 24 24" fill="#ef4444" stroke="none">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
              {item.user_rating}/10
            </span>
          )}
          {hasProgress && (
            <span className="text-[11px] text-zinc-600">
              {item.episodes_watched}/{item.total_episodes ?? "?"} eps
            </span>
          )}
        </div>
        {progressPct !== null && (
          <div className="h-1 bg-zinc-800 rounded-full overflow-hidden w-full max-w-[160px]">
            <div
              className="h-full bg-red-800/70 rounded-full"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        )}
      </div>

      {/* Edit button */}
      <div className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
        <WatchlistButton
          malId={item.mal_id}
          title={item.title}
          imageUrl={item.image_url}
          score={item.score}
          totalEpisodes={item.total_episodes}
          initialEntry={initialEntry}
          isLoggedIn={true}
          compact={true}
        />
      </div>
    </div>
  );
}
