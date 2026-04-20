"use client";

import MediaListClient, { type MediaItem } from "@/components/MediaListClient";
import MangaListButton, { MANGA_STATUS_CONFIG } from "@/components/MangaListButton";
import type { MangaListStatus, MangaListEntry } from "@/components/MangaListButton";

export interface MangaListItem {
  mal_id: number;
  title: string;
  image_url: string | null;
  score: number | null;
  status: MangaListStatus;
  user_rating: number | null;
  chapters_read: number;
  total_chapters: number | null;
}

const TABS = [
  { key: "all",          label: "All"          },
  { key: "reading",      label: "Reading"      },
  { key: "completed",    label: "Completed"    },
  { key: "plan_to_read", label: "Plan to Read" },
  { key: "on_hold",      label: "On Hold"      },
  { key: "dropped",      label: "Dropped"      },
];

export default function MangaListClient({ items }: { items: MangaListItem[] }) {
  const mediaItems: MediaItem[] = items.map((item) => ({
    mal_id: item.mal_id,
    title: item.title,
    image_url: item.image_url,
    score: item.score,
    status: item.status,
    user_rating: item.user_rating,
    progress: item.chapters_read,
    totalProgress: item.total_chapters,
  }));

  return (
    <MediaListClient
      items={mediaItems}
      tabs={TABS}
      getStatusCfg={(s) => MANGA_STATUS_CONFIG[s as MangaListStatus]}
      basePath="/manga"
      progressLabel="Ch"
      emptyText="Your reading list is empty"
      emptySubtext="Add manga to start tracking"
      browsePath="/browse"
      browseCta="Browse Manga"
      renderEditButton={(item) => {
        const initialEntry: MangaListEntry = {
          status: item.status as MangaListStatus,
          user_rating: item.user_rating,
          chapters_read: item.progress,
          total_chapters: item.totalProgress,
        };
        return (
          <MangaListButton
            malId={item.mal_id}
            title={item.title}
            imageUrl={item.image_url}
            score={item.score}
            totalChapters={item.totalProgress}
            initialEntry={initialEntry}
            isLoggedIn={true}
            compact={true}
          />
        );
      }}
    />
  );
}
