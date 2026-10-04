import { readSharedSubmissions } from "@/lib/github-films";
import { getFilmById, type Film } from "@/lib/mock-films";
import { submissionToFilm } from "@/lib/submissions";

export async function resolveFilm(id: string): Promise<Film | undefined> {
  const sample = getFilmById(id);
  if (sample) return { ...sample, sample: true };
  const submissions = await readSharedSubmissions();
  const submission = submissions.find((item) => item.id === id);
  return submission ? submissionToFilm(submission) : undefined;
}
