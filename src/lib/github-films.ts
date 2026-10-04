import { cache } from "react";
import { readFile } from "node:fs/promises";
import path from "node:path";
import {
  CREATOR_KEY_INVALID,
  CREATOR_MISMATCH,
  CREATOR_UNOWNED,
  isCreatorId,
} from "@/lib/creator";
import { removeSharedVotesForFilm } from "@/lib/github-votes";
import {
  parseSubmissionList,
  SUBMISSION_ID,
  type Submission,
  type SubmissionInput,
  validateSubmissionInput,
} from "@/lib/submissions";

const REPO = "omataratic/cut-web";
const FILE_PATH = "data/submissions.json";
const MAX_SUBMISSIONS = 200;

type GithubFile =
  | { status: "missing" }
  | { status: "ok"; submissions: Submission[]; sha: string }
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

async function readBundledSubmissions(): Promise<Submission[]> {
  try {
    const raw = await readFile(
      path.join(process.cwd(), FILE_PATH),
      "utf8",
    );
    return parseSubmissionList(JSON.parse(raw) as unknown);
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
      submissions: parseSubmissionList(JSON.parse(json) as unknown),
      sha: data.sha,
    };
  } catch {
    return { status: "error" };
  }
}

export const readSharedSubmissions = cache(async (): Promise<Submission[]> => {
  const file = await readGithubFile(githubToken());
  if (file.status === "ok") return file.submissions;
  return readBundledSubmissions();
});

export async function createSharedSubmission(
  input: SubmissionInput,
  creatorId: string,
): Promise<
  | { ok: true; submission: Submission }
  | { ok: false; status: number; error: string }
> {
  const token = githubToken();
  if (!token) {
    return {
      ok: false,
      status: 503,
      error: "Shared save is not configured on this server.",
    };
  }
  if (!isCreatorId(creatorId)) {
    return { ok: false, status: 400, error: CREATOR_KEY_INVALID };
  }

  const validated = validateSubmissionInput(input);
  if (!validated.ok) return { ok: false, status: 400, error: validated.error };

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const current = await readGithubFile(token);
    if (current.status === "error") {
      return {
        ok: false,
        status: 503,
        error: "Could not read the film list. Try again.",
      };
    }

    const existing = current.status === "ok" ? current.submissions : [];
    if (existing.length >= MAX_SUBMISSIONS) {
      return { ok: false, status: 400, error: "The preview list is full." };
    }

    const submission: Submission = {
      title: validated.value.title,
      creator: validated.value.creator,
      synopsis: validated.value.synopsis,
      youtubeId: validated.value.youtubeId,
      goalUsd: validated.value.goalUsd,
      creatorId,
      id: `c-${crypto.randomUUID()}`,
      createdAt: new Date().toISOString(),
    };
    const content = Buffer.from(
      `${JSON.stringify([...existing, submission], null, 2)}\n`,
      "utf8",
    ).toString("base64");

    const response = await fetch(contentsUrl(), {
      method: "PUT",
      headers: {
        ...githubHeaders(token),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: "Add creator film preview",
        content,
        branch: "main",
        ...(current.status === "ok" ? { sha: current.sha } : {}),
      }),
    });

    if (response.status === 409) continue;
    if (!response.ok) {
      return {
        ok: false,
        status: 503,
        error: "Could not save this film for other visitors.",
      };
    }
    return { ok: true, submission };
  }

  return {
    ok: false,
    status: 503,
    error: "Could not save this film for other visitors.",
  };
}

export function sharedSaveConfigured(): boolean {
  return githubToken() !== null;
}

const EDIT_FAILED = "Could not save this edit. Nothing was changed.";
const DELETE_FAILED = "Could not remove this preview. Nothing was changed.";

function submissionRecord(row: Submission): Submission {
  return {
    id: row.id,
    title: row.title,
    creator: row.creator,
    synopsis: row.synopsis,
    youtubeId: row.youtubeId,
    goalUsd: row.goalUsd,
    createdAt: row.createdAt,
    ...(row.creatorId ? { creatorId: row.creatorId } : {}),
  };
}

