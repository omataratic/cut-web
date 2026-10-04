import Link from "next/link";
import { PledgeForm } from "@/components/PledgeForm";
import type { Film } from "@/lib/mock-films";

function formatUsd(n: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

type FilmPledgeViewProps = {
  film: Film;
  localOnly?: boolean;
};

export function FilmPledgeView({ film, localOnly = false }: FilmPledgeViewProps) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:py-10">
      <p className="mb-6 text-sm">
        <Link
          href={`/film/${film.id}`}
          className="text-cut-muted hover:text-cut-charcoal"
        >
          ← {film.title}
        </Link>
      </p>

      {localOnly ? (
        <p className="mb-4 text-sm leading-relaxed text-cut-muted">
          Only this browser has this film. Other visitors cannot see it.
        </p>
      ) : null}

      <header className="mb-6">
        <p className="text-xs font-semibold tracking-widest text-cut-muted uppercase">
          Pledge
        </p>
        <h1 className="mt-1 font-serif text-3xl text-cut-charcoal sm:text-4xl">
          {film.title}
        </h1>
        <p className="mt-1 text-sm text-cut-muted">
          {film.sample ? "dir." : "Creator"} {film.director}
        </p>
      </header>

      <section
        aria-label="Funding"
        className="mb-6 space-y-2 rounded border border-cut-border bg-cut-mist p-4"
      >
        <div
          className="h-2 w-full overflow-hidden rounded-full bg-cut-cream"
          role="progressbar"
          aria-valuenow={film.fundedPercent}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`${film.fundedPercent}% funded`}
        >
          <div
            className="h-full rounded-full bg-cut-charcoal"
            style={{ width: `${Math.min(film.fundedPercent, 100)}%` }}
          />
        </div>
        <div className="flex flex-wrap justify-between gap-2 text-sm text-cut-muted">
          <span>{film.fundedPercent}% funded</span>
          <span className="tabular-nums">
            {formatUsd(film.raisedUsd)} raised
          </span>
        </div>
        <p className="text-sm text-cut-charcoal">
          Goal {formatUsd(film.goalUsd)}
        </p>
      </section>

      <PledgeForm filmId={film.id} filmTitle={film.title} />
    </div>
  );
}
