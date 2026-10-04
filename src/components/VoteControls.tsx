"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import {
  getBallotServerSnapshot,
  getBallotSnapshot,
  getOrCreateVoterId,
  subscribeBallot,
  writeBallot,
} from "@/lib/ballot";
import type { VoteDirection } from "@/lib/votes";

type VoteControlsProps = {
  filmId: string;
  score: number;
  /** Tell the list so Hot can reorder without a reload. */
  onScore?: (score: number) => void;
  /** Film pages fetch the shared score. Cards already receive it. */
  sync?: boolean;
};

function VoteButton({
  direction,
  active,
  pending,
  onClick,
}: {
  direction: VoteDirection;
  active: boolean;
  pending: boolean;
  onClick: () => void;
}) {
  const word = direction === "up" ? "Up" : "Down";
  return (
    <button
      type="button"
      aria-pressed={active}
      aria-label={active ? `Remove ${word.toLowerCase()}vote` : `${word}vote`}
      disabled={pending}
      onClick={onClick}
      className={`inline-flex h-11 min-w-20 items-center justify-center gap-1.5 rounded-md border px-3 text-sm font-medium disabled:opacity-60 ${
        active
          ? direction === "up"
            ? "border-cut-charcoal bg-cut-charcoal text-black"
            : "border-cut-muted bg-cut-border text-cut-charcoal"
          : "border-cut-border bg-black text-cut-charcoal hover:border-cut-muted"
      }`}
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 16 16"
        aria-hidden
        className={direction === "down" ? "rotate-180" : undefined}
      >
        <path d="M8 2.5 13.5 11H2.5L8 2.5Z" fill="currentColor" />
      </svg>
      {word}
    </button>
  );
}

export function VoteControls({
  filmId,
  score: initialScore,
  onScore,
  sync = false,
}: VoteControlsProps) {
  const ballot = useSyncExternalStore(
    subscribeBallot,
    getBallotSnapshot,
    getBallotServerSnapshot,
  );
  const mine = ballot[filmId] ?? null;
  const [liveScore, setLiveScore] = useState<{ filmId: string; score: number } | null>(
    null,
  );
  const score = liveScore?.filmId === filmId ? liveScore.score : initialScore;
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const epoch = useRef(0);
  const onScoreRef = useRef(onScore);

  useEffect(() => {
    onScoreRef.current = onScore;
  }, [onScore]);

  useEffect(() => {
    if (!sync) return;
    const seen = epoch.current;
    let cancelled = false;
    void (async () => {
      try {
        const response = await fetch(
          `/api/votes?filmId=${encodeURIComponent(filmId)}`,
          { cache: "no-store" },
        );
        if (!response.ok) return;
        const data = (await response.json()) as { score?: unknown };
        if (cancelled || seen !== epoch.current) return;
        if (typeof data.score === "number" && Number.isFinite(data.score)) {
          setLiveScore({ filmId, score: data.score });
          onScoreRef.current?.(data.score);
        }
      } catch {
        // Keep the score from the page. A failed read is not a counted vote.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [filmId, sync]);

  async function cast(clicked: VoteDirection) {
    if (pending) return;
    const next: VoteDirection | "none" = mine === clicked ? "none" : clicked;
    setError(null);
    setPending(true);
    epoch.current += 1;
    try {
      let voterId: string;
      try {
        voterId = getOrCreateVoterId();
      } catch {
        setError("Could not save this vote for other visitors.");
        return;
      }
      const response = await fetch("/api/votes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({ voterId, filmId, direction: next }),
      });
      const data = (await response.json().catch(() => null)) as {
        error?: unknown;
        score?: unknown;
        direction?: unknown;
      } | null;
      if (
        !response.ok ||
        !data ||
        typeof data.score !== "number" ||
        !Number.isFinite(data.score) ||
        (data.direction !== "up" &&
          data.direction !== "down" &&
          data.direction !== "none")
      ) {
        setError(
          data && typeof data.error === "string"
            ? data.error
            : "Could not save this vote for other visitors.",
        );
        return;
      }
      const saved = { ...getBallotSnapshot() };
      if (data.direction === "none") delete saved[filmId];
      else saved[filmId] = data.direction;
      writeBallot(saved);
      setLiveScore({ filmId, score: data.score });
      onScore?.(data.score);
    } catch {
      setError("Could not save this vote for other visitors.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2 text-cut-charcoal">
        <VoteButton
          direction="up"
          active={mine === "up"}
          pending={pending}
          onClick={() => void cast("up")}
        />
        <span className="min-w-8 text-center text-lg font-medium tabular-nums">
          {score}
          <span className="sr-only"> score</span>
        </span>
        <VoteButton
          direction="down"
          active={mine === "down"}
          pending={pending}
          onClick={() => void cast("down")}
        />
      </div>
      {error ? (
        <p role="alert" className="mt-1 text-xs text-red-400">
          {error}
        </p>
      ) : null}
    </div>
  );
}
