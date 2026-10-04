"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getOrCreateCreatorId } from "@/lib/creator";
import { deleteLocalSubmission } from "@/lib/submissions";

export function RemoveProjectButton({
  kind,
  id,
  onRemoved,
}: {
  kind: "preview" | "finished";
  id: string;
  onRemoved?: () => void;
}) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onRemove = async () => {
    setError(null);
    let creatorId: string;
    try {
      creatorId = getOrCreateCreatorId();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "This browser cannot store a creator id.",
      );
      return;
    }

    setPending(true);
    try {
      const path = kind === "preview" ? `/api/films/${id}` : `/api/finished/${id}`;
      const response = await fetch(path, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ creatorId }),
      });
      const data = (await response.json().catch(() => ({}))) as { error?: string };

      if (response.status === 404 && kind === "preview") {
        const local = deleteLocalSubmission(id, creatorId);
        if (!local.ok) {
          setError(local.error);
          return;
        }
      } else if (!response.ok) {
        setError(data.error || "Could not remove this project. Nothing was changed.");
        return;
      } else if (kind === "preview") {
        deleteLocalSubmission(id, creatorId);
      }

      if (onRemoved) onRemoved();
      else router.push("/dashboard");
    } catch {
      setError("Could not remove this project. Nothing was changed.");
    } finally {
      setPending(false);
    }
  };

  if (!confirming) {
    return (
      <div>
        <button
          type="button"
          onClick={() => setConfirming(true)}
          className="rounded border border-cut-border px-3 py-1.5 text-sm text-cut-muted hover:border-cut-charcoal hover:text-cut-charcoal"
        >
          Remove this project
        </button>
        {error ? <p className="mt-2 text-sm text-red-400">{error}</p> : null}
      </div>
    );
  }

  return (
    <div className="rounded border border-cut-border bg-cut-cream p-3">
      <p className="text-sm text-cut-charcoal">
        This removes the project from the public list. It cannot be undone.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onRemove}
          disabled={pending}
          className="rounded border border-cut-charcoal bg-cut-charcoal px-3 py-1.5 text-sm text-cut-cream hover:opacity-90 disabled:opacity-60"
        >
          {pending ? "Removing…" : "Remove this project from the public list"}
        </button>
        <button
          type="button"
          onClick={() => setConfirming(false)}
          disabled={pending}
          className="rounded border border-cut-border px-3 py-1.5 text-sm text-cut-muted hover:text-cut-charcoal disabled:opacity-60"
        >
          Cancel
        </button>
      </div>
      {error ? <p className="mt-2 text-sm text-red-400">{error}</p> : null}
    </div>
  );
}
