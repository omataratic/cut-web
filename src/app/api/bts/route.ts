import { NextResponse } from "next/server";
import { BTS_FILM_ID } from "@/lib/bts";
import { creatorIdFromJson } from "@/lib/creator";
import { createSharedBts, listPublicBts } from "@/lib/github-bts";
import { isJsonRecord, readLimitedJson } from "@/lib/json-body";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BODY_BYTES = 8_000;

const MESSAGES = {
  notJson: "Enter an update.",
  tooLarge: "That request is too large. Nothing was published.",
  bad: "Enter an update.",
};

const POST_KEYS = new Set(["filmId", "creatorId", "body"]);

export async function GET(request: Request) {
  const filmId = new URL(request.url).searchParams.get("filmId") ?? "";
  if (!BTS_FILM_ID.test(filmId)) {
    return NextResponse.json({ error: "That project cannot be loaded." }, { status: 400 });
  }
  const posts = await listPublicBts(filmId);
  return NextResponse.json({ posts });
}

export async function POST(request: Request) {
  const parsed = await readLimitedJson(request, MAX_BODY_BYTES, MESSAGES);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: parsed.status });
  }
  if (!isJsonRecord(parsed.value)) {
    return NextResponse.json({ error: "Enter an update." }, { status: 400 });
  }
  const unknown = Object.keys(parsed.value).filter((key) => !POST_KEYS.has(key));
  if (unknown.length > 0) {
    return NextResponse.json(
      { error: "That field cannot be saved. Nothing was published." },
      { status: 400 },
    );
  }
  const filmId = parsed.value.filmId;
  const body = parsed.value.body;
  const result = await createSharedBts(
    typeof filmId === "string" ? filmId : "",
    creatorIdFromJson(parsed.value),
    typeof body === "string" ? body : "",
  );
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }
  return NextResponse.json({ post: result.post }, { status: 201 });
}
