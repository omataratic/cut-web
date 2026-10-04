import { NextResponse } from "next/server";
import { creatorIdFromJson } from "@/lib/creator";
import { publicFinishedFilm, type FinishedFilmInput } from "@/lib/finished";
import { createSharedFinished, readSharedFinished } from "@/lib/github-finished";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BODY_BYTES = 8_000;

const FILE_REJECTED =
  "The movie file is not accepted. This site only saves the title, creator, and synopsis, and it does not keep or play the file.";

export async function GET() {
  const films = await readSharedFinished();
  return NextResponse.json({ films: films.map(publicFinishedFilm) });
}

function stringField(value: unknown): string {
  return typeof value === "string" ? value : "";
}

export async function POST(request: Request) {
  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.toLowerCase().includes("application/json")) {
    return NextResponse.json({ error: FILE_REJECTED }, { status: 400 });
  }

  const lengthHeader = request.headers.get("content-length");
  if (lengthHeader) {
    const length = Number(lengthHeader);
    if (!Number.isFinite(length) || length < 0 || length > MAX_BODY_BYTES) {
      return NextResponse.json(
        { error: "That listing is too large. Send only the title, creator, and synopsis." },
        { status: 413 },
      );
    }
  }

  let body: FinishedFilmInput;
  let creatorId = "";
  try {
    const reader = request.body?.getReader();
    if (!reader) {
      return NextResponse.json({ error: "Enter the film details." }, { status: 400 });
    }
    const chunks: Uint8Array[] = [];
    let total = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (!value) continue;
      total += value.byteLength;
      if (total > MAX_BODY_BYTES) {
        await reader.cancel();
        return NextResponse.json(
          { error: "That listing is too large. Send only the title, creator, and synopsis." },
          { status: 413 },
        );
      }
      chunks.push(value);
    }
    const text = new TextDecoder().decode(
      chunks.length === 1 ? chunks[0] : Buffer.concat(chunks),
    );
    const json = JSON.parse(text) as Partial<FinishedFilmInput>;
    creatorId = creatorIdFromJson(json);
    body = {
      title: stringField(json.title),
      creator: stringField(json.creator),
      synopsis: stringField(json.synopsis),
    };
  } catch {
    return NextResponse.json({ error: "Enter the film details." }, { status: 400 });
  }

  const result = await createSharedFinished(body, creatorId);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }
  return NextResponse.json(
    { film: publicFinishedFilm(result.film), url: `/finished/${result.film.id}` },
    { status: 201 },
  );
}
