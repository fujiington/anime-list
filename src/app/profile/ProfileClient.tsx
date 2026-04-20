"use client";

import { useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import Image from "next/image";
import Link from "next/link";
import type { User } from "@supabase/supabase-js";
import { getAnimeCharacters } from "@/lib/jikan";
import type { AnimeCharacter } from "@/lib/jikan";

const AVATAR_COLORS = [
  "bg-red-800",
  "bg-blue-800",
  "bg-green-800",
  "bg-purple-800",
  "bg-orange-800",
  "bg-pink-800",
  "bg-teal-800",
  "bg-indigo-800",
];

function avatarColor(id: string) {
  const hash = id.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

interface Profile {
  id: string;
  username: string | null;
  avatar_url: string | null;
  created_at: string;
}

interface Stats {
  watching: number;
  completed: number;
  plan_to_watch: number;
  on_hold: number;
  dropped: number;
}

interface Props {
  user: User;
  initialProfile: Profile | null;
  stats: Stats;
  ratingCount: number;
  avgRating: number | null;
}

export default function ProfileClient({ user, initialProfile, stats, ratingCount, avgRating }: Props) {
  const [profile, setProfile] = useState(initialProfile);
  const [username, setUsername] = useState(initialProfile?.username ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(initialProfile?.avatar_url ?? null);
  const [pendingAvatarUrl, setPendingAvatarUrl] = useState<string | null | undefined>(undefined); // undefined = no change

  // Avatar picker state
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerStep, setPickerStep] = useState<"anime" | "characters">("anime");
  const [pickerAnime, setPickerAnime] = useState<{ mal_id: number; title: string; image_url: string | null }[]>([]);
  const [pickerLoading, setPickerLoading] = useState(false);
  const [pickerChars, setPickerChars] = useState<AnimeCharacter[]>([]);
  const [pickerAnimeTitle, setPickerAnimeTitle] = useState("");
  const overlayRef = useRef<HTMLDivElement>(null);

  const supabase = createClient();

  async function openAvatarPicker() {
    setPickerStep("anime");
    setPickerChars([]);
    setPickerOpen(true);
    setPickerLoading(true);
    const {
      data: { user: u },
    } = await supabase.auth.getUser();
    if (!u) { setPickerLoading(false); return; }
    const { data } = await supabase
      .from("watchlist")
      .select("mal_id, title, image_url")
      .eq("user_id", u.id)
      .order("added_at", { ascending: false });
    setPickerAnime(data ?? []);
    setPickerLoading(false);
  }

  async function pickAnime(malId: number, title: string) {
    setPickerAnimeTitle(title);
    setPickerStep("characters");
    setPickerLoading(true);
    const chars = await getAnimeCharacters(malId);
    // Filter to main/supporting chars with valid images only
    const valid = chars.filter(
      (c) => c.character.images?.jpg?.image_url &&
        !c.character.images.jpg.image_url.includes("questionmark")
    );
    setPickerChars(valid);
    setPickerLoading(false);
  }

  function pickCharacter(imageUrl: string) {
    setPendingAvatarUrl(imageUrl);
    setAvatarUrl(imageUrl);
    setPickerOpen(false);
    setSaved(false);
  }

  function removeAvatar() {
    setPendingAvatarUrl(null);
    setAvatarUrl(null);
    setSaved(false);
  }

  async function save() {
    const trimmed = username.trim();
    if (trimmed.length < 2 || trimmed.length > 30) {
      setError("Username must be 2–30 characters.");
      return;
    }
    setSaving(true);
    setError(null);

    const patch: Record<string, unknown> = { id: user.id, username: trimmed };
    if (pendingAvatarUrl !== undefined) patch.avatar_url = pendingAvatarUrl;

    const { error: err } = await supabase.from("profiles").upsert(patch);
    if (err) {
      setError(
        err.message.includes("unique")
          ? "Username already taken."
          : err.message
      );
    } else {
      setProfile((p) => ({
        ...(p ?? {
          id: user.id,
          avatar_url: null,
          created_at: new Date().toISOString(),
        }),
        username: trimmed,
        ...(pendingAvatarUrl !== undefined ? { avatar_url: pendingAvatarUrl } : {}),
      }));
      setPendingAvatarUrl(undefined);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
    setSaving(false);
  }

  const displayName =
    profile?.username || user.email?.split("@")[0] || "Anonymous";
  const avatarBg = avatarColor(user.id);
  const initial = (profile?.username || user.email || "?")[0].toUpperCase();
  const joinDate = new Date(
    profile?.created_at ?? user.created_at ?? Date.now()
  ).toLocaleDateString("en-US", { month: "long", year: "numeric" });

  const isDirty = username.trim() !== (profile?.username ?? "") || pendingAvatarUrl !== undefined;

  const total =
    stats.watching +
    stats.completed +
    stats.plan_to_watch +
    stats.on_hold +
    stats.dropped;

  const STAT_ITEMS = [
    { key: "watching",      label: "Watching",      value: stats.watching,      color: "text-green-400",  ring: "ring-green-900/40"  },
    { key: "completed",     label: "Completed",     value: stats.completed,     color: "text-blue-400",   ring: "ring-blue-900/40"   },
    { key: "plan_to_watch", label: "Plan to Watch", value: stats.plan_to_watch, color: "text-zinc-300",   ring: "ring-zinc-700/40"   },
    { key: "on_hold",       label: "On Hold",       value: stats.on_hold,       color: "text-yellow-400", ring: "ring-yellow-900/40" },
    { key: "dropped",       label: "Dropped",       value: stats.dropped,       color: "text-red-400",    ring: "ring-red-900/40"    },
  ];

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Profile card */}
      <div className="bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden">
        {/* Banner */}
        <div className="h-24 bg-gradient-to-br from-red-950/60 via-zinc-900 to-zinc-950" />

        {/* Avatar + info */}
        <div className="px-5 pb-5 -mt-10">
          {/* Top row: avatar left, quick links right */}
          <div className="flex items-end justify-between gap-3 mb-4">
            {/* Avatar with hover edit overlay */}
            <div className="relative group/av shrink-0">
              {avatarUrl ? (
                <div className="w-20 h-20 rounded-2xl overflow-hidden ring-4 ring-zinc-950">
                  <Image src={avatarUrl} alt="avatar" width={80} height={80} className="object-cover w-full h-full" unoptimized />
                </div>
              ) : (
                <div className={`${avatarBg} w-20 h-20 rounded-2xl flex items-center justify-center text-3xl font-bold text-white ring-4 ring-zinc-950`}>
                  {initial}
                </div>
              )}
              <button
                onClick={openAvatarPicker}
                className="absolute inset-0 rounded-2xl bg-black/60 opacity-0 group-hover/av:opacity-100 flex items-center justify-center transition-opacity cursor-pointer"
                title="Change avatar"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
              </button>
            </div>

            {/* Quick links */}
            <div className="flex items-center gap-2 pb-1 flex-wrap justify-end">
              <Link href="/watchlist" className="text-xs text-zinc-500 hover:text-white border border-zinc-800 hover:border-zinc-600 px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap">
                My List
              </Link>
              <Link href="/ratings" className="text-xs text-zinc-500 hover:text-white border border-zinc-800 hover:border-zinc-600 px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap">
                My Ratings
              </Link>
            </div>
          </div>

          {/* Name / email / join date */}
          <div className="space-y-3">
            <div>
              <label className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider block mb-1.5">
                Username
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={username}
                  onChange={(e) => { setUsername(e.target.value); setError(null); setSaved(false); }}
                  placeholder={displayName}
                  maxLength={30}
                  className="bg-zinc-900 border border-zinc-800 focus:border-red-800 rounded-xl px-3 py-2 text-white text-sm focus:outline-none transition-colors w-full max-w-xs"
                  onKeyDown={(e) => { if (e.key === "Enter") save(); }}
                />
                <button
                  onClick={save}
                  disabled={saving || !isDirty}
                  className={`shrink-0 text-xs font-semibold px-4 py-2 rounded-xl transition-all ${
                    saved
                      ? "bg-green-900 text-green-300"
                      : isDirty
                      ? "bg-red-900 hover:bg-red-800 text-white"
                      : "bg-zinc-900 text-zinc-600 border border-zinc-800 cursor-not-allowed"
                  } disabled:opacity-60`}
                >
                  {saving ? "Saving…" : saved ? "Saved ✓" : "Save"}
                </button>
              </div>
              {error && <p className="text-red-400 text-xs mt-1.5">{error}</p>}
            </div>
            <div>
              <p className="text-zinc-500 text-sm">{user.email}</p>
              <p className="text-zinc-600 text-xs mt-0.5">Joined {joinDate}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Anime Stats</h2>
          <span className="text-zinc-600 text-xs">{total} total</span>
        </div>
        <div className="grid grid-cols-5 gap-2">
          {STAT_ITEMS.map((s) => (
            <Link
              key={s.key}
              href="/watchlist"
              className="bg-zinc-950 border border-zinc-800 hover:border-zinc-700 rounded-xl p-3 text-center transition-all hover:-translate-y-0.5 group"
            >
              <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
              <div className="text-zinc-600 text-[10px] mt-0.5 leading-tight group-hover:text-zinc-500 transition-colors">{s.label}</div>
            </Link>
          ))}
        </div>
      </div>

      {/* Ratings */}
      {ratingCount > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Ratings</h2>
            <Link href="/ratings" className="text-zinc-600 hover:text-zinc-400 text-xs transition-colors">View all →</Link>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-red-400">{ratingCount}</div>
              <div className="text-zinc-600 text-xs mt-0.5">Titles Rated</div>
            </div>
            <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-yellow-400 flex items-center justify-center gap-1">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="#facc15" stroke="none">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
                {avgRating}
              </div>
              <div className="text-zinc-600 text-xs mt-0.5">Avg Rating /10</div>
            </div>
          </div>
        </div>
      )}

      {/* Avatar picker modal */}
      {pickerOpen && (
        <div
          ref={overlayRef}
          className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70 backdrop-blur-sm"
          onClick={(e) => { if (e.target === overlayRef.current) setPickerOpen(false); }}
        >
          <div className="bg-zinc-950 border border-zinc-800 rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md shadow-2xl flex flex-col max-h-[80vh]">
            {/* Handle bar */}
            <div className="flex justify-center pt-3 pb-1 sm:hidden">
              <div className="w-10 h-1 bg-zinc-700 rounded-full" />
            </div>

            {/* Header */}
            <div className="px-5 py-4 border-b border-zinc-800 flex items-center gap-3">
              {pickerStep === "characters" && (
                <button
                  onClick={() => { setPickerStep("anime"); setPickerChars([]); }}
                  className="text-zinc-500 hover:text-white transition-colors"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M19 12H5M12 5l-7 7 7 7" />
                  </svg>
                </button>
              )}
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-white text-sm">
                  {pickerStep === "anime" ? "Choose an Anime" : `Characters — ${pickerAnimeTitle}`}
                </h3>
                <p className="text-zinc-500 text-xs mt-0.5">
                  {pickerStep === "anime" ? "Pick from your watchlist" : "Select a character as your avatar"}
                </p>
              </div>
              <button onClick={() => setPickerOpen(false)} className="text-zinc-600 hover:text-white transition-colors">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Body */}
            <div className="overflow-y-auto flex-1 p-4">
              {pickerLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="w-6 h-6 border-2 border-zinc-700 border-t-red-700 rounded-full animate-spin" />
                </div>
              ) : pickerStep === "anime" ? (
                pickerAnime.length === 0 ? (
                  <div className="text-center py-8 text-zinc-500 text-sm">
                    Add anime to your watchlist first.
                  </div>
                ) : (
                  <div className="space-y-1">
                    {pickerAnime.map((a) => (
                      <button
                        key={a.mal_id}
                        onClick={() => pickAnime(a.mal_id, a.title)}
                        className="w-full flex items-center gap-3 p-2 hover:bg-zinc-900 rounded-xl transition-colors text-left group"
                      >
                        <div className="relative w-8 h-12 rounded-lg overflow-hidden bg-zinc-800 shrink-0">
                          {a.image_url && (
                            <Image src={a.image_url} alt={a.title} fill className="object-cover" unoptimized sizes="32px" />
                          )}
                        </div>
                        <span className="text-sm text-zinc-300 group-hover:text-white line-clamp-1 transition-colors flex-1">
                          {a.title}
                        </span>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-zinc-600 group-hover:text-zinc-400 shrink-0">
                          <path d="M9 18l6-6-6-6" />
                        </svg>
                      </button>
                    ))}
                  </div>
                )
              ) : pickerChars.length === 0 ? (
                <div className="text-center py-8 text-zinc-500 text-sm">
                  No character images found for this anime.
                </div>
              ) : (
                <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                  {pickerChars.map((c) => (
                    <button
                      key={c.character.mal_id}
                      onClick={() => pickCharacter(c.character.images.jpg.image_url)}
                      className="group flex flex-col items-center gap-1"
                      title={c.character.name}
                    >
                      <div className="relative w-full aspect-[3/4] rounded-xl overflow-hidden bg-zinc-800 ring-2 ring-transparent group-hover:ring-red-700 transition-all">
                        <Image
                          src={c.character.images.jpg.image_url}
                          alt={c.character.name}
                          fill
                          className="object-cover"
                          unoptimized
                          sizes="80px"
                        />
                      </div>
                      <span className="text-[10px] text-zinc-500 group-hover:text-zinc-300 text-center line-clamp-1 w-full transition-colors">
                        {c.character.name.split(", ").reverse().join(" ")}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Footer — remove avatar option */}
            {avatarUrl && pickerStep === "anime" && (
              <div className="px-5 py-3 border-t border-zinc-800">
                <button
                  onClick={() => { removeAvatar(); setPickerOpen(false); }}
                  className="text-zinc-600 hover:text-red-400 text-xs transition-colors"
                >
                  Remove current avatar
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
