"use client";

import Link from "next/link";
import { useSyncExternalStore } from "react";
import { FilmPledgeView } from "@/components/FilmPledgeView";
import type { Film } from "@/lib/mock-films";
import {
  getLocalFilmByIdSnapshot,
  subscribeLocalFilms,
} from "@/lib/submissions";

const pending = "pending";

export function LocalPledgePage({ id }: { id: string }) {
  const film = useSyncExternalStore<Film | null | "pending">(
    subscribeLocalFilms,
    () => getLocalFilmByIdSnapshot(id),
    () => pending,
  );

  if (film === pending) {
    return (
      <p className="mx-auto max-w-3xl px-4 py-8 text-sm text-cut-muted">
        Loading film…
      </p>
    );
  }

  if (!film) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <h1 className="font-serif text-3xl text-cut-charcoal">Film not found</h1>
        <p className="mt-3 text-sm text-cut-muted">This preview is not on Cut.</p>
        <Link
          href="/"
          className="mt-8 inline-block rounded border border-cut-charcoal px-4 py-2 text-sm text-cut-charcoal hover:bg-cut-charcoal hover:text-cut-cream"
        >
          Back to front page
        </Link>
      </div>
    );
  }

  return <FilmPledgeView film={film} localOnly />;
}