function ownedRow(
  rows: Submission[],
  id: string,
  creatorId: string,
):
  | { ok: true; index: number; row: Submission }
  | { ok: false; status: number; error: string } {
  if (!isCreatorId(creatorId) || !SUBMISSION_ID.test(id)) {
    return { ok: false, status: 400, error: "That preview cannot be changed." };
  }
  const index = rows.findIndex((row) => row.id === id);
  if (index < 0) {
    return { ok: false, status: 404, error: "That preview is not on the list." };
  }
  const row = rows[index];
  if (!row.creatorId) return { ok: false, status: 403, error: CREATOR_UNOWNED };
  if (row.creatorId !== creatorId) {
    return { ok: false, status: 403, error: CREATOR_MISMATCH };
  }
  return { ok: true, index, row };
}

async function writeSubmissions(
  token: string,
  rows: Submission[],
  sha: string | null,
  message: string,
): Promise<boolean | "conflict"> {
  const content = Buffer.from(
    `${JSON.stringify(rows.map(submissionRecord), null, 2)}\n`,
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

export async function updateSharedSubmission(
  id: string,
  creatorId: string,
  input: SubmissionInput,
): Promise<
  | { ok: true; submission: Submission }
  | { ok: false; status: number; error: string }
> {
  const token = githubToken();
  if (!token) {
    return {
      ok: false,
      status: 503,
      error: "Shared save is not configured on this server.",
    };
  }
  const validated = validateSubmissionInput(input);
  if (!validated.ok) return { ok: false, status: 400, error: validated.error };

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const current = await readGithubFile(token);
    if (current.status === "error") {
      return {
        ok: false,
        status: 503,
        error: "Could not read the film list. Nothing was changed.",
      };
    }
    const existing = current.status === "ok" ? current.submissions : [];
    const owned = ownedRow(existing, id, creatorId);
    if (!owned.ok) return owned;

    const submission: Submission = {
      id: owned.row.id,
      title: validated.value.title,
      creator: validated.value.creator,
      synopsis: validated.value.synopsis,
      youtubeId: validated.value.youtubeId,
      goalUsd: validated.value.goalUsd,
      createdAt: owned.row.createdAt,
      creatorId: owned.row.creatorId,
    };
    const next = existing.slice();
    next[owned.index] = submission;
    const wrote = await writeSubmissions(
      token,
      next,
      current.status === "ok" ? current.sha : null,
      "Update creator film preview",
    );
    if (wrote === "conflict") continue;
    if (!wrote) return { ok: false, status: 503, error: EDIT_FAILED };
    return { ok: true, submission };
  }

  return { ok: false, status: 503, error: EDIT_FAILED };
}

export async function deleteSharedSubmission(
  id: string,
  creatorId: string,
): Promise<{ ok: true } | { ok: false; status: number; error: string }> {
  const token = githubToken();
  if (!token) {
    return {
      ok: false,
      status: 503,
      error: "Shared save is not configured on this server.",
    };
  }

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const current = await readGithubFile(token);
    if (current.status === "error") {
      return {
        ok: false,
        status: 503,
        error: "Could not read the film list. Nothing was changed.",
      };
    }
    const existing = current.status === "ok" ? current.submissions : [];
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
    const rows = fresh.status === "ok" ? fresh.submissions : [];
    const again = ownedRow(rows, id, creatorId);
    if (!again.ok) {
      if (again.status === 404) return { ok: true };
      return again;
    }
    const next = rows.filter((row) => row.id !== id);
    const wrote = await writeSubmissions(
      token,
      next,
      fresh.status === "ok" ? fresh.sha : null,
      "Remove creator film preview",
    );
    if (wrote === "conflict") continue;
    if (!wrote) return { ok: false, status: 503, error: DELETE_FAILED };
    return { ok: true };
  }

  return { ok: false, status: 503, error: DELETE_FAILED };
}
