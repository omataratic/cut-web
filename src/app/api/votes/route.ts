import { NextResponse } from "next/server";
import { castSharedVote, readSharedVotes } from "@/lib/github-votes";
import {
  FILM_ID,
  scoreForFilm,
  scoresByFilm,
  VOTER_ID,
  type VoteDirection,
} from "@/lib/votes";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const votes = await readSharedVotes();
  const filmId = new URL(request.url).searchParams.get("filmId");
  if (filmId) {
    if (!FILM_ID.test(filmId)) {
      return NextResponse.json(
        { error: "That film cannot be voted on." },
        { status: 400 },
      );
    }
    return NextResponse.json({ filmId, score: scoreForFilm(votes, filmId) });
  }
  return NextResponse.json({ scores: scoresByFilm(votes) });
}

export async function POST(request: Request) {
  let voterId = "";
  let filmId = "";
  let direction: VoteDirection | "none" = "none";
  try {
    const json = (await request.json()) as {
      voterId?: unknown;
      filmId?: unknown;
      direction?: unknown;
    };
    voterId = typeof json.voterId === "string" ? json.voterId : "";
    filmId = typeof json.filmId === "string" ? json.filmId : "";
    if (json.direction === "up" || json.direction === "down" || json.direction === "none") {
      direction = json.direction;
    } else {
      return NextResponse.json(
        { error: "That film cannot be voted on." },
        { status: 400 },
      );
    }
  } catch {
    return NextResponse.json({ error: "That film cannot be voted on." }, { status: 400 });
  }

  if (!VOTER_ID.test(voterId) || !FILM_ID.test(filmId)) {
    return NextResponse.json(
      { error: "That film cannot be voted on." },
      { status: 400 },
    );
  }

  const result = await castSharedVote({ voterId, filmId, direction });
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }
  return NextResponse.json({
    filmId: result.filmId,
    direction: result.direction,
    score: result.score,
  });
}
