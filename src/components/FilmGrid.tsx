import { FilmCard } from "@/components/FilmCard";
import { mockFilms, trendingFilms } from "@/lib/mock-films";

export function FilmGrid() {
  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_220px]">
      <section aria-labelledby="front-page-heading">
        <h2
          id="front-page-heading"
          className="mb-4 font-serif text-2xl text-cut-charcoal"
        >
          Front page
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {mockFilms.map((film) => (
            <FilmCard key={film.id} film={film} />
          ))}
        </div>
      </section>

      <aside className="hidden lg:block" aria-labelledby="trending-heading">
        <h2
          id="trending-heading"
          className="mb-3 text-xs font-semibold tracking-wide text-cut-muted uppercase"
        >
          Trending
        </h2>
        <ol className="space-y-3">
          {trendingFilms.map((film, index) => (
            <li key={film.id} className="flex items-start gap-2 text-sm">
              <span className="w-4 shrink-0 tabular-nums text-cut-muted">
                {index + 1}
              </span>
              <span
                className="mt-0.5 h-8 w-8 shrink-0 rounded bg-cut-mist"
                aria-hidden
              />
              <div className="min-w-0">
                <p className="truncate font-serif text-cut-charcoal">
                  {film.title}
                </p>
                <p className="text-xs text-cut-muted">
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
