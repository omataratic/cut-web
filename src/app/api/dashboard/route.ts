import { NextResponse } from "next/server";
import { creatorIdFromJson, CREATOR_KEY_INVALID, isCreatorId } from "@/lib/creator";
import { publicFinishedFilm } from "@/lib/finished";
import { readSharedFinished } from "@/lib/github-finished";
import { readSharedSubmissions } from "@/lib/github-films";
import { isJsonRecord, readLimitedJson } from "@/lib/json-body";
import { publicSubmission } from "@/lib/submissions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MESSAGES = {
  notJson: "Enter the creator id from this browser.",
  tooLarge: "That request is too large.",
  bad: "Enter the creator id from this browser.",
};

export async function POST(request: Request) {
  const parsed = await readLimitedJson(request, 2_000, MESSAGES);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: parsed.status });
  }
  if (!isJsonRecord(parsed.value)) {
    return NextResponse.json({ error: CREATOR_KEY_INVALID }, { status: 400 });
  }
  const creatorId = creatorIdFromJson(parsed.value);
  if (!isCreatorId(creatorId)) {
    return NextResponse.json({ error: CREATOR_KEY_INVALID }, { status: 400 });
  }
  if (Object.keys(parsed.value).some((key) => key !== "creatorId")) {
    return NextResponse.json(
      { error: "That field cannot be saved." },
      { status: 400 },
    );
  }

  const [submissions, films] = await Promise.all([
    readSharedSubmissions(),
    readSharedFinished(),
  ]);

  return NextResponse.json({
    previews: submissions
      .filter((row) => row.creatorId === creatorId)
      .map(publicSubmission),
    finished: films.filter((row) => row.creatorId === creatorId).map(publicFinishedFilm),
  });
}
