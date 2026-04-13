import { Suspense } from "react";
import BrowseClient from "./BrowseClient";
import AnimeGrid from "@/components/AnimeGrid";

export default function BrowsePage() {
  return (
    <Suspense fallback={<BrowseFallback />}>
      <BrowseClient />
    </Suspense>
  );
}

function BrowseFallback() {
  return (
    <div className="space-y-6">
      <div className="h-8 w-48 bg-zinc-900 rounded animate-pulse" />
      <div className="flex gap-2">
        {[...Array(4)].map((_, i) => <div key={i} className="h-9 w-28 bg-zinc-900 rounded-lg animate-pulse" />)}
      </div>
      <AnimeGrid anime={[]} loading />
    </div>
  );
}
