import { readSharedSubmissions } from "@/lib/github-films";
import { readVoteScores } from "@/lib/github-votes";
import { mockFilms, type Film } from "@/lib/mock-films";
import { submissionToFilm } from "@/lib/submissions";

export async function loadCatalog(): Promise<{
  films: Film[];
  trending: Film[];
  scores: Record<string, number>;
}> {
  const [submissions, scores] = await Promise.all([
    readSharedSubmissions(),
    readVoteScores(),
  ]);
  const submitted = submissions.map(submissionToFilm).reverse();
  const samples = mockFilms.map((film) => ({ ...film, sample: true }));
  const base = [...submitted, ...samples];
  const scoreOf = (film: Film) => scores[film.id] ?? 0;
  // Score first. Equal scores keep the old sample ranking in the sidebar.
  const trending = base
    .slice()
    .sort((a, b) => scoreOf(b) - scoreOf(a) || b.upvotes - a.upvotes)
    .slice(0, 5)
    .map((film) => ({ ...film, upvotes: scoreOf(film) }));
  const films = base.map((film) => ({ ...film, upvotes: scoreOf(film) }));
  return { films, trending, scores };
}
