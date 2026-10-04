/** Browser identity for projects this browser created. Not an account and not a password. */
export const CREATOR_ID =
  /^r-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const CREATOR_KEY = "cut:creator";

export const CREATOR_KEY_INVALID = "That creator key is not valid.";

export const CREATOR_MISMATCH =
  "This creator key does not match this project. Nothing was changed.";

export const CREATOR_UNOWNED =
  "This project is not tied to a creator key, so it cannot be changed.";

export function isCreatorId(value: unknown): value is string {
  return typeof value === "string" && CREATOR_ID.test(value);
}

export function creatorIdFromJson(value: unknown): string {
  if (!value || typeof value !== "object" || Array.isArray(value)) return "";
  const creatorId = (value as { creatorId?: unknown }).creatorId;
  return typeof creatorId === "string" ? creatorId : "";
}

function canUseStorage(): boolean {
  return typeof window !== "undefined" && typeof localStorage !== "undefined";
}

/** Created the first time this browser opens the dashboard or saves a project. */
export function getOrCreateCreatorId(): string {
  if (!canUseStorage()) {
    throw new Error("This browser cannot store a creator id.");
  }
  const existing = localStorage.getItem(CREATOR_KEY);
  if (existing && isCreatorId(existing)) return existing;
  const created = `r-${crypto.randomUUID()}`;
  localStorage.setItem(CREATOR_KEY, created);
  return created;
}
