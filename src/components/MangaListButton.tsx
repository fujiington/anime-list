"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export type MangaListStatus =
  | "reading"
  | "completed"
  | "plan_to_read"
  | "on_hold"
  | "dropped";

export interface MangaListEntry {
  status: MangaListStatus;
  user_rating: number | null;
  chapters_read: number;
  total_chapters: number | null;
}

export const MANGA_STATUS_CONFIG: Record<
  MangaListStatus,
  { label: string; color: string; bg: string; dot: string }
> = {
  reading:      { label: "Reading",       color: "text-green-400",  bg: "bg-green-950/60 border-green-800",   dot: "bg-green-400"  },
  completed:    { label: "Completed",     color: "text-blue-400",   bg: "bg-blue-950/60 border-blue-800",     dot: "bg-blue-400"   },
  plan_to_read: { label: "Plan to Read",  color: "text-zinc-300",   bg: "bg-zinc-800 border-zinc-700",        dot: "bg-zinc-400"   },
  on_hold:      { label: "On Hold",       color: "text-yellow-400", bg: "bg-yellow-950/60 border-yellow-800", dot: "bg-yellow-400" },
  dropped:      { label: "Dropped",       color: "text-red-400",    bg: "bg-red-950/60 border-red-800",       dot: "bg-red-400"    },
};

interface Props {
  malId: number;
  title: string;
  imageUrl: string | null;
  score: number | null;
  totalChapters: number | null | undefined;
  initialEntry: MangaListEntry | null;
  isLoggedIn: boolean;
  compact?: boolean;
}

