import Link from "next/link";
import type { Film } from "@/lib/mock-films";

function formatUsd(n: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

type FilmCardProps = {
  film: Film;
};

export function FilmCard({ film }: FilmCardProps) {
  return (
    <article className="flex flex-col overflow-hidden rounded border border-cut-border bg-cut-mist transition-colors hover:border-cut-charcoal/40">
      <Link href={`/film/${film.id}`} className="flex flex-1 flex-col">
        <div
          className="flex aspect-[16/10] items-center justify-center bg-black text-cut-muted"
          aria-hidden
        >
          <svg
            width="40"
            height="40"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.25"
          >
            <rect x="3" y="5" width="18" height="14" rx="1" />
            <circle cx="9" cy="11" r="2" />
            <path d="M3 16l5-4 3 2 4-5 6 7" />
          </svg>
        </div>

        <div className="flex flex-1 flex-col gap-2 p-3">
          <div>
            <h3 className="font-serif text-lg leading-tight text-cut-charcoal">
              {film.title}
            </h3>
            <p className="text-sm text-cut-muted">dir. {film.director}</p>
          </div>

          <div className="flex items-center gap-1 text-sm text-cut-charcoal">
            <span aria-hidden className="leading-none">
              ▲
            </span>
            <span aria-hidden className="text-cut-muted leading-none">
              ▼
            </span>
            <span className="ml-1 tabular-nums">{film.upvotes}</span>
          </div>

          <div className="mt-auto space-y-1">
            <div
              className="h-1.5 w-full overflow-hidden rounded-full bg-cut-mist"
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
            <div className="flex justify-between gap-2 text-xs text-cut-muted">
              <span>{film.fundedPercent}% funded</span>
              <span className="tabular-nums">
                {formatUsd(film.raisedUsd)} / {formatUsd(film.goalUsd)}
              </span>
            </div>
            <p className="text-xs text-cut-muted">{film.pledges} pledges</p>
          </div>
        </div>
      </Link>
    </article>
  );
}
