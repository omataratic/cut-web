import Link from "next/link";
import { BtsFeed } from "@/components/BtsFeed";
import { FilmPreview } from "@/components/FilmPreview";
import { VoteControls } from "@/components/VoteControls";
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
};

export function FilmArticle({ film, localOnly = false }: FilmArticleProps) {
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

      <BtsFeed
        filmId={film.id}
        mockOwnerWallet={film.ownerWallet}
        filmTitle={film.title}
      />
    </div>
  );
}
