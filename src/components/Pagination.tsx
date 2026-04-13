interface PaginationProps {
  currentPage: number;
  hasNextPage: boolean;
  onPrev: () => void;
  onNext: () => void;
}

export default function Pagination({ currentPage, hasNextPage, onPrev, onNext }: PaginationProps) {
  return (
    <div className="flex items-center justify-center gap-4 mt-8">
      <button
        onClick={onPrev}
        disabled={currentPage <= 1}
        className="px-4 py-2 bg-zinc-900 border border-zinc-700 text-white text-sm rounded-lg disabled:opacity-40 disabled:cursor-not-allowed hover:border-red-900 transition-colors"
      >
        ← Prev
      </button>
      <span className="text-zinc-500 text-sm">Page {currentPage}</span>
      <button
        onClick={onNext}
        disabled={!hasNextPage}
        className="px-4 py-2 bg-zinc-900 border border-zinc-700 text-white text-sm rounded-lg disabled:opacity-40 disabled:cursor-not-allowed hover:border-red-900 transition-colors"
      >
        Next →
      </button>
    </div>
  );
}
