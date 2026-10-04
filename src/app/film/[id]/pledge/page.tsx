import type { Metadata } from "next";
import { FilmPledgeView } from "@/components/FilmPledgeView";
import { LocalPledgePage } from "@/components/LocalPledgePage";
import { resolveFilm } from "@/lib/resolve-film";

type PageProps = {
  params: Promise<{ id: string }>;
};

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const film = await resolveFilm(id);
  if (!film) return { title: "Pledge — Cut" };
  return {
    title: `Pledge ${film.title} — Cut`,
    description: `Preview a $CUT pledge for ${film.title}. Escrow is not live.`,
  };
}

export default async function FilmPledgePage({ params }: PageProps) {
  const { id } = await params;
  const film = await resolveFilm(id);
  if (!film) return <LocalPledgePage id={id} />;
  return <FilmPledgeView film={film} />;
}
