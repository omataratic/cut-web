import { Hero } from "@/components/Hero";
import { FilmGrid } from "@/components/FilmGrid";
import { readSharedSubmissions } from "@/lib/github-films";
import { mockFilms } from "@/lib/mock-films";
import { submissionToFilm } from "@/lib/submissions";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const submissions = await readSharedSubmissions();
  const submitted = submissions.map(submissionToFilm).reverse();
  const samples = mockFilms.map((film) => ({ ...film, sample: true }));
  const films = [...submitted, ...samples];
  const trending = films
    .slice()
    .sort((a, b) => b.upvotes - a.upvotes)
    .slice(0, 5);

  return (
    <>
      <Hero />
      <div className="mx-auto max-w-6xl px-4 py-8">
        <FilmGrid films={films} trending={trending} />
      </div>
    </>
  );
}
