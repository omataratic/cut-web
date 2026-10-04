import type { Metadata } from "next";
import Link from "next/link";
import { readSharedFinished } from "@/lib/github-finished";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Finished films — Cut",
  description: "Finished films on Cut. Playback is locked.",
};

export default async function FinishedPage() {
  const films = [...(await readSharedFinished())].reverse();

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl text-cut-charcoal">Finished films</h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-cut-muted">
            Finished movies are a separate catalog from YouTube previews. Nothing
            here can be played or downloaded. Access is meant for the creator,
            subscribers, and backer NFT holders, but that check is not live.
          </p>
        </div>
        <Link
          href="/finished/upload"
          className="inline-flex items-center gap-1.5 rounded border border-cut-charcoal px-3 py-1.5 text-sm text-cut-charcoal hover:bg-cut-charcoal hover:text-cut-cream"
        >
          <span aria-hidden>↑</span>
          Add a finished film
        </Link>
      </div>

      {films.length === 0 ? (
        <div className="mt-8 rounded border border-cut-border bg-cut-mist p-6">
          <p className="font-serif text-xl text-cut-charcoal">No finished films yet.</p>
          <p className="mt-2 text-sm leading-relaxed text-cut-muted">
            The list starts empty. A listing saves the title, creator, and synopsis
            only. The movie file is not stored on this site.
          </p>
        </div>
      ) : (
        <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {films.map((film) => (
            <li key={film.id}>
              <Link
                href={`/finished/${film.id}`}
                className="flex h-full flex-col rounded border border-cut-border bg-cut-mist p-4 transition-colors hover:border-cut-charcoal/40"
              >
                <p className="text-xs tracking-widest text-cut-muted uppercase">
                  Locked
                </p>
                <h2 className="mt-2 font-serif text-lg leading-tight text-cut-charcoal">
                  {film.title}
                </h2>
                <p className="mt-1 text-sm text-cut-muted">Creator {film.creator}</p>
                <p className="mt-3 text-sm leading-relaxed text-cut-muted">
                  Locked. Nobody can watch or download this yet.
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
