import { cache } from "react";
import { readFile } from "node:fs/promises";
import path from "node:path";
import {
  applyVoteChoice,
  FILM_ID,
  MAX_VOTES,
  parseVoteFile,
  scoreForFilm,
  scoresByFilm,
  VOTER_ID,
  type StoredVote,
  type VoteDirection,
} from "@/lib/votes";

const REPO = "omataratic/cut-web";
const FILE_PATH = "data/votes.json";

type GithubVotes =
  | { status: "missing" }
  | { status: "ok"; votes: StoredVote[]; sha: string }
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

async function readBundledVotes(): Promise<StoredVote[]> {
  try {
    const raw = await readFile(path.join(process.cwd(), FILE_PATH), "utf8");
    return parseVoteFile(JSON.parse(raw) as unknown) ?? [];
  } catch {
    return [];
  }
}

async function readGithubVotes(token: string | null): Promise<GithubVotes> {
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
    const votes = parseVoteFile(JSON.parse(json) as unknown);
    if (!votes) return { status: "error" };
    return { status: "ok", votes, sha: data.sha };
  } catch {
    return { status: "error" };
  }
}

export const readSharedVotes = cache(async (): Promise<StoredVote[]> => {
  const file = await readGithubVotes(githubToken());
  if (file.status === "ok") return file.votes;
  if (file.status === "missing") return readBundledVotes();
  return readBundledVotes();
});

export async function readVoteScores(): Promise<Record<string, number>> {
  return scoresByFilm(await readSharedVotes());
}

export type VoteChoice = {
  voterId: string;
  filmId: string;
  direction: VoteDirection | "none";
};

export async function castSharedVote(
  choice: VoteChoice,
): Promise<
  | { ok: true; filmId: string; direction: VoteDirection | "none"; score: number }
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

  if (!VOTER_ID.test(choice.voterId) || !FILM_ID.test(choice.filmId)) {
    return { ok: false, status: 400, error: "That film cannot be voted on." };
  }
  if (
    choice.direction !== "up" &&
    choice.direction !== "down" &&
    choice.direction !== "none"
  ) {
    return { ok: false, status: 400, error: "That film cannot be voted on." };
  }

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const current = await readGithubVotes(token);
    if (current.status === "error") {
      return {
        ok: false,
        status: 503,
        error: "Could not save this vote for other visitors.",
      };
    }

    const existing = current.status === "ok" ? current.votes : [];
    const alreadyVote = existing.find(
      (vote) => vote.voterId === choice.voterId && vote.filmId === choice.filmId,
    );
    if (
      (choice.direction === "none" && !alreadyVote) ||
      alreadyVote?.direction === choice.direction
    ) {
      return {
        ok: true,
        filmId: choice.filmId,
        direction: choice.direction,
        score: scoreForFilm(existing, choice.filmId),
      };
    }
    const next = applyVoteChoice(existing, choice);
    const already = Boolean(alreadyVote);
    if (!already && choice.direction !== "none" && next.length > MAX_VOTES) {
      return { ok: false, status: 400, error: "The vote list is full." };
    }

    const content = Buffer.from(
      `${JSON.stringify({ votes: next }, null, 2)}\n`,
      "utf8",
    ).toString("base64");

    const response = await fetch(contentsUrl(), {
      method: "PUT",
      headers: {
        ...githubHeaders(token),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: "Update film votes",
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
        error: "Could not save this vote for other visitors.",
      };
    }

    return {
      ok: true,
      filmId: choice.filmId,
      direction: choice.direction,
      score: scoreForFilm(next, choice.filmId),
    };
  }

  return {
    ok: false,
    status: 503,
    error: "Could not save this vote for other visitors.",
  };
}

/**
 * Drop vote rows for one film id. Does not write the file when none match.
 */
export async function removeSharedVotesForFilm(
  filmId: string,
): Promise<{ ok: true; removed: number } | { ok: false; status: number; error: string }> {
  const token = githubToken();
  if (!token) {
    return {
      ok: false,
      status: 503,
      error: "Shared save is not configured on this server.",
    };
  }
  if (!filmId) {
    return { ok: false, status: 400, error: "That project cannot be removed." };
  }

  for (let attempt = 0; attempt < 3; attempt += 1) {
    let sha = "";
    let votes: unknown[] = [];
    try {
      const response = await fetch(`${contentsUrl()}?ref=main`, {
        headers: githubHeaders(token),
        cache: "no-store",
      });
      if (response.status === 404) return { ok: true, removed: 0 };
      if (!response.ok) {
        return {
          ok: false,
          status: 503,
          error: "Could not read votes for this project. Nothing was removed.",
        };
      }
      const data = (await response.json()) as { content?: string; sha?: string };
      if (typeof data.content !== "string" || typeof data.sha !== "string") {
        return {
          ok: false,
          status: 503,
          error: "Could not read votes for this project. Nothing was removed.",
        };
      }
      sha = data.sha;
      const json = Buffer.from(data.content.replace(/\n/g, ""), "base64").toString(
        "utf8",
      );
      const parsed = JSON.parse(json) as unknown;
      if (
        !parsed ||
        typeof parsed !== "object" ||
        Array.isArray(parsed) ||
        !("votes" in parsed) ||
        !Array.isArray((parsed as { votes: unknown }).votes)
      ) {
        return {
          ok: false,
          status: 503,
          error: "Could not read votes for this project. Nothing was removed.",
        };
      }
      votes = (parsed as { votes: unknown[] }).votes;
    } catch {
      return {
        ok: false,
        status: 503,
        error: "Could not read votes for this project. Nothing was removed.",
      };
    }

    const next = votes.filter((row) => {
      if (!row || typeof row !== "object") return true;
      return (row as { filmId?: unknown }).filmId !== filmId;
    });
    if (next.length === votes.length) return { ok: true, removed: 0 };

    const content = Buffer.from(
      `${JSON.stringify({ votes: next }, null, 2)}\n`,
      "utf8",
    ).toString("base64");
    const response = await fetch(contentsUrl(), {
      method: "PUT",
      headers: {
        ...githubHeaders(token),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: "Remove votes for a deleted film",
        content,
        branch: "main",
        sha,
      }),
    });
    if (response.status === 409) continue;
    if (!response.ok) {
      return {
        ok: false,
        status: 503,
        error: "Could not remove votes for this project. The project was not removed.",
      };
    }
    return { ok: true, removed: votes.length - next.length };
  }

  return {
    ok: false,
    status: 503,
    error: "Could not remove votes for this project. The project was not removed.",
  };
}
