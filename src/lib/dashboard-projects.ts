import { readLocalSubmissions, type Submission } from "@/lib/submissions";

export type PreviewProject = {
  kind: "preview";
  id: string;
  title: string;
  creator: string;
  synopsis: string;
  youtubeId: string;
  goalUsd: number;
  createdAt: string;
  localOnly: boolean;
};

export type FinishedProject = {
  kind: "finished";
  id: string;
  title: string;
  creator: string;
  synopsis: string;
  createdAt: string;
  localOnly: false;
};

export type DashboardProject = PreviewProject | FinishedProject;

type SharedPreview = Omit<PreviewProject, "kind" | "localOnly">;
type SharedFinished = Omit<FinishedProject, "kind" | "localOnly">;

function isSharedPreview(value: unknown): value is SharedPreview {
  if (!value || typeof value !== "object") return false;
  const row = value as Record<string, unknown>;
  return (
    typeof row.id === "string" &&
    typeof row.title === "string" &&
    typeof row.creator === "string" &&
    typeof row.synopsis === "string" &&
    typeof row.youtubeId === "string" &&
    typeof row.goalUsd === "number" &&
    typeof row.createdAt === "string"
  );
}

function isSharedFinished(value: unknown): value is SharedFinished {
  if (!value || typeof value !== "object") return false;
  const row = value as Record<string, unknown>;
  return (
    typeof row.id === "string" &&
    typeof row.title === "string" &&
    typeof row.creator === "string" &&
    typeof row.synopsis === "string" &&
    typeof row.createdAt === "string"
  );
}

function fromLocal(row: Submission): PreviewProject | null {
  if (!row.creatorId) return null;
  return {
    kind: "preview",
    id: row.id,
    title: row.title,
    creator: row.creator,
    synopsis: row.synopsis,
    youtubeId: row.youtubeId,
    goalUsd: row.goalUsd,
    createdAt: row.createdAt,
    localOnly: true,
  };
}

export async function loadDashboardProjects(
  creatorId: string,
): Promise<{ ok: true; projects: DashboardProject[] } | { ok: false; error: string }> {
  let previews: SharedPreview[] = [];
  let finished: SharedFinished[] = [];
  try {
    const response = await fetch("/api/dashboard", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
      body: JSON.stringify({ creatorId }),
    });
    const data = (await response.json()) as {
      error?: string;
      previews?: unknown;
      finished?: unknown;
    };
    if (!response.ok) {
      return { ok: false, error: data.error || "Could not load your projects." };
    }
    previews = Array.isArray(data.previews) ? data.previews.filter(isSharedPreview) : [];
    finished = Array.isArray(data.finished) ? data.finished.filter(isSharedFinished) : [];
  } catch {
    return { ok: false, error: "Could not load your projects." };
  }

  const byId = new Map<string, PreviewProject>();
  for (const row of readLocalSubmissions()) {
    if (row.creatorId !== creatorId) continue;
    const local = fromLocal(row);
    if (local) byId.set(local.id, local);
  }
  for (const row of previews) {
    byId.set(row.id, { ...row, kind: "preview", localOnly: false });
  }

  const projects: DashboardProject[] = [
    ...byId.values(),
    ...finished.map(
      (row): FinishedProject => ({ ...row, kind: "finished", localOnly: false }),
    ),
  ];
  projects.sort((a, b) => (a.createdAt < b.createdAt ? 1 : a.createdAt > b.createdAt ? -1 : 0));
  return { ok: true, projects };
}
