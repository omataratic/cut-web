import { cache } from "react";
import { readFile } from "node:fs/promises";
import path from "node:path";
import {
  FINISHED_LIST_MAX,
  parseFinishedList,
  validateFinishedInput,
  type FinishedFilm,
  type FinishedFilmInput,
} from "@/lib/finished";

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

    const film: FinishedFilm = {
      title: validated.value.title,
      creator: validated.value.creator,
      synopsis: validated.value.synopsis,
      id: `f-${crypto.randomUUID()}`,
      createdAt: new Date().toISOString(),
    };
    const content = Buffer.from(
      `${JSON.stringify([...existing, film], null, 2)}\n`,
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
