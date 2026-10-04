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

function arrowClass(active: boolean, resting: string): string {
  return `inline-flex h-5 w-5 items-center justify-center leading-none disabled:opacity-60 ${
    active ? "rounded-sm bg-cut-border text-cut-charcoal" : resting
  }`;
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
      <div className="flex items-center gap-1 text-sm text-cut-charcoal">
        <button
          type="button"
          aria-pressed={mine === "up"}
          aria-label={mine === "up" ? "Remove upvote" : "Upvote"}
          disabled={pending}
          onClick={() => void cast("up")}
          className={arrowClass(mine === "up", "text-cut-charcoal")}
        >
          ▲
        </button>
        <button
          type="button"
          aria-pressed={mine === "down"}
          aria-label={mine === "down" ? "Remove downvote" : "Downvote"}
          disabled={pending}
          onClick={() => void cast("down")}
          className={arrowClass(mine === "down", "text-cut-muted")}
        >
          ▼
        </button>
        <span className="ml-1 tabular-nums">{score}</span>
        <span className="sr-only">score</span>
      </div>
      {error ? (
        <p role="alert" className="mt-1 text-xs text-red-400">
          {error}
        </p>
      ) : null}
    </div>
  );
}
