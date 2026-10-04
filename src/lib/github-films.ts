import { cache } from "react";
import { readFile } from "node:fs/promises";
import path from "node:path";
import {
  parseSubmissionList,
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
        error: "Could not read the film list. Try again.",
      };
    }

    const existing = current.status === "ok" ? current.submissions : [];
    if (existing.length >= MAX_SUBMISSIONS) {
      return { ok: false, status: 400, error: "The preview list is full." };
    }

    const submission: Submission = {
      ...validated.value,
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
