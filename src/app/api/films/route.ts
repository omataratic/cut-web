import { NextResponse } from "next/server";
import { creatorIdFromJson } from "@/lib/creator";
import { createSharedSubmission, readSharedSubmissions } from "@/lib/github-films";
import { publicSubmission, type SubmissionInput } from "@/lib/submissions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const submissions = await readSharedSubmissions();
  return NextResponse.json({
    submissions: submissions.map(publicSubmission),
  });
}

export async function POST(request: Request) {
  let body: SubmissionInput;
  let creatorId = "";
  try {
    const json = (await request.json()) as Partial<SubmissionInput>;
    creatorId = creatorIdFromJson(json);
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

  const result = await createSharedSubmission(body, creatorId);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }
  const url = `/film/${result.submission.id}`;
  return NextResponse.json(
    { submission: publicSubmission(result.submission), url },
    { status: 201 },
  );
}
