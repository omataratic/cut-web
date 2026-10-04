import {
  FILM_ID,
  VOTER_ID,
  type VoteDirection,
  isVoteDirection,
} from "@/lib/votes";

const VOTER_KEY = "cut:voter";
const BALLOT_KEY = "cut:ballot";

export type Ballot = Record<string, VoteDirection>;

const emptyBallot: Ballot = {};
let cache: { raw: string; ballot: Ballot } = { raw: "", ballot: emptyBallot };

function canUseStorage(): boolean {
  return typeof window !== "undefined" && typeof localStorage !== "undefined";
}

export function getOrCreateVoterId(): string {
  if (!canUseStorage()) {
    throw new Error("This browser cannot store a vote.");
  }
  const existing = localStorage.getItem(VOTER_KEY);
  if (existing && VOTER_ID.test(existing)) return existing;
  const created = `v-${crypto.randomUUID()}`;
  localStorage.setItem(VOTER_KEY, created);
  return created;
}

function parseBallot(raw: string): Ballot {
  if (!raw) return emptyBallot;
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return emptyBallot;
    }
    const ballot: Ballot = {};
    for (const [filmId, direction] of Object.entries(parsed)) {
      if (FILM_ID.test(filmId) && isVoteDirection(direction)) {
        ballot[filmId] = direction;
      }
    }
    return ballot;
  } catch {
    return emptyBallot;
  }
}

export function getBallotSnapshot(): Ballot {
  if (!canUseStorage()) return emptyBallot;
  const raw = localStorage.getItem(BALLOT_KEY) ?? "";
  if (cache.raw === raw) return cache.ballot;
  const ballot = parseBallot(raw);
  cache = { raw, ballot };
  return ballot;
}

export function getBallotServerSnapshot(): Ballot {
  return emptyBallot;
}

export function writeBallot(ballot: Ballot): void {
  if (!canUseStorage()) return;
  const raw = JSON.stringify(ballot);
  localStorage.setItem(BALLOT_KEY, raw);
  cache = { raw, ballot };
  window.dispatchEvent(new Event("cut-ballot"));
}

export function subscribeBallot(onStoreChange: () => void): () => void {
  const notify = () => onStoreChange();
  window.addEventListener("storage", notify);
  window.addEventListener("cut-ballot", notify);
  return () => {
    window.removeEventListener("storage", notify);
    window.removeEventListener("cut-ballot", notify);
  };
}
