"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import type { Anime } from "@/lib/jikan";

const SLIDE_MS = 4000;

export default function HeroCarousel({ slides }: { slides: Anime[] }) {
  const [active,   setActive]   = useState(0);
  const [resetKey, setResetKey] = useState(0);
  const touchStartX = useRef<number | null>(null);

  // resetKey in deps: clears + restarts the interval on every slide change
  // (manual or auto), keeping the 4 s timer consistent
  useEffect(() => {
    const id = setInterval(() => {
      setActive((prev) => (prev + 1) % slides.length);
      setResetKey((k) => k + 1);
    }, SLIDE_MS);
    return () => clearInterval(id);
  }, [resetKey, slides.length]);

  function goTo(i: number) {
    if (i === active) return;
    setActive(i);
    setResetKey((k) => k + 1);
  }

  function onTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX;
  }

  function onTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current === null) return;
    const delta = e.changedTouches[0].clientX - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(delta) < 40) return;
    if (delta < 0) {
      // swipe left → next
      const next = (active + 1) % slides.length;
      setActive(next);
      setResetKey((k) => k + 1);
    } else {
      // swipe right → prev
      const prev = (active - 1 + slides.length) % slides.length;
      setActive(prev);
      setResetKey((k) => k + 1);
    }
  }

  const anime    = slides[active];
  const title    = anime.title_english || anime.title;
  const imageUrl = anime.images.webp?.large_image_url || anime.images.jpg.large_image_url;

  return (
    <div
      className="relative w-full h-[400px] sm:h-[480px] md:h-[560px] overflow-hidden select-none"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >

      {/* ── background images: all mounted, cross-fade ── */}
      {slides.map((s, i) => {
        const url = s.images.webp?.large_image_url || s.images.jpg.large_image_url;
        return (
          <div
            key={s.mal_id}
            aria-hidden="true"
            className="absolute inset-0 transition-opacity duration-700"
            style={{ opacity: i === active ? 1 : 0, zIndex: 0 }}
          >
            <Image
              src={url}
              alt=""
              fill
              className="object-cover brightness-[0.45]"
              unoptimized
              priority={i < 2}
            />
          </div>
        );
      })}

      {/* ── fixed gradients ── */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/30 to-transparent z-10" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent z-10" />

      {/* ── slide content (fades in on key change) ── */}
      <div
        key={`content-${active}`}
        className="absolute inset-0 z-20 flex items-end justify-center px-4 sm:px-6 md:px-10 pb-16 sm:pb-20 hero-fade"
      >
        <div className="flex items-end gap-6 max-w-3xl w-full">
          {/* poster */}
          <div className="block relative w-24 sm:w-36 aspect-[3/4] rounded-lg overflow-hidden border border-white/10 shrink-0 shadow-2xl">
            <Image src={imageUrl} alt={title} fill className="object-cover" unoptimized />
          </div>

          {/* info */}
          <div className="space-y-3 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="bg-green-700/80 text-white text-xs px-2.5 py-0.5 rounded-full font-medium">
                ● Airing
              </span>
              {anime.score && (
                <span className="bg-black/60 border border-zinc-700 text-white text-xs px-2.5 py-0.5 rounded-full flex items-center gap-1">
                  <span className="text-red-400">★</span>
                  {anime.score.toFixed(1)}
                </span>
              )}
              {anime.type && (
                <span className="bg-black/60 border border-zinc-700 text-zinc-300 text-xs px-2.5 py-0.5 rounded-full">
                  {anime.type}
                </span>
              )}
              {anime.episodes && (
                <span className="bg-black/60 border border-zinc-700 text-zinc-300 text-xs px-2.5 py-0.5 rounded-full">
                  {anime.episodes} eps
                </span>
              )}
            </div>

            <h2 className="text-lg sm:text-2xl md:text-3xl font-bold text-white leading-tight line-clamp-2">
              {title}
            </h2>

            {anime.genres?.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {anime.genres.slice(0, 5).map((g) => (
                  <Link
                    key={g.mal_id}
                    href={`/genres/${g.mal_id}?name=${encodeURIComponent(g.name)}`}
                    className="bg-white/10 hover:bg-white/20 text-zinc-300 text-xs px-2.5 py-0.5 rounded-full transition-colors"
                  >
                    {g.name}
                  </Link>
                ))}
              </div>
            )}

            {anime.synopsis && (
              <p className="text-zinc-400 text-xs sm:text-sm leading-relaxed line-clamp-1 sm:line-clamp-2 max-w-xl">
                {anime.synopsis}
              </p>
            )}

            <div className="flex gap-3 pt-1">
              <Link
                href={`/anime/${anime.mal_id}`}
                className="bg-red-900 hover:bg-red-800 text-white text-sm px-5 py-2.5 rounded-lg transition-colors font-medium"
              >
                View Details
              </Link>
              {anime.trailer?.youtube_id && (
                <a
                  href={`https://www.youtube.com/watch?v=${anime.trailer.youtube_id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-white/10 hover:bg-white/20 text-white text-sm px-5 py-2.5 rounded-lg transition-colors flex items-center gap-2"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                    <polygon points="5 3 19 12 5 21 5 3" />
                  </svg>
                  Trailer
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── numbered tabs + progress bars ── */}
      <div className="absolute bottom-0 left-0 right-0 z-30 flex items-end justify-center gap-3 sm:gap-4 px-4 sm:px-10 pb-3 sm:pb-4">
        {slides.map((s, i) => (
          <button
            key={s.mal_id}
            onClick={() => goTo(i)}
            className="flex flex-col items-center gap-1.5 cursor-pointer transition-opacity"
            style={{ opacity: i === active ? 1 : 0.38 }}
            onMouseEnter={(e) => { if (i !== active) (e.currentTarget as HTMLButtonElement).style.opacity = "0.65"; }}
            onMouseLeave={(e) => { if (i !== active) (e.currentTarget as HTMLButtonElement).style.opacity = "0.38"; }}
            aria-label={`Slide ${i + 1}`}
          >
            <span
              className="text-xs font-bold tabular-nums"
              style={{ color: i === active ? "#ffffff" : "#a1a1aa" }}
            >
              #{i + 1}
            </span>
            {/* track */}
            <div className="relative w-10 h-[3px] rounded-full overflow-hidden bg-white/20">
              {i === active ? (
                /* fill — re-keyed so CSS animation restarts from 0 on every slide change */
                <div
                  key={`bar-${resetKey}`}
                  className="absolute inset-y-0 left-0 right-0 bg-white rounded-full progress-fill"
                />
              ) : (
                <div className="h-full w-full bg-zinc-600/40 rounded-full" />
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