export default function MangaListButton({
  malId,
  title,
  imageUrl,
  score,
  totalChapters,
  initialEntry,
  isLoggedIn,
  compact = false,
}: Props) {
  const [entry, setEntry] = useState<MangaListEntry | null>(initialEntry);
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<MangaListStatus>(
    initialEntry?.status ?? "plan_to_read"
  );
  const [rating, setRating] = useState<number | null>(
    initialEntry?.user_rating ?? null
  );
  const [chaptersRead, setChaptersRead] = useState(
    initialEntry?.chapters_read ?? 0
  );
  const [saving, setSaving] = useState(false);
  const router = useRouter();
  const supabase = createClient();
  const overlayRef = useRef<HTMLDivElement>(null);

  const totalCh = totalChapters ?? null;

  function openModal() {
    setStatus(entry?.status ?? "plan_to_read");
    setRating(entry?.user_rating ?? null);
    setChaptersRead(entry?.chapters_read ?? 0);
    setOpen(true);
  }

  async function save() {
    setSaving(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      router.push(`/login?next=/manga/${malId}`);
      return;
    }

    if (entry) {
      await supabase
        .from("manga_list")
        .update({ status, user_rating: rating, chapters_read: chaptersRead, total_chapters: totalCh })
        .eq("user_id", user.id)
        .eq("mal_id", malId);
    } else {
      await supabase.from("manga_list").insert({
        user_id: user.id,
        mal_id: malId,
        title,
        image_url: imageUrl,
        score,
        status,
        user_rating: rating,
        chapters_read: chaptersRead,
        total_chapters: totalCh,
      });
    }

    setEntry({ status, user_rating: rating, chapters_read: chaptersRead, total_chapters: totalCh });
    setSaving(false);
    setOpen(false);
    router.refresh();
  }

  async function remove() {
    setSaving(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    await supabase
      .from("manga_list")
      .delete()
      .eq("user_id", user.id)
      .eq("mal_id", malId);
    setEntry(null);
    setSaving(false);
    setOpen(false);
    router.refresh();
  }

  /* ── Not logged in ── */
  if (!isLoggedIn) {
    if (compact) return null;
    return (
      <a
        href={`/login?next=/manga/${malId}`}
        className="inline-flex items-center gap-2 bg-red-900 hover:bg-red-800 text-white text-sm px-4 py-2.5 rounded-xl font-medium transition-colors"
      >
        <BookmarkIcon filled={false} />
        Add to Reading List
      </a>
    );
  }

  /* ── Trigger ── */
  const trigger = compact ? (
    <button
      onClick={openModal}
      className="p-1.5 text-zinc-600 hover:text-white rounded-lg transition-colors"
      title="Edit reading entry"
    >
      <PencilIcon />
    </button>
  ) : entry ? (
    <button
      onClick={openModal}
      className={`inline-flex items-center gap-2 text-sm px-4 py-2.5 rounded-xl border font-medium transition-all hover:brightness-110 ${MANGA_STATUS_CONFIG[entry.status].bg} ${MANGA_STATUS_CONFIG[entry.status].color}`}
    >
      <span className={`w-2 h-2 rounded-full ${MANGA_STATUS_CONFIG[entry.status].dot}`} />
      {MANGA_STATUS_CONFIG[entry.status].label}
      {entry.user_rating != null && (
        <span className="ml-1 text-xs opacity-70 flex items-center gap-0.5">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" stroke="none">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
          {entry.user_rating}
        </span>
      )}
    </button>
  ) : (
    <button
      onClick={openModal}
      className="inline-flex items-center gap-2 bg-red-900 hover:bg-red-800 text-white text-sm px-4 py-2.5 rounded-xl font-medium transition-colors"
    >
      <BookmarkIcon filled={false} />
      Add to Reading List
    </button>
  );

  return (
    <>
      {trigger}

      {open && (
        <div
          ref={overlayRef}
          className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === overlayRef.current) setOpen(false);
          }}
        >
          <div className="bg-zinc-950 border border-zinc-800 rounded-t-2xl sm:rounded-2xl w-full sm:max-w-sm shadow-2xl">
            {/* Handle bar (mobile) */}
            <div className="flex justify-center pt-3 pb-1 sm:hidden">
              <div className="w-10 h-1 bg-zinc-700 rounded-full" />
            </div>

            {/* Header */}
            <div className="px-5 py-4 border-b border-zinc-800">
              <h3 className="font-semibold text-white text-sm line-clamp-1">{title}</h3>
              <p className="text-zinc-500 text-xs mt-0.5">
                {entry ? "Edit reading entry" : "Add to your reading list"}
              </p>
            </div>

            <div className="px-5 py-4 space-y-5">
              {/* Status grid */}
              <div className="space-y-2">
                <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Status</p>
                <div className="grid grid-cols-2 gap-1.5">
                  {(
                    Object.entries(MANGA_STATUS_CONFIG) as [
                      MangaListStatus,
                      (typeof MANGA_STATUS_CONFIG)[MangaListStatus]
                    ][]
                  ).map(([val, cfg]) => (
                    <button
                      key={val}
                      onClick={() => setStatus(val)}
                      className={`py-2.5 px-3 rounded-xl text-xs font-medium border transition-all text-left flex items-center gap-2 ${
                        status === val
                          ? `${cfg.bg} ${cfg.color}`
                          : "bg-zinc-900 border-zinc-800 text-zinc-500 hover:border-zinc-700 hover:text-zinc-300"
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${status === val ? cfg.dot : "bg-zinc-700"}`} />
                      {cfg.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Rating */}
              <div className="space-y-2">
                <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
                  Your Rating{rating != null ? ` — ${rating}/10` : ""}
                </p>
                <div className="flex gap-1">
                  {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                    <button
                      key={n}
                      onClick={() => setRating(rating === n ? null : n)}
                      className={`flex-1 h-9 rounded-lg text-xs font-semibold transition-all ${
                        rating != null && n <= rating
                          ? "bg-red-900 text-white"
                          : "bg-zinc-900 border border-zinc-800 text-zinc-500 hover:border-zinc-700 hover:text-zinc-300"
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>

              {/* Chapter progress */}
              {(totalCh !== null || status === "reading") && (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Progress</p>
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      min={0}
                      max={totalCh ?? undefined}
                      value={chaptersRead}
                      onChange={(e) =>
                        setChaptersRead(Math.max(0, parseInt(e.target.value) || 0))
                      }
                      className="w-20 bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-white text-sm text-center focus:outline-none focus:border-red-800 transition-colors"
                    />
                    <span className="text-zinc-500 text-sm">
                      / {totalCh ?? "?"} ch
                    </span>
                    {totalCh && (
                      <button
                        onClick={() => setChaptersRead(totalCh)}
                        className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors ml-auto"
                      >
                        All
                      </button>
                    )}
                  </div>
                  {totalCh && chaptersRead > 0 && (
                    <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-red-800 rounded-full transition-all"
                        style={{ width: `${Math.min(100, (chaptersRead / totalCh) * 100)}%` }}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-5 py-4 border-t border-zinc-800 flex items-center gap-2">
              {entry && (
                <button
                  onClick={remove}
                  disabled={saving}
                  className="text-zinc-500 hover:text-red-400 text-xs px-3 py-2 rounded-lg transition-colors disabled:opacity-50 border border-zinc-800 hover:border-red-900/50"
                >
                  Remove
                </button>
              )}
              <div className="flex-1" />
              <button
                onClick={() => setOpen(false)}
                className="text-zinc-500 hover:text-white text-xs px-3 py-2 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={save}
                disabled={saving}
                className="bg-red-900 hover:bg-red-800 text-white text-xs font-semibold px-5 py-2 rounded-lg transition-colors disabled:opacity-50"
              >
                {saving ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function BookmarkIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function PencilIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}
