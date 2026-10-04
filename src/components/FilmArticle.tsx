import Link from "next/link";
import { BtsFeed } from "@/components/BtsFeed";
import { FilmPreview } from "@/components/FilmPreview";
import { VoteControls } from "@/components/VoteControls";
import type { PublicBtsPost } from "@/lib/bts";
import type { Film } from "@/lib/mock-films";

function formatUsd(n: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

type FilmArticleProps = {
  film: Film;
  localOnly?: boolean;
  prev?: Film | null;
  next?: Film | null;
  btsPosts?: PublicBtsPost[];
};

function FilmStep({
  film,
  direction,
}: {
  film: Film;
  direction: "prev" | "next";
}) {
  const label = direction === "prev" ? "Previous" : "Next";
  return (
    <Link
      href={`/film/${film.id}`}
      aria-label={`${label}: ${film.title}`}
      className={`inline-flex min-h-11 max-w-[48%] items-center gap-2 rounded-md border border-cut-border bg-black px-3 text-sm text-cut-charcoal hover:border-cut-muted ${
        direction === "next" ? "ml-auto flex-row-reverse text-right" : ""
      }`}
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 16 16"
        aria-hidden
        className={direction === "next" ? "rotate-180" : undefined}
      >
        <path
          d="M10.5 2.5 4.5 8l6 5.5"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span className="min-w-0">
        <span className="block text-xs tracking-widest text-cut-muted uppercase">
          {label}
        </span>
        <span className="block truncate">{film.title}</span>
      </span>
    </Link>
  );
}

export function FilmArticle({
  film,
  localOnly = false,
  prev = null,
  next = null,
  btsPosts = [],
}: FilmArticleProps) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:py-10">
      <p className="mb-4 text-sm">
        <Link href="/" className="text-cut-muted hover:text-cut-charcoal">
          ← Front page
        </Link>
      </p>

      {localOnly ? (
        <p className="mb-4 text-sm leading-relaxed text-cut-muted">
          Only this browser has this film. Other visitors cannot see it.
        </p>
      ) : null}

      {prev || next ? (
        <div className="mb-3 flex items-stretch gap-3">
          {prev ? <FilmStep film={prev} direction="prev" /> : <span />}
          {next ? <FilmStep film={next} direction="next" /> : <span />}
        </div>
      ) : null}

      <article className="mb-8">
        <FilmPreview
          title={film.title}
          youtubeId={film.youtubeId}
          still={film.sample ? `/samples/${film.id}.jpg` : null}
        />

        {film.sample ? (
          <p className="mb-2 text-xs tracking-widest text-cut-muted uppercase">
            Sample
          </p>
        ) : null}

        <h1 className="font-serif text-3xl text-cut-charcoal sm:text-4xl">
          {film.title}
        </h1>
        <p className="mt-1 text-sm text-cut-muted">
          {film.sample ? "dir." : "Creator"} {film.director}
        </p>
        <p className="mt-4 text-sm leading-relaxed text-cut-charcoal sm:text-base">
          {film.synopsis}
        </p>

        <div className="mt-6 space-y-2 rounded border border-cut-border bg-cut-mist p-4">
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
              {formatUsd(film.raisedUsd)} / {formatUsd(film.goalUsd)}
            </span>
          </div>
          <VoteControls filmId={film.id} score={film.upvotes} sync />
          <p className="text-xs text-cut-muted">{film.pledges} pledges</p>
          <div className="pt-2">
            <Link
              href={`/film/${film.id}/pledge`}
              className="inline-flex rounded border border-cut-charcoal bg-cut-charcoal px-5 py-2.5 text-sm text-cut-cream hover:opacity-90"
            >
              Pledge $CUT
            </Link>
            <p className="mt-2 text-xs leading-relaxed text-cut-muted">
              Pledges are held in $CUT. If the goal is missed, the pledge is
              refunded in full.
            </p>
          </div>
        </div>
      </article>

      <BtsFeed filmId={film.id} filmTitle={film.title} posts={btsPosts} />
    </div>
  );
}
