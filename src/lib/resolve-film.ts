import { readSharedSubmissions } from "@/lib/github-films";
import { readVoteScores } from "@/lib/github-votes";
import { getFilmById, type Film } from "@/lib/mock-films";
import { submissionToFilm } from "@/lib/submissions";

export async function resolveFilm(id: string): Promise<Film | undefined> {
  const scores = await readVoteScores();
  const score = scores[id] ?? 0;
  const sample = getFilmById(id);
  if (sample) return { ...sample, sample: true, upvotes: score };
  const submissions = await readSharedSubmissions();
  const submission = submissions.find((item) => item.id === id);
  return submission ? { ...submissionToFilm(submission), upvotes: score } : undefined;
}
