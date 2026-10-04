import { NextResponse } from "next/server";
import { creatorIdFromJson } from "@/lib/creator";
import type { FinishedFilmInput } from "@/lib/finished";
import { publicFinishedFilm } from "@/lib/finished";
import {
  deleteSharedFinished,
  updateSharedFinished,
} from "@/lib/github-finished";
import { isJsonRecord, readLimitedJson } from "@/lib/json-body";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BODY_BYTES = 8_000;

const FILE_REJECTED =
  "The movie file is not accepted. This site only saves the title, creator, and synopsis, and it does not keep or play the file.";

const VIDEO_REJECTED =
  "A finished film cannot be turned into a public video. Nothing was changed.";

const MESSAGES = {
  notJson: FILE_REJECTED,
  tooLarge: "That listing is too large. Send only the title, creator, and synopsis.",
  bad: "Enter the film details.",
};

const EDIT_KEYS = new Set(["creatorId", "title", "creator", "synopsis"]);

const MEDIA_KEYS = new Set([
  "youtubeUrl",
  "youtubeId",
  "video",
  "videoUrl",
  "url",
  "file",
  "src",
  "playback",
  "stream",
  "mp4",
  "goalUsd",
]);

type RouteContext = { params: Promise<{ id: string }> };

function finishedInput(json: Record<string, unknown>): FinishedFilmInput {
  return {
    title: typeof json.title === "string" ? json.title : "",
    creator: typeof json.creator === "string" ? json.creator : "",
    synopsis: typeof json.synopsis === "string" ? json.synopsis : "",
  };
}

function rejectExtra(json: Record<string, unknown>, allowed: Set<string>) {
  const keys = Object.keys(json);
  if (keys.some((key) => MEDIA_KEYS.has(key))) {
    return NextResponse.json({ error: VIDEO_REJECTED }, { status: 400 });
  }
  if (keys.some((key) => !allowed.has(key))) {
    return NextResponse.json(
      { error: "That field cannot be saved. Nothing was changed." },
      { status: 400 },
    );
  }
  return null;
}

export async function PATCH(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const parsed = await readLimitedJson(request, MAX_BODY_BYTES, MESSAGES);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: parsed.status });
  }
  if (!isJsonRecord(parsed.value)) {
    return NextResponse.json({ error: "Enter the film details." }, { status: 400 });
  }
  const rejected = rejectExtra(parsed.value, EDIT_KEYS);
  if (rejected) return rejected;

  const result = await updateSharedFinished(
    id,
    creatorIdFromJson(parsed.value),
    finishedInput(parsed.value),
  );
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }
  return NextResponse.json({ film: publicFinishedFilm(result.film) });
}

export async function DELETE(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const parsed = await readLimitedJson(request, MAX_BODY_BYTES, MESSAGES);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: parsed.status });
  }
  if (!isJsonRecord(parsed.value)) {
    return NextResponse.json({ error: "Enter the film details." }, { status: 400 });
  }
  const rejected = rejectExtra(parsed.value, new Set(["creatorId"]));
  if (rejected) return rejected;

  const result = await deleteSharedFinished(id, creatorIdFromJson(parsed.value));
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }
  return NextResponse.json({ ok: true });
}
