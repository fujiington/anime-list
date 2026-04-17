"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function HomeSearchBar({ placeholder = "Search anime titles..." }: { placeholder?: string }) {
  const [query, setQuery] = useState("");
  const router = useRouter();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = query.trim();
    if (trimmed) router.push(`/browse?q=${encodeURIComponent(trimmed)}`);
  }

  return (
    <form onSubmit={handleSubmit} className="relative flex items-center w-full max-w-2xl mx-auto">
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-zinc-900/80 border border-zinc-700 text-white placeholder-zinc-500 rounded-xl px-5 py-3.5 pr-28 focus:outline-none focus:border-red-800 transition-colors text-sm backdrop-blur-sm"
        autoComplete="off"
        spellCheck={false}
      />
      <button
        type="submit"
        className="absolute right-2 bg-red-900 hover:bg-red-800 text-white rounded-lg px-4 py-2 text-sm font-medium transition-colors"
      >
        Search
      </button>
    </form>
  );
}
