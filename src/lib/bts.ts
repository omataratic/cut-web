/**
 * Progress / BTS (behind-the-scenes) posts for film projects.
 * MVP: seeded mock data + client localStorage. Swap get/list/create/remove
 * for API calls later without changing the UI contract.
 */

export type BtsPost = {
  id: string;
  filmId: string;
  /** Note text. Prefer non-empty; media-only posts allowed if image or YouTube set. */
  text: string;
  imageUrl?: string;
  youtubeUrl?: string;
  authorWallet: string;
  /** ISO-8601 timestamp */
  createdAt: string;
};

export type BtsCreateInput = {
  filmId: string;
  text: string;
  imageUrl?: string;
  youtubeUrl?: string;
  authorWallet: string;
};

const STORAGE_POSTS_KEY = "cut:bts:posts";
const STORAGE_OWNERS_KEY = "cut:bts:owners";

/** Seeded demo posts for "A Place Between" (film id 1). */
export const seedBtsPosts: BtsPost[] = [
  {
    id: "bts-seed-1",
    filmId: "1",
    text: "Day 1 on location. Soft morning light in the hallway — the script finally feels real.",
    imageUrl:
      "https://images.unsplash.com/photo-1485846234645-a62644f84728?w=800&q=80",
    authorWallet: "0x1111111111111111111111111111111111111111",
    createdAt: "2026-09-20T14:30:00.000Z",
  },
  {
    id: "bts-seed-2",
    filmId: "1",
    text: "Quick camera test from the rooftop. Sound is rough; picture is everything we hoped.",
    youtubeUrl: "https://www.youtube.com/shorts/aqz-KE-bpKQ",
    authorWallet: "0x1111111111111111111111111111111111111111",
    createdAt: "2026-09-24T18:05:00.000Z",
  },
  {
    id: "bts-seed-3",
    filmId: "1",
    text: "Wrap note: cast stayed late for one more take. Backers — thank you for making this possible.",
    authorWallet: "0x1111111111111111111111111111111111111111",
    createdAt: "2026-09-28T22:10:00.000Z",
  },
];

function canUseStorage(): boolean {
  return typeof window !== "undefined" && typeof localStorage !== "undefined";
}

function readStoredPosts(): BtsPost[] {
  if (!canUseStorage()) return [];
  try {
    const raw = localStorage.getItem(STORAGE_POSTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isBtsPost);
  } catch {
    return [];
  }
}

function writeStoredPosts(posts: BtsPost[]): void {
  if (!canUseStorage()) return;
  localStorage.setItem(STORAGE_POSTS_KEY, JSON.stringify(posts));
}

function isBtsPost(value: unknown): value is BtsPost {
  if (!value || typeof value !== "object") return false;
  const p = value as Record<string, unknown>;
  return (
    typeof p.id === "string" &&
    typeof p.filmId === "string" &&
    typeof p.text === "string" &&
    typeof p.authorWallet === "string" &&
    typeof p.createdAt === "string"
  );
}

