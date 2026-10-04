import { readSharedSubmissions } from "@/lib/github-films";
import { mockFilms, type Film } from "@/lib/mock-films";
import { submissionToFilm } from "@/lib/submissions";

export async function loadCatalog(): Promise<{
  films: Film[];
  trending: Film[];
}> {
  const submissions = await readSharedSubmissions();
  const submitted = submissions.map(submissionToFilm).reverse();
  const samples = mockFilms.map((film) => ({ ...film, sample: true }));
  const films = [...submitted, ...samples];
  const trending = films
    .slice()
    .sort((a, b) => b.upvotes - a.upvotes)
    .slice(0, 5);
  return { films, trending };
}
