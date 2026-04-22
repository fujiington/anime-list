"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import type { ReactNode } from "react";

export interface MediaItem {
  mal_id: number;
  title: string;
  image_url: string | null;
  score: number | null;
  status: string;
  user_rating: number | null;
  progress: number;
  totalProgress: number | null;
}

interface Props {
  items: MediaItem[];
  tabs: { key: string; label: string }[];
  getStatusCfg: (status: string) => { label: string; color: string };
  basePath: string;
  progressLabel: string;
  emptyText: string;
  emptySubtext: string;
  browsePath: string;
  browseCta: string;
  renderEditButton: (item: MediaItem) => ReactNode;
}

export default function MediaListClient({
  items,
  tabs,
  getStatusCfg,
  basePath,
  progressLabel,
  emptyText,
  emptySubtext,
  browsePath,
  browseCta,
  renderEditButton,
}: Props) {
  const [activeTab, setActiveTab] = useState("all");
  const [sortBy, setSortBy] = useState<"default" | "title" | "rating" | "progress">("default");

  const counts: Record<string, number> = Object.fromEntries(
    tabs.map((t) => [
      t.key,
      t.key === "all" ? items.length : items.filter((i) => i.status === t.key).length,
    ])
  );

  const tabFiltered =
    activeTab === "all" ? items : items.filter((i) => i.status === activeTab);

  const filtered = useMemo(() => {
    const arr = [...tabFiltered];
    if (sortBy === "title") arr.sort((a, b) => a.title.localeCompare(b.title));
    else if (sortBy === "rating") arr.sort((a, b) => (b.user_rating ?? 0) - (a.user_rating ?? 0));
    else if (sortBy === "progress") arr.sort((a, b) => b.progress - a.progress);
    return arr;
  }, [tabFiltered, sortBy]);

  if (items.length === 0) {
    return (
      <div className="text-center py-24 space-y-4">
        <div className="w-16 h-16 bg-zinc-900 rounded-full flex items-center justify-center mx-auto">
          <svg
            className="text-zinc-700"
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
          </svg>
        </div>
        <div>
          <p className="text-zinc-400 text-sm font-medium">{emptyText}</p>
          <p className="text-zinc-600 text-xs mt-1">{emptySubtext}</p>
        </div>
        <Link
          href={browsePath}
          className="inline-block bg-red-900 hover:bg-red-800 text-white text-sm px-5 py-2.5 rounded-xl transition-colors font-medium"
        >
          {browseCta}
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Sort + Tabs row */}
      <div className="flex items-center gap-2">
        <div
          className="flex gap-1.5 overflow-x-auto pb-1 flex-1"
          style={{ scrollbarWidth: "none" }}
        >
          {tabs.map((tab) => (
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
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
          className="flex-shrink-0 bg-zinc-900 border border-zinc-800 text-zinc-400 text-xs rounded-full px-3 py-2 focus:outline-none focus:border-zinc-600 cursor-pointer"
        >
          <option value="default">Default</option>
          <option value="title">A–Z</option>
          <option value="rating">Rating</option>
          <option value="progress">Progress</option>
        </select>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <p className="text-zinc-600 text-sm py-12 text-center">Nothing here yet.</p>
      ) : (
        <div className="space-y-1">
          {filtered.map((item) => {
            const cfg = getStatusCfg(item.status);
            const showProgress = item.progress > 0 || item.totalProgress != null;
            const progressPct =
              item.totalProgress && item.totalProgress > 0
                ? Math.min(100, (item.progress / item.totalProgress) * 100)
                : null;

            return (
              <div
                key={item.mal_id}
                className="bg-zinc-900/40 hover:bg-zinc-900 border border-zinc-800/50 hover:border-zinc-800 rounded-xl overflow-hidden transition-all group"
              >
                <div className="flex items-center gap-3 px-2.5 pt-2.5 pb-2.5">
                  {/* Cover */}
                  <Link href={`${basePath}/${item.mal_id}`} className="shrink-0">
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
                          <svg
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.5"
                          >
                            <rect x="3" y="3" width="18" height="18" rx="2" />
                          </svg>
                        </div>
                      )}
                    </div>
                  </Link>

                  {/* Info */}
                  <div className="flex-1 min-w-0 space-y-1">
                    <Link href={`${basePath}/${item.mal_id}`}>
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
                          <svg
                            width="9"
                            height="9"
                            viewBox="0 0 24 24"
                            fill="#ef4444"
                            stroke="none"
                          >
                            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                          </svg>
                          {item.user_rating}/10
                        </span>
                      )}
                    </div>
                    {showProgress && (
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-medium text-zinc-300">
                          {progressLabel} {item.progress}
                        </span>
                        <span className="text-xs text-zinc-600">
                          / {item.totalProgress ?? "?"}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Edit button */}
                  <div className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    {renderEditButton(item)}
                  </div>
                </div>

                {/* Progress bar */}
                {progressPct !== null && (
                  <div className="h-1 bg-zinc-800">
                    <div
                      className="h-full bg-red-700/80 transition-all"
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
