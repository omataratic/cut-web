/**
 * Local preview pledges. Not a chain transaction and not escrow.
 * Swap saveLocalPledge for a contract call when escrow is live.
 */

export type LocalPledge = {
  id: string;
  filmId: string;
  wallet: string;
  amountCut: number;
  createdAt: string;
};

const STORAGE_KEY = "cut:pledges";

function canUseStorage(): boolean {
  return typeof window !== "undefined" && typeof localStorage !== "undefined";
}

function isLocalPledge(value: unknown): value is LocalPledge {
  if (!value || typeof value !== "object") return false;
  const p = value as Record<string, unknown>;
  return (
    typeof p.id === "string" &&
    typeof p.filmId === "string" &&
    typeof p.wallet === "string" &&
    typeof p.amountCut === "number" &&
    Number.isFinite(p.amountCut) &&
    typeof p.createdAt === "string"
  );
}

export function readLocalPledges(): LocalPledge[] {
  if (!canUseStorage()) return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isLocalPledge);
  } catch {
    return [];
  }
}

export function saveLocalPledge(input: {
  filmId: string;
  wallet: string;
  amountCut: number;
}): LocalPledge {
  if (!canUseStorage()) {
    throw new Error("This browser cannot store a preview pledge.");
  }
  const pledge: LocalPledge = {
    id:
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `pledge-${Date.now()}`,
    filmId: input.filmId,
    wallet: input.wallet,
    amountCut: input.amountCut,
    createdAt: new Date().toISOString(),
  };
  const next = [...readLocalPledges(), pledge];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  return pledge;
}
