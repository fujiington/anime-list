import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getMangaById } from "@/lib/jikan";
import { createClient } from "@/lib/supabase/server";
import MangaListButton, { type MangaListEntry } from "@/components/MangaListButton";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function MangaDetailPage({ params }: Props) {
  const { id } = await params;
  const mangaId = parseInt(id, 10);
  if (isNaN(mangaId)) notFound();

  let manga;
  try {
    const res = await getMangaById(mangaId);
    manga = res.data;
  } catch {
    notFound();
  }

  const title = manga.title_english || manga.title;
  const imageUrl = manga.images.webp?.large_image_url || manga.images.jpg.large_image_url;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  let entry: MangaListEntry | null = null;
  if (user) {
    const { data } = await supabase
      .from("manga_list")
      .select("status, user_rating, chapters_read, total_chapters")
      .eq("user_id", user.id)
      .eq("mal_id", mangaId)
      .maybeSingle();
    entry = data as MangaListEntry | null;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Link
        href="/manga"
        className="inline-flex items-center gap-2 text-zinc-500 hover:text-white text-sm transition-colors"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="19" y1="12" x2="5" y2="12" />
          <polyline points="12 19 5 12 12 5" />
        </svg>
        Back to Manga
      </Link>

      <div className="flex flex-col sm:flex-row gap-6">
        {/* Poster */}
        <div className="shrink-0 self-start">
          <div className="relative w-48 aspect-[3/4] rounded-lg overflow-hidden bg-zinc-900 border border-zinc-800">
            <Image
              src={imageUrl}
              alt={title}
              fill
              className="object-cover"
              sizes="192px"
              priority
              unoptimized
            />
          </div>
        </div>

        {/* Info */}
        <div className="flex-1 space-y-4">
          <div>
            <h1 className="text-2xl font-bold leading-tight">{title}</h1>
            {manga.title_english && manga.title !== manga.title_english && (
              <p className="text-zinc-500 text-sm mt-1">{manga.title}</p>
            )}
          </div>

          {/* Reading List */}
          <MangaListButton
            malId={mangaId}
            title={title}
            imageUrl={imageUrl}
            score={manga.score}
            totalChapters={manga.chapters ?? undefined}
            initialEntry={entry}
            isLoggedIn={!!user}
          />

          {/* Stats */}
          <div className="flex flex-wrap gap-2">
            {manga.score && (
              <Stat label="Score" value={`★ ${manga.score.toFixed(1)}`} accent />
            )}
            {manga.rank && <Stat label="Rank" value={`#${manga.rank}`} />}
            {manga.type && <Stat label="Type" value={manga.type} />}
            {manga.chapters && <Stat label="Chapters" value={String(manga.chapters)} />}
            {manga.volumes && <Stat label="Volumes" value={String(manga.volumes)} />}
            {manga.status && <Stat label="Status" value={manga.status} />}
          </div>

          {/* Genres */}
          {manga.genres?.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {manga.genres.map((g) => (
                <span
                  key={g.mal_id}
                  className="bg-zinc-900 border border-zinc-700 text-zinc-300 text-xs px-2 py-1 rounded"
                >
                  {g.name}
                </span>
              ))}
            </div>
          )}

          {/* Authors */}
          {manga.authors?.length > 0 && (
            <p className="text-zinc-500 text-sm">
              <span className="text-zinc-400">Authors:</span>{" "}
              {manga.authors.map((a) => a.name).join(", ")}
            </p>
          )}

          {/* Published */}
          {manga.published?.string && (
            <p className="text-zinc-500 text-sm">
              <span className="text-zinc-400">Published:</span> {manga.published.string}
            </p>
          )}

          {/* Synopsis */}
          {manga.synopsis && (
            <div className="space-y-1">
              <h2 className="text-white text-sm font-semibold uppercase tracking-wider">
                Description
              </h2>
              <p className="text-zinc-400 text-sm leading-relaxed">{manga.synopsis}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div
      className={`flex flex-col items-center px-3 py-2 rounded-lg border text-center min-w-[64px] ${
        accent ? "bg-red-950/40 border-red-900" : "bg-zinc-900 border-zinc-800"
      }`}
    >
      <span className={`text-sm font-bold ${accent ? "text-red-400" : "text-white"}`}>
        {value}
      </span>
      <span className="text-zinc-600 text-xs">{label}</span>
    </div>
  );
}
