import { cache } from "react";
import { readFile } from "node:fs/promises";
import path from "node:path";
import {
  CREATOR_KEY_INVALID,
  CREATOR_MISMATCH,
  CREATOR_UNOWNED,
  isCreatorId,
} from "@/lib/creator";
import {
  FINISHED_ID,
  FINISHED_LIST_MAX,
  finishedRecord,
  parseFinishedList,
  validateFinishedInput,
  type FinishedFilm,
  type FinishedFilmInput,
} from "@/lib/finished";
import { removeSharedVotesForFilm } from "@/lib/github-votes";

const REPO = "omataratic/cut-web";
const FILE_PATH = "data/finished.json";

type GithubFile =
  | { status: "missing" }
  | { status: "ok"; films: FinishedFilm[]; sha: string }
  | { status: "error" };

function githubToken(): string | null {
  for (const key of ["CUT_GITHUB_TOKEN", "GITHUB_TOKEN", "GH_TOKEN"]) {
    const value = process.env[key];
    if (value && value.trim()) return value.trim();
  }
  return null;
}

function contentsUrl(): string {
  return `https://api.github.com/repos/${REPO}/contents/${FILE_PATH}`;
}

function githubHeaders(token: string | null): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "User-Agent": "cut-web",
    "X-GitHub-Api-Version": "2022-11-28",
  };
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

async function readBundledFinished(): Promise<FinishedFilm[]> {
  try {
    const raw = await readFile(path.join(process.cwd(), FILE_PATH), "utf8");
    return parseFinishedList(JSON.parse(raw) as unknown);
  } catch {
    return [];
  }
}

async function readGithubFile(token: string | null): Promise<GithubFile> {
  try {
    const response = await fetch(`${contentsUrl()}?ref=main`, {
      headers: githubHeaders(token),
      cache: "no-store",
    });
    if (response.status === 404) return { status: "missing" };
    if (!response.ok) return { status: "error" };
    const data = (await response.json()) as { content?: string; sha?: string };
    if (typeof data.content !== "string" || typeof data.sha !== "string") {
      return { status: "error" };
    }
    const json = Buffer.from(data.content.replace(/\n/g, ""), "base64").toString(
      "utf8",
    );
    return {
      status: "ok",
      films: parseFinishedList(JSON.parse(json) as unknown),
      sha: data.sha,
    };
  } catch {
    return { status: "error" };
  }
}

export const readSharedFinished = cache(async (): Promise<FinishedFilm[]> => {
  const file = await readGithubFile(githubToken());
  if (file.status === "ok") return file.films;
  return readBundledFinished();
});

export async function readSharedFinishedById(
  id: string,
): Promise<FinishedFilm | undefined> {
  const films = await readSharedFinished();
  return films.find((film) => film.id === id);
}

const SAVE_FAILED =
  "Could not save this finished film. It is not on the public list.";

export async function createSharedFinished(
  input: FinishedFilmInput,
  creatorId: string,
): Promise<
  | { ok: true; film: FinishedFilm }
  | { ok: false; status: number; error: string }
> {
  const token = githubToken();
  if (!token) {
    return {
      ok: false,
      status: 503,
      error: "Shared save is not configured on this server. Nothing was listed.",
    };
  }
  if (!isCreatorId(creatorId)) {
    return { ok: false, status: 400, error: CREATOR_KEY_INVALID };
  }

  const validated = validateFinishedInput(input);
  if (!validated.ok) return { ok: false, status: 400, error: validated.error };

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const current = await readGithubFile(token);
    if (current.status === "error") {
      return {
        ok: false,
        status: 503,
        error: "Could not read the finished-film list. Nothing was listed.",
      };
    }

    const existing = current.status === "ok" ? current.films : [];
    if (existing.length >= FINISHED_LIST_MAX) {
      return { ok: false, status: 400, error: "The finished-film list is full." };
    }

    const film: FinishedFilm = finishedRecord({
      title: validated.value.title,
      creator: validated.value.creator,
      synopsis: validated.value.synopsis,
      creatorId,
      id: `f-${crypto.randomUUID()}`,
      createdAt: new Date().toISOString(),
    });
    const content = Buffer.from(
      `${JSON.stringify([...existing.map(finishedRecord), film], null, 2)}\n`,
      "utf8",
    ).toString("base64");

    const response = await fetch(contentsUrl(), {
      method: "PUT",
      headers: {
        ...githubHeaders(token),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: "Add finished film listing",
        content,
        branch: "main",
        ...(current.status === "ok" ? { sha: current.sha } : {}),
      }),
    });

    if (response.status === 409) continue;
    if (!response.ok) {
      return { ok: false, status: 503, error: SAVE_FAILED };
    }
    return { ok: true, film };
  }

  return { ok: false, status: 503, error: SAVE_FAILED };
}

