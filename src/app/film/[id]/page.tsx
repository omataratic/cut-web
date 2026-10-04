import type { Metadata } from "next";
import { FilmArticle } from "@/components/FilmArticle";
import { LocalFilmPage } from "@/components/LocalFilmPage";
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

export default async function FilmDetailPage({ params }: PageProps) {
  const { id } = await params;
  const film = await resolveFilm(id);
  if (!film) return <LocalFilmPage id={id} />;
  return <FilmArticle film={film} />;
}
