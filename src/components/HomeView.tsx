import { FilmGrid } from "@/components/FilmGrid";
import { Hero } from "@/components/Hero";
import { loadCatalog } from "@/lib/catalog";

export async function HomeView({
  sort,
  query,
}: {
  sort: "hot" | "new";
  query: string;
}) {
  const { films, trending } = await loadCatalog();

  return (
    <>
      <Hero />
      <div className="mx-auto max-w-6xl px-4 py-8">
        <FilmGrid films={films} trending={trending} sort={sort} query={query} />
      </div>
    </>
  );
}
