import { cache } from "react";
import { readFile } from "node:fs/promises";
import path from "node:path";
import {
  BTS_FILM_ID,
  BTS_ID,
  BTS_PER_FILM_MAX,
  BTS_TOTAL_MAX,
  btsRecord,
  byNewest,
  parseBtsList,
  publicBtsPost,
  validateBtsBody,
  type BtsPost,
  type PublicBtsPost,
} from "@/lib/bts";
import {
  CREATOR_KEY_INVALID,
  CREATOR_MISMATCH,
  CREATOR_UNOWNED,
  isCreatorId,
} from "@/lib/creator";
import { readSharedFinished } from "@/lib/github-finished";
import { readSharedSubmissions } from "@/lib/github-films";

const REPO = "omataratic/cut-web";
const FILE_PATH = "data/bts.json";

type GithubFile =
  | { status: "missing" }
  | { status: "ok"; posts: BtsPost[]; sha: string }
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

async function readBundledPosts(): Promise<BtsPost[]> {
  try {
    const raw = await readFile(path.join(process.cwd(), FILE_PATH), "utf8");
    return parseBtsList(JSON.parse(raw) as unknown);
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
      posts: parseBtsList(JSON.parse(json) as unknown),
      sha: data.sha,
    };
  } catch {
    return { status: "error" };
  }
}

export const readSharedBts = cache(async (): Promise<BtsPost[]> => {
  const file = await readGithubFile(githubToken());
  if (file.status === "ok") return file.posts;
  return readBundledPosts();
});

export async function listPublicBts(filmId: string): Promise<PublicBtsPost[]> {
  if (!BTS_FILM_ID.test(filmId)) return [];
  const posts = await readSharedBts();
  return posts
    .filter((post) => post.filmId === filmId)
    .sort(byNewest)
    .map(publicBtsPost);
}

async function creatorOwnsFilm(
  filmId: string,
  creatorId: string,
): Promise<{ ok: true } | { ok: false; status: number; error: string }> {
  if (!isCreatorId(creatorId)) {
    return { ok: false, status: 400, error: CREATOR_KEY_INVALID };
  }
  if (!BTS_FILM_ID.test(filmId)) {
    return { ok: false, status: 400, error: "That project cannot take an update." };
  }
  const [submissions, finished] = await Promise.all([
    readSharedSubmissions(),
    readSharedFinished(),
  ]);
  const row =
    submissions.find((item) => item.id === filmId) ??
    finished.find((item) => item.id === filmId);
  if (!row) {
    return {
      ok: false,
      status: 404,
      error: "That project is not on the public list, so this update was not published.",
    };
  }
  if (!row.creatorId) return { ok: false, status: 403, error: CREATOR_UNOWNED };
  if (row.creatorId !== creatorId) {
    return { ok: false, status: 403, error: CREATOR_MISMATCH };
  }
  return { ok: true };
}

async function writePosts(
  token: string,
  rows: BtsPost[],
  sha: string | null,
  message: string,
): Promise<boolean | "conflict"> {
  const content = Buffer.from(
    `${JSON.stringify(rows.map(btsRecord), null, 2)}\n`,
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

const SAVE_FAILED = "Could not publish this update. Nothing was published.";
const DELETE_FAILED = "Could not remove this update. Nothing was changed.";

export async function createSharedBts(
  filmId: string,
  creatorId: string,
  rawBody: string,
): Promise<
  | { ok: true; post: PublicBtsPost }
  | { ok: false; status: number; error: string }
> {
  const token = githubToken();
  if (!token) {
    return {
      ok: false,
      status: 503,
      error: "Shared save is not configured on this server. Nothing was published.",
    };
  }
  const validated = validateBtsBody(rawBody);
  if (!validated.ok) return { ok: false, status: 400, error: validated.error };
  const owned = await creatorOwnsFilm(filmId, creatorId);
  if (!owned.ok) return owned;

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const current = await readGithubFile(token);
    if (current.status === "error") {
      return {
        ok: false,
        status: 503,
        error: "Could not read updates. Nothing was published.",
      };
    }
    const existing = current.status === "ok" ? current.posts : [];
    if (existing.length >= BTS_TOTAL_MAX) {
      return { ok: false, status: 400, error: "The update list is full." };
    }
    if (existing.filter((post) => post.filmId === filmId).length >= BTS_PER_FILM_MAX) {
      return {
        ok: false,
        status: 400,
        error: "This project already has 50 updates.",
      };
    }
    const post: BtsPost = {
      id: `b-${crypto.randomUUID()}`,
      filmId,
      creatorId,
      body: validated.body,
      createdAt: new Date().toISOString(),
    };
    const wrote = await writePosts(
      token,
      [...existing, post],
      current.status === "ok" ? current.sha : null,
      "Add behind-the-scenes update",
    );
    if (wrote === "conflict") continue;
    if (!wrote) return { ok: false, status: 503, error: SAVE_FAILED };
    return { ok: true, post: publicBtsPost(post) };
  }

  return { ok: false, status: 503, error: SAVE_FAILED };
}

export async function deleteSharedBts(
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
  if (!isCreatorId(creatorId) || !BTS_ID.test(id)) {
    return { ok: false, status: 400, error: "That update cannot be removed." };
  }

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const current = await readGithubFile(token);
    if (current.status === "error") {
      return {
        ok: false,
        status: 503,
        error: "Could not read updates. Nothing was changed.",
      };
    }
    const existing = current.status === "ok" ? current.posts : [];
    const row = existing.find((post) => post.id === id);
    if (!row) {
      return { ok: false, status: 404, error: "That update is not on the list." };
    }
    if (row.creatorId !== creatorId) {
      return { ok: false, status: 403, error: CREATOR_MISMATCH };
    }
    const wrote = await writePosts(
      token,
      existing.filter((post) => post.id !== id),
      current.status === "ok" ? current.sha : null,
      "Remove behind-the-scenes update",
    );
    if (wrote === "conflict") continue;
    if (!wrote) return { ok: false, status: 503, error: DELETE_FAILED };
    return { ok: true };
  }

  return { ok: false, status: 503, error: DELETE_FAILED };
}
