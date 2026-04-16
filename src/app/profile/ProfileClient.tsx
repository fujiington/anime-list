"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import type { User } from "@supabase/supabase-js";

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
}

export default function ProfileClient({ user, initialProfile, stats }: Props) {
  const [profile, setProfile] = useState(initialProfile);
  const [editing, setEditing] = useState(false);
  const [username, setUsername] = useState(initialProfile?.username ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  async function save() {
    const trimmed = username.trim();
    if (trimmed.length < 2 || trimmed.length > 30) {
      setError("Username must be 2–30 characters.");
      return;
    }
    setSaving(true);
    setError(null);
    const { error: err } = await supabase
      .from("profiles")
      .upsert({ id: user.id, username: trimmed });
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
      }));
      setEditing(false);
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
    <div className="max-w-2xl mx-auto space-y-8">
      {/* Profile card */}
      <div className="bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden">
        {/* Banner */}
        <div className="h-20 bg-gradient-to-br from-red-950/60 via-zinc-900 to-zinc-950" />

        {/* Avatar + info */}
        <div className="px-6 pb-6 -mt-8">
          <div className="flex items-end justify-between gap-4">
            <div
              className={`${avatarBg} w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold text-white ring-4 ring-zinc-950 shrink-0`}
            >
              {initial}
            </div>
            <Link
              href="/watchlist"
              className="mb-1 text-xs text-zinc-500 hover:text-white border border-zinc-800 hover:border-zinc-600 px-3 py-1.5 rounded-lg transition-colors"
            >
              My List
            </Link>
          </div>

          <div className="mt-3 space-y-1">
            {editing ? (
              <div className="space-y-3">
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Username"
                  maxLength={30}
                  className="bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-red-800 w-full max-w-xs"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter") save();
                    if (e.key === "Escape") { setEditing(false); setError(null); }
                  }}
                />
                {error && (
                  <p className="text-red-400 text-xs">{error}</p>
                )}
                <div className="flex gap-2">
                  <button
                    onClick={save}
                    disabled={saving}
                    className="bg-red-900 hover:bg-red-800 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                  >
                    {saving ? "Saving…" : "Save"}
                  </button>
                  <button
                    onClick={() => { setEditing(false); setError(null); }}
                    className="text-zinc-500 hover:text-white text-xs px-3 py-1.5 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-white">{displayName}</h1>
                <button
                  onClick={() => { setUsername(profile?.username ?? ""); setEditing(true); }}
                  className="text-zinc-700 hover:text-zinc-400 transition-colors"
                  title="Edit username"
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                </button>
              </div>
            )}
            <p className="text-zinc-500 text-sm">{user.email}</p>
            <p className="text-zinc-600 text-xs">Joined {joinDate}</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider">
            Anime Stats
          </h2>
          <span className="text-zinc-600 text-xs">{total} total</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {STAT_ITEMS.map((s) => (
            <Link
              key={s.key}
              href="/watchlist"
              className={`bg-zinc-950 border border-zinc-800 hover:border-zinc-700 rounded-xl p-4 text-center transition-all hover:-translate-y-0.5 ring-1 ring-transparent hover:${s.ring}`}
            >
              <div className={`text-3xl font-bold ${s.color}`}>{s.value}</div>
              <div className="text-zinc-500 text-xs mt-1 leading-tight">{s.label}</div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
