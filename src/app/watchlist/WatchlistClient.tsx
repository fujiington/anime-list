"use client";

import MediaListClient, { type MediaItem } from "@/components/MediaListClient";
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

const TABS = [
  { key: "all",           label: "All"           },
  { key: "watching",      label: "Watching"      },
  { key: "completed",     label: "Completed"     },
  { key: "plan_to_watch", label: "Plan to Watch" },
  { key: "on_hold",       label: "On Hold"       },
  { key: "dropped",       label: "Dropped"       },
];

export default function WatchlistClient({ items }: { items: WatchlistItem[] }) {
  const mediaItems: MediaItem[] = items.map((item) => ({
    mal_id: item.mal_id,
    title: item.title,
    image_url: item.image_url,
    score: item.score,
    status: item.status,
    user_rating: item.user_rating,
    progress: item.episodes_watched,
    totalProgress: item.total_episodes,
  }));

  return (
    <MediaListClient
      items={mediaItems}
      tabs={TABS}
      getStatusCfg={(s) => STATUS_CONFIG[s as WatchlistStatus]}
      basePath="/anime"
      progressLabel="Ep"
      emptyText="Your list is empty"
      emptySubtext="Add anime to start tracking"
      browsePath="/browse"
      browseCta="Browse Anime"
      renderEditButton={(item) => {
        const initialEntry: WatchlistEntry = {
          status: item.status as WatchlistStatus,
          user_rating: item.user_rating,
          episodes_watched: item.progress,
          total_episodes: item.totalProgress,
        };
        return (
          <WatchlistButton
            malId={item.mal_id}
            title={item.title}
            imageUrl={item.image_url}
            score={item.score}
            totalEpisodes={item.totalProgress}
            initialEntry={initialEntry}
            isLoggedIn={true}
            compact={true}
          />
        );
      }}
    />
  );
}
