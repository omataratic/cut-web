import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { readSharedFinishedById } from "@/lib/github-finished";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const film = await readSharedFinishedById(id);
  if (!film) return { title: "Finished film — Cut" };
  return {
    title: `${film.title} — Cut`,
    description: film.synopsis,
  };
}

export default async function FinishedFilmPage({ params }: PageProps) {
  const { id } = await params;
  const film = await readSharedFinishedById(id);
  if (!film) notFound();

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:py-10">
      <p className="mb-4 text-sm">
        <Link href="/finished" className="text-cut-muted hover:text-cut-charcoal">
          ← Finished films
        </Link>
      </p>

      <article>
        <p className="mb-2 text-xs tracking-widest text-cut-muted uppercase">
          Finished film
        </p>
        <h1 className="font-serif text-3xl text-cut-charcoal sm:text-4xl">
          {film.title}
        </h1>
        <p className="mt-1 text-sm text-cut-muted">Creator {film.creator}</p>
        <p className="mt-4 text-sm leading-relaxed text-cut-charcoal sm:text-base">
          {film.synopsis}
        </p>

        <div className="mt-6 space-y-3 rounded border border-cut-border bg-cut-mist p-4">
          <h2 className="font-serif text-xl text-cut-charcoal">Locked</h2>
          <p className="text-sm leading-relaxed text-cut-muted">
            Only the creator, subscribers, and backer NFT holders will be able to
            watch this film. Nobody can watch it yet, including the person who
            listed it, because that check is not turned on.
          </p>
          <p className="text-sm leading-relaxed text-cut-muted">
            Streaming is meant to be $3.99/month. Checkout is off until there is
            a finished film that can actually play. There is no player and no
            download.
          </p>
        </div>
      </article>
    </div>
  );
}
