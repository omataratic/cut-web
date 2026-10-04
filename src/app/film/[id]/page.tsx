import type { Metadata } from "next";
import { FilmArticle } from "@/components/FilmArticle";
import { LocalFilmPage } from "@/components/LocalFilmPage";
import { loadCatalog } from "@/lib/catalog";
import { listPublicBts } from "@/lib/github-bts";
import type { Film } from "@/lib/mock-films";
import { resolveFilm } from "@/lib/resolve-film";

type PageProps = {
  params: Promise<{ id: string }>;
};

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const film = await resolveFilm(id);
  if (!film) return { title: "Film — Cut" };
  return {
    title: `${film.title} — Cut`,
    description: film.synopsis,
  };
}

function neighbors(films: Film[], id: string): {
  prev: Film | null;
  next: Film | null;
} {
  const ordered = films.slice().sort((a, b) => b.upvotes - a.upvotes);
  const index = ordered.findIndex((film) => film.id === id);
  if (index < 0) return { prev: null, next: null };
  return {
    prev: ordered[index - 1] ?? null,
    next: ordered[index + 1] ?? null,
  };
}

export default async function FilmDetailPage({ params }: PageProps) {
  const { id } = await params;
  const film = await resolveFilm(id);
  if (!film) return <LocalFilmPage id={id} />;
  const { films } = await loadCatalog();
  const { prev, next } = neighbors(films, film.id);
  const btsPosts = await listPublicBts(film.id);
  return <FilmArticle film={film} prev={prev} next={next} btsPosts={btsPosts} />;
}
