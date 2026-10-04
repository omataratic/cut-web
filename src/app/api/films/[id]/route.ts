import { NextResponse } from "next/server";
import { creatorIdFromJson } from "@/lib/creator";
import {
  deleteSharedSubmission,
  updateSharedSubmission,
} from "@/lib/github-films";
import { isJsonRecord, readLimitedJson } from "@/lib/json-body";
import { publicSubmission, type SubmissionInput } from "@/lib/submissions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BODY_BYTES = 16_000;

const MESSAGES = {
  notJson: "Enter the film details.",
  tooLarge: "That request is too large. Nothing was changed.",
  bad: "Enter the film details.",
};

const EDIT_KEYS = new Set([
  "creatorId",
  "title",
  "creator",
  "synopsis",
  "youtubeUrl",
  "goalUsd",
]);

type RouteContext = { params: Promise<{ id: string }> };

function submissionInput(json: Record<string, unknown>): SubmissionInput {
  const goal = json.goalUsd;
  return {
    title: typeof json.title === "string" ? json.title : "",
    creator: typeof json.creator === "string" ? json.creator : "",
    synopsis: typeof json.synopsis === "string" ? json.synopsis : "",
    youtubeUrl: typeof json.youtubeUrl === "string" ? json.youtubeUrl : "",
    goalUsd: typeof goal === "string" ? goal : typeof goal === "number" ? String(goal) : "",
  };
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
  const unknown = Object.keys(parsed.value).filter((key) => !EDIT_KEYS.has(key));
  if (unknown.length > 0) {
    return NextResponse.json(
      { error: "That field cannot be saved. Nothing was changed." },
      { status: 400 },
    );
  }

  const result = await updateSharedSubmission(
    id,
    creatorIdFromJson(parsed.value),
    submissionInput(parsed.value),
  );
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }
  return NextResponse.json({ submission: publicSubmission(result.submission) });
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
  const unknown = Object.keys(parsed.value).filter((key) => key !== "creatorId");
  if (unknown.length > 0) {
    return NextResponse.json(
      { error: "That field cannot be saved. Nothing was changed." },
      { status: 400 },
    );
  }

  const result = await deleteSharedSubmission(id, creatorIdFromJson(parsed.value));
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }
  return NextResponse.json({ ok: true });
}
