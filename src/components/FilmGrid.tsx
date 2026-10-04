"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import { FilmCard } from "@/components/FilmCard";
import type { Film } from "@/lib/mock-films";
import {
  getLocalFilmsServerSnapshot,
  getLocalFilmsSnapshot,
  subscribeLocalFilms,
} from "@/lib/submissions";

type FilmGridProps = {
  films: Film[];
  trending: Film[];
  sort?: "hot" | "new";
  query?: string;
};

function matchesQuery(film: Film, query: string): boolean {
  const needle = query.trim().toLowerCase();
  if (!needle) return true;
  return (
    film.title.toLowerCase().includes(needle) ||
    film.director.toLowerCase().includes(needle)
  );
}

function byNewest(a: Film, b: Film): number {
  const time = (film: Film) => {
    if (!film.createdAt) return Number.NEGATIVE_INFINITY;
    const parsed = Date.parse(film.createdAt);
    return Number.isNaN(parsed) ? Number.NEGATIVE_INFINITY : parsed;
  };
  return time(b) - time(a);
}

export function FilmGrid({
  films,
  trending,
  sort = "hot",
  query = "",
}: FilmGridProps) {
  const localFilms = useSyncExternalStore(
    subscribeLocalFilms,
    getLocalFilmsSnapshot,
    getLocalFilmsServerSnapshot,
  );
  const known = new Set(films.map((film) => film.id));
  const extras = localFilms.filter((film) => !known.has(film.id));
  const ordered =
    sort === "new" ? [...extras, ...films].sort(byNewest) : [...extras, ...films];
  const listed = ordered.filter((film) => matchesQuery(film, query));
  const visibleTrending = trending.filter((film) => matchesQuery(film, query));
  const heading = sort === "new" ? "New" : "Front page";

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_220px]">
      <section aria-labelledby="front-page-heading">
        <h2
          id="front-page-heading"
          className="mb-4 font-serif text-2xl text-cut-charcoal"
        >
          {heading}
        </h2>
        {listed.length === 0 ? (
          <p className="text-sm text-cut-muted">No films match that search.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {listed.map((film) => (
              <FilmCard key={film.id} film={film} />
            ))}
          </div>
        )}
      </section>

      <aside className="hidden lg:block" aria-labelledby="trending-heading">
        <h2
          id="trending-heading"
          className="mb-3 text-xs font-semibold tracking-wide text-cut-muted uppercase"
        >
          Trending
        </h2>
        <ol className="space-y-3">
          {visibleTrending.map((film, index) => (
            <li key={film.id} className="flex items-start gap-2 text-sm">
              <span className="w-4 shrink-0 tabular-nums text-cut-muted">
                {index + 1}
              </span>
              <span
                className="mt-0.5 h-8 w-8 shrink-0 rounded bg-cut-mist"
                aria-hidden
              />
              <div className="min-w-0">
                <Link
                  href={`/film/${film.id}`}
                  className="truncate font-serif text-cut-charcoal hover:underline"
                >
                  {film.title}
                </Link>
                <p className="text-xs text-cut-muted">
                  {film.sample ? "Sample · " : ""}
                  {film.fundedPercent}% funded
                </p>
              </div>
            </li>
          ))}
        </ol>
      </aside>
    </div>
  );
}
