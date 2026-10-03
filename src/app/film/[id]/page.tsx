import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BtsFeed } from "@/components/BtsFeed";
import { FilmPreview } from "@/components/FilmPreview";
import { getFilmById, mockFilms } from "@/lib/mock-films";

type PageProps = {
  params: Promise<{ id: string }>;
};

export function generateStaticParams() {
  return mockFilms.map((film) => ({ id: film.id }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const film = getFilmById(id);
  if (!film) return { title: "Film — Cut" };
  return {
    title: `${film.title} — Cut`,
    description: film.synopsis,
  };
}

function formatUsd(n: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

export default async function FilmDetailPage({ params }: PageProps) {
  const { id } = await params;
  const film = getFilmById(id);
  if (!film) notFound();

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:py-10">
      <p className="mb-4 text-sm">
        <Link href="/" className="text-cut-muted hover:text-cut-charcoal">
          ← Front page
        </Link>
      </p>

      <article className="mb-8">
        <FilmPreview title={film.title} youtubeId={film.youtubeId} />

        <h1 className="font-serif text-3xl text-cut-charcoal sm:text-4xl">
          {film.title}
        </h1>
        <p className="mt-1 text-sm text-cut-muted">dir. {film.director}</p>
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
          <p className="text-xs text-cut-muted">
            {film.pledges} pledges · {film.upvotes} upvotes
          </p>
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