function readOwnerMap(): Record<string, string> {
  if (!canUseStorage()) return {};
  try {
    const raw = localStorage.getItem(STORAGE_OWNERS_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") return {};
    return parsed as Record<string, string>;
  } catch {
    return {};
  }
}

function writeOwnerMap(map: Record<string, string>): void {
  if (!canUseStorage()) return;
  localStorage.setItem(STORAGE_OWNERS_KEY, JSON.stringify(map));
}

/** Effective filmmaker wallet: local claim overrides mock owner. */
export function getFilmOwnerWallet(
  filmId: string,
  mockOwnerWallet?: string,
): string | undefined {
  const claimed = readOwnerMap()[filmId];
  if (claimed) return claimed;
  return mockOwnerWallet;
}

/** Local-demo claim so a connected wallet can post without matching mock owner. */
export function claimFilmOwner(filmId: string, wallet: string): void {
  const map = readOwnerMap();
  map[filmId] = wallet;
  writeOwnerMap(map);
}

export function clearFilmOwnerClaim(filmId: string): void {
  const map = readOwnerMap();
  delete map[filmId];
  writeOwnerMap(map);
}

export function isFilmOwner(
  filmId: string,
  connectedWallet: string | undefined,
  mockOwnerWallet?: string,
): boolean {
  if (!connectedWallet) return false;
  const owner = getFilmOwnerWallet(filmId, mockOwnerWallet);
  if (!owner) return false;
  return owner.toLowerCase() === connectedWallet.toLowerCase();
}

/** Chronological newest-first feed for a film (seed ∪ localStorage). */
export function listBtsPosts(filmId: string): BtsPost[] {
  const stored = readStoredPosts().filter((p) => p.filmId === filmId);
  const storedIds = new Set(
    stored.filter((p) => !p.id.startsWith("deleted:")).map((p) => p.id),
  );
  const deletedIds = new Set(
    stored.filter((p) => p.id.startsWith("deleted:")).map((p) => p.id.slice(8)),
  );
  const seeds = seedBtsPosts.filter(
    (p) =>
      p.filmId === filmId && !storedIds.has(p.id) && !deletedIds.has(p.id),
  );
  const activeStored = stored.filter((p) => !p.id.startsWith("deleted:"));
  return [...activeStored, ...seeds].sort(
    (a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

export function createBtsPost(input: BtsCreateInput): BtsPost {
  const text = input.text.trim();
  const imageUrl = input.imageUrl?.trim() || undefined;
  const youtubeUrl = input.youtubeUrl?.trim() || undefined;
  if (!text && !imageUrl && !youtubeUrl) {
    throw new Error("Add a note, image, or YouTube link.");
  }
  const post: BtsPost = {
    id: `bts-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    filmId: input.filmId,
    text,
    imageUrl,
    youtubeUrl,
    authorWallet: input.authorWallet,
    createdAt: new Date().toISOString(),
  };
  const existing = readStoredPosts();
  const all = existing.filter((p) => !p.id.startsWith("deleted:"));
  const tombstones = existing.filter((p) => p.id.startsWith("deleted:"));
  writeStoredPosts([post, ...all, ...tombstones]);
  return post;
}

export function deleteBtsPost(postId: string, filmId: string): void {
  const all = readStoredPosts();
  const without = all.filter((p) => p.id !== postId);
  const isSeed = seedBtsPosts.some(
    (p) => p.id === postId && p.filmId === filmId,
  );
  if (isSeed) {
    without.push({
      id: `deleted:${postId}`,
      filmId,
      text: "",
      authorWallet: "",
      createdAt: new Date().toISOString(),
    });
  }
  writeStoredPosts(without);
}

export function truncateWallet(address: string): string {
  if (address.length < 12) return address;
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

/** Extract YouTube video id from watch / shorts / youtu.be / embed URLs. */
export function parseYoutubeId(url: string): string | null {
  try {
    const u = new URL(url.trim());
    const host = u.hostname.replace(/^www\./, "");
    if (host === "youtu.be") {
      const id = u.pathname.split("/").filter(Boolean)[0];
      return id || null;
    }
    if (host === "youtube.com" || host === "m.youtube.com") {
      if (u.pathname.startsWith("/shorts/")) {
        return u.pathname.split("/")[2] || null;
      }
      if (u.pathname.startsWith("/embed/")) {
        return u.pathname.split("/")[2] || null;
      }
      return u.searchParams.get("v");
    }
    return null;
  } catch {
    return null;
  }
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

/** Stable client snapshots for useSyncExternalStore (cached by filmId). */
const postCache = new Map<string, { key: string; posts: BtsPost[] }>();
const ownerCache = new Map<string, { key: string; owner: string }>();

export function getCachedBtsPosts(filmId: string): BtsPost[] {
  const rawPosts = canUseStorage()
    ? (localStorage.getItem(STORAGE_POSTS_KEY) ?? "")
    : "";
  const key = rawPosts;
  const hit = postCache.get(filmId);
  if (hit && hit.key === key) return hit.posts;
  const posts = listBtsPosts(filmId);
  postCache.set(filmId, { key, posts });
  return posts;
}

export function getCachedFilmOwner(
  filmId: string,
  mockOwnerWallet: string,
): string {
  const rawOwners = canUseStorage()
    ? (localStorage.getItem(STORAGE_OWNERS_KEY) ?? "")
    : "";
  const key = `${rawOwners}::${mockOwnerWallet}`;
  const hit = ownerCache.get(filmId);
  if (hit && hit.key === key) return hit.owner;
  const owner = getFilmOwnerWallet(filmId, mockOwnerWallet) ?? mockOwnerWallet;
  ownerCache.set(filmId, { key, owner });
  return owner;
}

export function invalidateBtsCaches(): void {
  postCache.clear();
  ownerCache.clear();
}
