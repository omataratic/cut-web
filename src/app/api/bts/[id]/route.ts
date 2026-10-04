import { NextResponse } from "next/server";
import { creatorIdFromJson } from "@/lib/creator";
import { deleteSharedBts } from "@/lib/github-bts";
import { isJsonRecord, readLimitedJson } from "@/lib/json-body";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BODY_BYTES = 2_000;

const MESSAGES = {
  notJson: "Enter the creator id from this browser.",
  tooLarge: "That request is too large. Nothing was changed.",
  bad: "Enter the creator id from this browser.",
};

type RouteContext = { params: Promise<{ id: string }> };

export async function DELETE(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const parsed = await readLimitedJson(request, MAX_BODY_BYTES, MESSAGES);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: parsed.status });
  }
  if (!isJsonRecord(parsed.value)) {
    return NextResponse.json(
      { error: "Enter the creator id from this browser." },
      { status: 400 },
    );
  }
  const unknown = Object.keys(parsed.value).filter((key) => key !== "creatorId");
  if (unknown.length > 0) {
    return NextResponse.json(
      { error: "That field cannot be saved. Nothing was changed." },
      { status: 400 },
    );
  }
  const result = await deleteSharedBts(id, creatorIdFromJson(parsed.value));
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }
  return NextResponse.json({ ok: true });
}
