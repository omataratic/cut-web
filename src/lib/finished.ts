export type FinishedFilm = {
  id: string;
  title: string;
  creator: string;
  synopsis: string;
  createdAt: string;
};

export type FinishedFilmInput = {
  title: string;
  creator: string;
  synopsis: string;
};

export const FINISHED_TITLE_MAX = 120;
export const FINISHED_CREATOR_MAX = 80;
export const FINISHED_SYNOPSIS_MAX = 600;
export const FINISHED_LIST_MAX = 100;

function cleanText(value: string): string {
  return value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "").trim();
}

export function validateFinishedInput(
  input: FinishedFilmInput,
): { ok: true; value: Omit<FinishedFilm, "id" | "createdAt"> } | { ok: false; error: string } {
  const title = cleanText(input.title ?? "");
  const creator = cleanText(input.creator ?? "");
  const synopsis = cleanText(input.synopsis ?? "");

  if (!title) return { ok: false, error: "Enter a film title." };
  if (title.length > FINISHED_TITLE_MAX) {
    return { ok: false, error: `Keep the title to ${FINISHED_TITLE_MAX} characters.` };
  }
  if (!creator) return { ok: false, error: "Enter the creator's name." };
  if (creator.length > FINISHED_CREATOR_MAX) {
    return {
      ok: false,
      error: `Keep the creator name to ${FINISHED_CREATOR_MAX} characters.`,
    };
  }
  if (!synopsis) return { ok: false, error: "Enter a short synopsis." };
  if (synopsis.length > FINISHED_SYNOPSIS_MAX) {
    return {
      ok: false,
      error: `Keep the synopsis to ${FINISHED_SYNOPSIS_MAX} characters.`,
    };
  }

  return { ok: true, value: { title, creator, synopsis } };
}

export function isFinishedFilm(value: unknown): value is FinishedFilm {
  if (!value || typeof value !== "object") return false;
  const row = value as Record<string, unknown>;
  const keys = Object.keys(row);
  if (keys.some((key) => !["id", "title", "creator", "synopsis", "createdAt"].includes(key))) {
    return false;
  }
  return (
    typeof row.id === "string" &&
    /^f-[0-9a-f-]{36}$/i.test(row.id) &&
    typeof row.title === "string" &&
    row.title.length > 0 &&
    row.title.length <= FINISHED_TITLE_MAX &&
    typeof row.creator === "string" &&
    row.creator.length > 0 &&
    row.creator.length <= FINISHED_CREATOR_MAX &&
    typeof row.synopsis === "string" &&
    row.synopsis.length > 0 &&
    row.synopsis.length <= FINISHED_SYNOPSIS_MAX &&
    typeof row.createdAt === "string" &&
    row.createdAt.length > 0 &&
    row.createdAt.length <= 40
  );
}

export function parseFinishedList(value: unknown): FinishedFilm[] {
  if (!Array.isArray(value)) return [];
  return value.filter(isFinishedFilm);
}
