import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PledgeForm } from "@/components/PledgeForm";
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
  if (!film) return { title: "Pledge — Cut" };
  return {
    title: `Pledge ${film.title} — Cut`,
    description: `Preview a $CUT pledge for ${film.title}. Escrow is not live.`,
  };
}

function formatUsd(n: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

export default async function FilmPledgePage({ params }: PageProps) {
  const { id } = await params;
  const film = getFilmById(id);
  if (!film) notFound();

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

      <header className="mb-6">
        <p className="text-xs font-semibold tracking-widest text-cut-muted uppercase">
          Pledge
        </p>
        <h1 className="mt-1 font-serif text-3xl text-cut-charcoal sm:text-4xl">
          {film.title}
        </h1>
        <p className="mt-1 text-sm text-cut-muted">dir. {film.director}</p>
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
