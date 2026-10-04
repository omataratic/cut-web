import type { Film } from "@/lib/mock-films";
import {
  CREATOR_KEY_INVALID,
  CREATOR_MISMATCH,
  CREATOR_UNOWNED,
  isCreatorId,
} from "@/lib/creator";
import { youtubeIdFromLink } from "@/lib/youtube";

export type Submission = {
  id: string;
  title: string;
  creator: string;
  synopsis: string;
  youtubeId: string;
  goalUsd: number;
  createdAt: string;
  /** Browser creator id. Absent on older public rows. */
  creatorId?: string;
};

export const SUBMISSION_ID = /^c-[0-9a-f-]{36}$/i;

export type SubmissionInput = {
  title: string;
  creator: string;
  synopsis: string;
  youtubeUrl: string;
  goalUsd: string;
};

const STORAGE_KEY = "cut:films";
const TITLE_MAX = 120;
const CREATOR_MAX = 80;
const SYNOPSIS_MAX = 600;
const GOAL_MAX = 100_000_000;

export const YOUTUBE_LINK_ERROR =
  "That is not a YouTube preview link. Use a watch, youtu.be, shorts, or embed link.";

export function submissionToFilm(submission: Submission): Film {
  return {
    id: submission.id,
    title: submission.title,
    director: submission.creator,
    upvotes: 0,
    fundedPercent: 0,
    raisedUsd: 0,
    goalUsd: submission.goalUsd,
    pledges: 0,
    ownerWallet: "0x0000000000000000000000000000000000000000",
    synopsis: submission.synopsis,
    youtubeId: submission.youtubeId,
    createdAt: submission.createdAt,
  };
}

function cleanText(value: string): string {
  return value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "").trim();
}

export function parseGoalUsd(raw: string): number | null {
  const trimmed = raw.trim();
  if (!/^\d+(\.\d{1,2})?$/.test(trimmed)) return null;
  const value = Number(trimmed);
  if (!Number.isFinite(value) || value <= 0 || value > GOAL_MAX) return null;
  return value;
}

export function validateSubmissionInput(
  input: SubmissionInput,
): { ok: true; value: Omit<Submission, "id" | "createdAt"> } | { ok: false; error: string } {
  const title = cleanText(input.title ?? "");
  const creator = cleanText(input.creator ?? "");
  const synopsis = cleanText(input.synopsis ?? "");
  const youtubeId = youtubeIdFromLink(input.youtubeUrl ?? "");
  const goalUsd = parseGoalUsd(input.goalUsd ?? "");

  if (!title) return { ok: false, error: "Enter a film title." };
  if (title.length > TITLE_MAX) {
    return { ok: false, error: `Keep the title to ${TITLE_MAX} characters.` };
  }
  if (!creator) return { ok: false, error: "Enter the creator's name." };
  if (creator.length > CREATOR_MAX) {
    return { ok: false, error: `Keep the creator name to ${CREATOR_MAX} characters.` };
  }
  if (!synopsis) return { ok: false, error: "Enter a short synopsis." };
  if (synopsis.length > SYNOPSIS_MAX) {
    return { ok: false, error: `Keep the synopsis to ${SYNOPSIS_MAX} characters.` };
  }
  if (!youtubeId) return { ok: false, error: YOUTUBE_LINK_ERROR };
  if (goalUsd === null) {
    return {
      ok: false,
      error: "Enter a funding goal in US dollars, greater than zero.",
    };
  }

  return {
    ok: true,
    value: { title, creator, synopsis, youtubeId, goalUsd },
  };
}

export function isSubmission(value: unknown): value is Submission {
  if (!value || typeof value !== "object") return false;
  const row = value as Record<string, unknown>;
  if ("creatorId" in row && !isCreatorId(row.creatorId)) return false;
  return (
    typeof row.id === "string" &&
    SUBMISSION_ID.test(row.id) &&
    typeof row.title === "string" &&
    row.title.length > 0 &&
    row.title.length <= TITLE_MAX &&
    typeof row.creator === "string" &&
    row.creator.length > 0 &&
    row.creator.length <= CREATOR_MAX &&
    typeof row.synopsis === "string" &&
    row.synopsis.length > 0 &&
    row.synopsis.length <= SYNOPSIS_MAX &&
    typeof row.youtubeId === "string" &&
    /^[A-Za-z0-9_-]{11}$/.test(row.youtubeId) &&
    typeof row.goalUsd === "number" &&
    Number.isFinite(row.goalUsd) &&
    row.goalUsd > 0 &&
    row.goalUsd <= GOAL_MAX &&
    typeof row.createdAt === "string"
  );
}

export function parseSubmissionList(value: unknown): Submission[] {
  if (!Array.isArray(value)) return [];
  return value.filter(isSubmission);
}

function canUseStorage(): boolean {
  return typeof window !== "undefined" && typeof localStorage !== "undefined";
}

export function readLocalSubmissions(): Submission[] {
  if (!canUseStorage()) return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return parseSubmissionList(JSON.parse(raw) as unknown);
  } catch {
    return [];
  }
}

export function readLocalSubmission(id: string): Submission | undefined {
  return readLocalSubmissions().find((submission) => submission.id === id);
}

