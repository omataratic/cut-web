/** Behind-the-scenes updates. Shared posts live in data/bts.json. */

import { isCreatorId } from "@/lib/creator";

export const BTS_BODY_MAX = 600;
export const BTS_TOTAL_MAX = 500;
export const BTS_PER_FILM_MAX = 50;

export const BTS_ID =
  /^b-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const BTS_FILM_ID = /^[A-Za-z0-9_-]{1,80}$/;

const LOCAL_KEY = "cut:bts:local";
const LOCAL_ID =
  /^l-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type BtsPost = {
  id: string;
  filmId: string;
  creatorId: string;
  body: string;
  createdAt: string;
};

export type PublicBtsPost = {
  id: string;
  filmId: string;
  body: string;
  createdAt: string;
};

export type LocalBtsPost = PublicBtsPost & {
  creatorId: string;
};

const POST_KEYS = new Set(["id", "filmId", "creatorId", "body", "createdAt"]);

function cleanText(value: string): string {
  return value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "").trim();
}

export function validateBtsBody(
  raw: string,
): { ok: true; body: string } | { ok: false; error: string } {
  const body = cleanText(raw ?? "");
  if (!body) return { ok: false, error: "Enter an update." };
  if (body.length > BTS_BODY_MAX) {
    return {
      ok: false,
      error: `Keep the update to ${BTS_BODY_MAX} characters.`,
    };
  }
  return { ok: true, body };
}

function isIsoTime(value: string): boolean {
  return value.length > 0 && value.length <= 40 && Number.isFinite(Date.parse(value));
}

export function isBtsPost(value: unknown): value is BtsPost {
  if (!value || typeof value !== "object") return false;
  const row = value as Record<string, unknown>;
  if (Object.keys(row).some((key) => !POST_KEYS.has(key))) return false;
  return (
    typeof row.id === "string" &&
    BTS_ID.test(row.id) &&
    typeof row.filmId === "string" &&
    BTS_FILM_ID.test(row.filmId) &&
    isCreatorId(row.creatorId) &&
    typeof row.body === "string" &&
    row.body.length > 0 &&
    row.body.length <= BTS_BODY_MAX &&
    typeof row.createdAt === "string" &&
    isIsoTime(row.createdAt)
  );
}

export function parseBtsList(value: unknown): BtsPost[] {
  const rows = Array.isArray(value)
    ? value
    : value &&
        typeof value === "object" &&
        Array.isArray((value as { posts?: unknown }).posts)
      ? (value as { posts: unknown[] }).posts
      : null;
  if (!rows) return [];
  return rows.filter(isBtsPost);
}

export function publicBtsPost(post: BtsPost): PublicBtsPost {
  return {
    id: post.id,
    filmId: post.filmId,
    body: post.body,
    createdAt: post.createdAt,
  };
}

export function btsRecord(post: BtsPost): BtsPost {
  return {
    id: post.id,
    filmId: post.filmId,
    creatorId: post.creatorId,
    body: post.body,
    createdAt: post.createdAt,
  };
}

export function byNewest<T extends { createdAt: string }>(a: T, b: T): number {
  return a.createdAt < b.createdAt ? 1 : a.createdAt > b.createdAt ? -1 : 0;
}

export function formatBtsTime(iso: string): string {
  try {
    return new Intl.DateTimeFormat("en-US", {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: "America/Toronto",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export function truncateWallet(address: string): string {
  if (address.length < 12) return address;
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

function canUseStorage(): boolean {
  return typeof window !== "undefined" && typeof localStorage !== "undefined";
}

function isLocalBtsPost(value: unknown): value is LocalBtsPost {
  if (!value || typeof value !== "object") return false;
  const row = value as Record<string, unknown>;
  return (
    typeof row.id === "string" &&
    LOCAL_ID.test(row.id) &&
    typeof row.filmId === "string" &&
    BTS_FILM_ID.test(row.filmId) &&
    isCreatorId(row.creatorId) &&
    typeof row.body === "string" &&
    row.body.length > 0 &&
    row.body.length <= BTS_BODY_MAX &&
    typeof row.createdAt === "string" &&
    isIsoTime(row.createdAt)
  );
}

export function readLocalBtsPosts(filmId?: string): LocalBtsPost[] {
  if (!canUseStorage()) return [];
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isLocalBtsPost).filter((post) => !filmId || post.filmId === filmId);
  } catch {
    return [];
  }
}

export function publicLocalBtsPosts(filmId: string): PublicBtsPost[] {
  return readLocalBtsPosts(filmId)
    .map((post) => ({
      id: post.id,
      filmId: post.filmId,
      body: post.body,
      createdAt: post.createdAt,
    }))
    .sort(byNewest);
}

function writeLocalBtsPosts(posts: LocalBtsPost[]): void {
  if (!canUseStorage()) return;
  localStorage.setItem(LOCAL_KEY, JSON.stringify(posts));
  window.dispatchEvent(new Event("cut-bts"));
}

export function saveLocalBtsPost(
  filmId: string,
  creatorId: string,
  body: string,
): { ok: true; post: LocalBtsPost } | { ok: false; error: string } {
  if (!canUseStorage()) {
    return { ok: false, error: "This browser cannot store an update." };
  }
  if (!BTS_FILM_ID.test(filmId)) {
    return { ok: false, error: "That project cannot take an update." };
  }
  const validated = validateBtsBody(body);
  if (!validated.ok) return validated;
  const existing = readLocalBtsPosts();
  const forFilm = existing.filter((post) => post.filmId === filmId);
  if (forFilm.length >= BTS_PER_FILM_MAX) {
    return {
      ok: false,
      error: "This browser already has 50 updates for this project.",
    };
  }
  const post: LocalBtsPost = {
    id: `l-${crypto.randomUUID()}`,
    filmId,
    creatorId,
    body: validated.body,
    createdAt: new Date().toISOString(),
  };
  writeLocalBtsPosts([post, ...existing]);
  return { ok: true, post };
}

export function deleteLocalBtsPost(
  id: string,
  creatorId: string,
): { ok: true } | { ok: false; error: string } {
  if (!canUseStorage()) {
    return { ok: false, error: "This browser cannot store an update." };
  }
  const existing = readLocalBtsPosts();
  const row = existing.find((post) => post.id === id);
  if (!row) return { ok: true };
  if (row.creatorId !== creatorId) {
    return {
      ok: false,
      error: "This creator key does not match this update. Nothing was changed.",
    };
  }
  writeLocalBtsPosts(existing.filter((post) => post.id !== id));
  return { ok: true };
}

export const LOCAL_BTS_NOTE =
  "Only this browser has this update. It is not public.";
