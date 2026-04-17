import { Suspense } from "react";
import { notFound } from "next/navigation";
import GenreClient from "./GenreClient";
import AnimeGrid from "@/components/AnimeGrid";
import { getSiteMode } from "@/lib/mode";

interface Props {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ name?: string }>;
}

export default async function GenrePage({ params, searchParams }: Props) {
  const { id } = await params;
  const { name } = await searchParams;
  const genreId = parseInt(id, 10);
  if (isNaN(genreId)) notFound();

  const mode = await getSiteMode();

  return (
    <Suspense fallback={
      <div className="space-y-6">
        <div className="h-8 w-48 bg-zinc-900 rounded animate-pulse" />
        <div className="flex gap-2">
          {[...Array(4)].map((_, i) => <div key={i} className="h-9 w-28 bg-zinc-900 rounded-lg animate-pulse" />)}
        </div>
        <AnimeGrid anime={[]} loading />
      </div>
    }>
      <GenreClient genreId={genreId} genreName={name ?? "Genre"} mode={mode} />
    </Suspense>
  );
}