const filmByIdCache = new Map<string, { raw: string; film: Film | null }>();

/** Stable snapshot for useSyncExternalStore. Same storage string returns the same object. */
export function getLocalFilmByIdSnapshot(id: string): Film | null {
  if (!canUseStorage()) return null;
  const raw = localStorage.getItem(STORAGE_KEY) ?? "";
  const hit = filmByIdCache.get(id);
  if (hit && hit.raw === raw) return hit.film;
  let film: Film | null = null;
  try {
    const submission = parseSubmissionList(JSON.parse(raw) as unknown).find(
      (item) => item.id === id,
    );
    film = submission ? submissionToFilm(submission) : null;
  } catch {
    film = null;
  }
  filmByIdCache.set(id, { raw, film });
  return film;
}

export function saveLocalSubmission(
  value: Omit<Submission, "id" | "createdAt" | "creatorId"> & { creatorId: string },
): Submission {
  if (!canUseStorage()) {
    throw new Error("This browser cannot store a film preview.");
  }
  if (!isCreatorId(value.creatorId)) {
    throw new Error(CREATOR_KEY_INVALID);
  }
  const submission: Submission = {
    title: value.title,
    creator: value.creator,
    synopsis: value.synopsis,
    youtubeId: value.youtubeId,
    goalUsd: value.goalUsd,
    creatorId: value.creatorId,
    id: `c-${crypto.randomUUID()}`,
    createdAt: new Date().toISOString(),
  };
  const next = [...readLocalSubmissions(), submission];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  window.dispatchEvent(new Event("cut-films"));
  return submission;
}


export function publicSubmission(
  submission: Submission,
): Omit<Submission, "creatorId"> {
  return {
    id: submission.id,
    title: submission.title,
    creator: submission.creator,
    synopsis: submission.synopsis,
    youtubeId: submission.youtubeId,
    goalUsd: submission.goalUsd,
    createdAt: submission.createdAt,
  };
}

export function updateLocalSubmission(
  id: string,
  creatorId: string,
  value: Omit<Submission, "id" | "createdAt" | "creatorId">,
): { ok: true; submission: Submission } | { ok: false; error: string } {
  if (!canUseStorage()) {
    return { ok: false, error: "This browser cannot store a film preview." };
  }
  if (!isCreatorId(creatorId)) return { ok: false, error: CREATOR_KEY_INVALID };
  const rows = readLocalSubmissions();
  const index = rows.findIndex((row) => row.id === id);
  if (index < 0) return { ok: false, error: "That preview is not in this browser." };
  const row = rows[index];
  if (!row.creatorId) return { ok: false, error: CREATOR_UNOWNED };
  if (row.creatorId !== creatorId) return { ok: false, error: CREATOR_MISMATCH };
  const updated: Submission = {
    id: row.id,
    title: value.title,
    creator: value.creator,
    synopsis: value.synopsis,
    youtubeId: value.youtubeId,
    goalUsd: value.goalUsd,
    createdAt: row.createdAt,
    creatorId: row.creatorId,
  };
  const next = rows.slice();
  next[index] = updated;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  window.dispatchEvent(new Event("cut-films"));
  return { ok: true, submission: updated };
}

export function deleteLocalSubmission(
  id: string,
  creatorId: string,
): { ok: true } | { ok: false; error: string } {
  if (!canUseStorage()) {
    return { ok: false, error: "This browser cannot store a film preview." };
  }
  if (!isCreatorId(creatorId)) return { ok: false, error: CREATOR_KEY_INVALID };
  const rows = readLocalSubmissions();
  const index = rows.findIndex((row) => row.id === id);
  if (index < 0) return { ok: true };
  const row = rows[index];
  if (!row.creatorId) return { ok: false, error: CREATOR_UNOWNED };
  if (row.creatorId !== creatorId) return { ok: false, error: CREATOR_MISMATCH };
  const next = rows.filter((item) => item.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  window.dispatchEvent(new Event("cut-films"));
  return { ok: true };
}

const localListeners = new Set<() => void>();
let localCache: { raw: string; films: Film[] } = { raw: "", films: [] };
const emptyFilms: Film[] = [];

function localSnapshot(): Film[] {
  if (!canUseStorage()) return emptyFilms;
  const raw = localStorage.getItem(STORAGE_KEY) ?? "";
  if (localCache.raw === raw) return localCache.films;
  let films: Film[] = [];
  try {
    films = parseSubmissionList(JSON.parse(raw) as unknown)
      .map(submissionToFilm)
      .reverse();
  } catch {
    films = [];
  }
  localCache = { raw, films };
  return films;
}

export function subscribeLocalFilms(onStoreChange: () => void): () => void {
  localListeners.add(onStoreChange);
  const notify = () => onStoreChange();
  window.addEventListener("storage", notify);
  window.addEventListener("cut-films", notify);
  return () => {
    localListeners.delete(onStoreChange);
    window.removeEventListener("storage", notify);
    window.removeEventListener("cut-films", notify);
  };
}

export function getLocalFilmsSnapshot(): Film[] {
  return localSnapshot();
}

export function getLocalFilmsServerSnapshot(): Film[] {
  return emptyFilms;
}