const EDIT_FAILED = "Could not save this edit. Nothing was changed.";
const DELETE_FAILED = "Could not remove this finished film. Nothing was changed.";

function ownedRow(
  rows: FinishedFilm[],
  id: string,
  creatorId: string,
):
  | { ok: true; index: number; row: FinishedFilm }
  | { ok: false; status: number; error: string } {
  if (!isCreatorId(creatorId) || !FINISHED_ID.test(id)) {
    return { ok: false, status: 400, error: "That finished film cannot be changed." };
  }
  const index = rows.findIndex((row) => row.id === id);
  if (index < 0) {
    return { ok: false, status: 404, error: "That finished film is not on the list." };
  }
  const row = rows[index];
  if (!row.creatorId) return { ok: false, status: 403, error: CREATOR_UNOWNED };
  if (row.creatorId !== creatorId) {
    return { ok: false, status: 403, error: CREATOR_MISMATCH };
  }
  return { ok: true, index, row };
}

async function writeFinished(
  token: string,
  rows: FinishedFilm[],
  sha: string | null,
  message: string,
): Promise<boolean | "conflict"> {
  const content = Buffer.from(
    `${JSON.stringify(rows.map(finishedRecord), null, 2)}\n`,
    "utf8",
  ).toString("base64");
  const response = await fetch(contentsUrl(), {
    method: "PUT",
    headers: {
      ...githubHeaders(token),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      message,
      content,
      branch: "main",
      ...(sha ? { sha } : {}),
    }),
  });
  if (response.status === 409) return "conflict";
  return response.ok;
}

export async function updateSharedFinished(
  id: string,
  creatorId: string,
  input: FinishedFilmInput,
): Promise<
  | { ok: true; film: FinishedFilm }
  | { ok: false; status: number; error: string }
> {
  const token = githubToken();
  if (!token) {
    return {
      ok: false,
      status: 503,
      error: "Shared save is not configured on this server. Nothing was changed.",
    };
  }
  const validated = validateFinishedInput(input);
  if (!validated.ok) return { ok: false, status: 400, error: validated.error };

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const current = await readGithubFile(token);
    if (current.status === "error") {
      return {
        ok: false,
        status: 503,
        error: "Could not read the finished-film list. Nothing was changed.",
      };
    }
    const existing = current.status === "ok" ? current.films : [];
    const owned = ownedRow(existing, id, creatorId);
    if (!owned.ok) return owned;
    const film = finishedRecord({
      id: owned.row.id,
      title: validated.value.title,
      creator: validated.value.creator,
      synopsis: validated.value.synopsis,
      createdAt: owned.row.createdAt,
      creatorId: owned.row.creatorId,
    });
    const next = existing.slice();
    next[owned.index] = film;
    const wrote = await writeFinished(
      token,
      next,
      current.status === "ok" ? current.sha : null,
      "Update finished film listing",
    );
    if (wrote === "conflict") continue;
    if (!wrote) return { ok: false, status: 503, error: EDIT_FAILED };
    return { ok: true, film };
  }

  return { ok: false, status: 503, error: EDIT_FAILED };
}

export async function deleteSharedFinished(
  id: string,
  creatorId: string,
): Promise<{ ok: true } | { ok: false; status: number; error: string }> {
  const token = githubToken();
  if (!token) {
    return {
      ok: false,
      status: 503,
      error: "Shared save is not configured on this server. Nothing was changed.",
    };
  }

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const current = await readGithubFile(token);
    if (current.status === "error") {
      return {
        ok: false,
        status: 503,
        error: "Could not read the finished-film list. Nothing was changed.",
      };
    }
    const existing = current.status === "ok" ? current.films : [];
    const owned = ownedRow(existing, id, creatorId);
    if (!owned.ok) return owned;

    const votes = await removeSharedVotesForFilm(id);
    if (!votes.ok) {
      return {
        ok: false,
        status: votes.status,
        error: "Could not remove this project's votes. The project was not removed.",
      };
    }

    const fresh = await readGithubFile(token);
    if (fresh.status === "error") {
      return { ok: false, status: 503, error: DELETE_FAILED };
    }
    const rows = fresh.status === "ok" ? fresh.films : [];
    const again = ownedRow(rows, id, creatorId);
    if (!again.ok) {
      if (again.status === 404) return { ok: true };
      return again;
    }
    const next = rows.filter((row) => row.id !== id);
    const wrote = await writeFinished(
      token,
      next,
      fresh.status === "ok" ? fresh.sha : null,
      "Remove finished film listing",
    );
    if (wrote === "conflict") continue;
    if (!wrote) return { ok: false, status: 503, error: DELETE_FAILED };
    return { ok: true };
  }

  return { ok: false, status: 503, error: DELETE_FAILED };
}
