export type VoteDirection = "up" | "down";

export type StoredVote = {
  voterId: string;
  filmId: string;
  direction: VoteDirection;
};

/** Browser identity. Not an account. */
export const VOTER_ID =
  /^v-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Sample ids are short numbers. Submitted and local previews are c-uuids. */
export const FILM_ID =
  /^(?:[1-9]\d{0,5}|c-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/i;

export const MAX_VOTES = 5000;

export function isVoteDirection(value: unknown): value is VoteDirection {
  return value === "up" || value === "down";
}

export function isStoredVote(value: unknown): value is StoredVote {
  if (!value || typeof value !== "object") return false;
  const row = value as Record<string, unknown>;
  return (
    typeof row.voterId === "string" &&
    VOTER_ID.test(row.voterId) &&
    typeof row.filmId === "string" &&
    FILM_ID.test(row.filmId) &&
    isVoteDirection(row.direction)
  );
}

/** One row per voter and film. Later rows win. Invalid rows are dropped. */
export function parseVoteFile(value: unknown): StoredVote[] | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  if (!("votes" in value)) return null;
  const votes = (value as { votes: unknown }).votes;
  if (!Array.isArray(votes)) return null;
  const byKey = new Map<string, StoredVote>();
  for (const row of votes) {
    if (!isStoredVote(row)) continue;
    byKey.set(`${row.voterId}\n${row.filmId}`, row);
  }
  return [...byKey.values()];
}

export function applyVoteChoice(
  votes: StoredVote[],
  choice: { voterId: string; filmId: string; direction: VoteDirection | "none" },
): StoredVote[] {
  const next = votes.filter(
    (vote) => !(vote.voterId === choice.voterId && vote.filmId === choice.filmId),
  );
  if (choice.direction === "none") return next;
  next.push({
    voterId: choice.voterId,
    filmId: choice.filmId,
    direction: choice.direction,
  });
  return next;
}

export function scoreForFilm(votes: StoredVote[], filmId: string): number {
  let score = 0;
  for (const vote of votes) {
    if (vote.filmId !== filmId) continue;
    score += vote.direction === "up" ? 1 : -1;
  }
  return score;
}

export function scoresByFilm(votes: StoredVote[]): Record<string, number> {
  const scores: Record<string, number> = {};
  for (const vote of votes) {
    const delta = vote.direction === "up" ? 1 : -1;
    scores[vote.filmId] = (scores[vote.filmId] ?? 0) + delta;
  }
  return scores;
}
