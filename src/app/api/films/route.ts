import { NextResponse } from "next/server";
import { createSharedSubmission, readSharedSubmissions } from "@/lib/github-films";
import type { SubmissionInput } from "@/lib/submissions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const submissions = await readSharedSubmissions();
  return NextResponse.json({ submissions });
}

export async function POST(request: Request) {
  let body: SubmissionInput;
  try {
    const json = (await request.json()) as Partial<SubmissionInput>;
    body = {
      title: typeof json.title === "string" ? json.title : "",
      creator: typeof json.creator === "string" ? json.creator : "",
      synopsis: typeof json.synopsis === "string" ? json.synopsis : "",
      youtubeUrl: typeof json.youtubeUrl === "string" ? json.youtubeUrl : "",
      goalUsd: typeof json.goalUsd === "string" ? json.goalUsd : String(json.goalUsd ?? ""),
    };
  } catch {
    return NextResponse.json({ error: "Enter the film details." }, { status: 400 });
  }

  const result = await createSharedSubmission(body);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }
  return NextResponse.json({ submission: result.submission }, { status: 201 });
}
