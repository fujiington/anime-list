"use client";

interface SortBarProps {
  orderBy: string;
  sort: string;
  status: string;
  type: string;
  genre?: string;
  genreOptions?: { value: string; label: string }[];
  onChange: (key: string, value: string) => void;
}

const ORDER_OPTIONS = [
  { value: "score", label: "Score" },
  { value: "popularity", label: "Popularity" },
  { value: "rank", label: "Rank" },
  { value: "start_date", label: "Newest" },
  { value: "members", label: "Most Members" },
  { value: "favorites", label: "Most Favorited" },
  { value: "episodes", label: "Episodes" },
];

const STATUS_OPTIONS = [
  { value: "", label: "All Status" },
  { value: "airing", label: "Airing" },
  { value: "upcoming", label: "Upcoming" },
  { value: "complete", label: "Finished" },
];

const TYPE_OPTIONS = [
  { value: "", label: "All Types" },
  { value: "tv", label: "TV" },
  { value: "movie", label: "Movie" },
  { value: "ova", label: "OVA" },
  { value: "special", label: "Special" },
  { value: "ona", label: "ONA" },
];

const selectClass =
  "bg-zinc-900 border border-zinc-700 text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-red-800 cursor-pointer hover:border-zinc-600 transition-colors";

export default function SortBar({ orderBy, sort, status, type, genre, genreOptions, onChange }: SortBarProps) {
  return (
    <div className="flex flex-wrap gap-2 items-center">
      <span className="text-zinc-600 text-xs uppercase tracking-wider mr-1">Sort</span>

      <select value={orderBy} onChange={(e) => onChange("orderBy", e.target.value)} className={selectClass}>
        {ORDER_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>

      <select value={sort} onChange={(e) => onChange("sort", e.target.value)} className={selectClass}>
        <option value="desc">↓ Descending</option>
        <option value="asc">↑ Ascending</option>
      </select>

      <span className="text-zinc-700 text-xs">|</span>
      <span className="text-zinc-600 text-xs uppercase tracking-wider">Filter</span>

      <select value={status} onChange={(e) => onChange("status", e.target.value)} className={selectClass}>
        {STATUS_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>

      <select value={type} onChange={(e) => onChange("type", e.target.value)} className={selectClass}>
        {TYPE_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>

      {genreOptions && genreOptions.length > 0 && (
        <>
          <span className="text-zinc-700 text-xs">|</span>
          <select value={genre ?? ""} onChange={(e) => onChange("genre", e.target.value)} className={selectClass}>
            <option value="">All Genres</option>
            {genreOptions.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </>
      )}
    </div>
  );
}
