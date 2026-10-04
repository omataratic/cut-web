"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import {
  BTS_BODY_MAX,
  byNewest,
  deleteLocalBtsPost,
  formatBtsTime,
  LOCAL_BTS_NOTE,
  publicLocalBtsPosts,
  saveLocalBtsPost,
  type PublicBtsPost,
} from "@/lib/bts";
import { getOrCreateCreatorId } from "@/lib/creator";

type ListedPost = PublicBtsPost & { localOnly: boolean };

function isPublicPost(value: unknown): value is PublicBtsPost {
  if (!value || typeof value !== "object") return false;
  const row = value as Record<string, unknown>;
  return (
    typeof row.id === "string" &&
    typeof row.filmId === "string" &&
    typeof row.body === "string" &&
    typeof row.createdAt === "string" &&
    !("creatorId" in row)
  );
}

export function DashboardBts({ filmId }: { filmId: string }) {
  const [posts, setPosts] = useState<ListedPost[]>([]);
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const load = useCallback(async () => {
    const local = publicLocalBtsPosts(filmId).map(
      (post): ListedPost => ({ ...post, localOnly: true }),
    );
    try {
      const response = await fetch(`/api/bts?filmId=${encodeURIComponent(filmId)}`, {
        cache: "no-store",
      });
      const data = (await response.json()) as { posts?: unknown; error?: string };
      if (!response.ok) {
        setPosts(local.sort(byNewest));
        setError(data.error || "Could not load updates.");
        setLoading(false);
        return;
      }
      const shared = Array.isArray(data.posts) ? data.posts.filter(isPublicPost) : [];
      const sharedIds = new Set(shared.map((post) => post.id));
      const merged: ListedPost[] = [
        ...shared.map((post) => ({ ...post, localOnly: false })),
        ...local.filter((post) => !sharedIds.has(post.id)),
      ];
      merged.sort(byNewest);
      setPosts(merged);
      setError(null);
    } catch {
      setPosts(local.sort(byNewest));
      setError("Could not load updates.");
    } finally {
      setLoading(false);
    }
  }, [filmId]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void load();
    }, 0);
    const refresh = () => {
      void load();
    };
    window.addEventListener("cut-bts", refresh);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("cut-bts", refresh);
    };
  }, [load]);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setNotice(null);
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
      const response = await fetch("/api/bts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filmId, creatorId, body }),
      });
      const data = (await response.json().catch(() => ({}))) as {
        error?: string;
        post?: unknown;
      };
      if (response.ok) {
        setBody("");
        setNotice(null);
        await load();
        return;
      }
      const keepLocal = response.status === 404 || response.status === 503 || response.status >= 500;
      if (!keepLocal) {
        setError(data.error || "Could not publish this update. Nothing was published.");
        return;
      }
      const saved = saveLocalBtsPost(filmId, creatorId, body);
      if (!saved.ok) {
        setError(data.error || saved.error);
        return;
      }
      setBody("");
      setNotice(LOCAL_BTS_NOTE);
      await load();
    } catch {
      const saved = saveLocalBtsPost(filmId, creatorId, body);
      if (!saved.ok) {
        setError(saved.error);
        return;
      }
      setBody("");
      setNotice(LOCAL_BTS_NOTE);
      await load();
    } finally {
      setPending(false);
    }
  };

  const onRemove = async (post: ListedPost) => {
    setError(null);
    setNotice(null);
    let creatorId: string;
    try {
      creatorId = getOrCreateCreatorId();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "This browser cannot store a creator id.",
      );
      return;
    }
    if (post.localOnly) {
      const removed = deleteLocalBtsPost(post.id, creatorId);
      if (!removed.ok) {
        setError(removed.error);
        return;
      }
      await load();
      return;
    }
    setPending(true);
    try {
      const response = await fetch(`/api/bts/${post.id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ creatorId }),
      });
      const data = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) {
        setError(data.error || "Could not remove this update. Nothing was changed.");
        return;
      }
      await load();
    } catch {
      setError("Could not remove this update. Nothing was changed.");
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="mt-4 border-t border-cut-border pt-4">
      <h3 className="font-serif text-base text-cut-charcoal">Behind the scenes</h3>
      <p className="mt-1 text-sm leading-relaxed text-cut-muted">
        A short update. Visitors see it on the film page. Text only.
      </p>
      <form onSubmit={onSubmit} className="mt-3 space-y-2">
        <label className="block text-sm text-cut-muted">
          Update
          <textarea
            value={body}
            onChange={(event) => setBody(event.target.value)}
            rows={3}
            maxLength={BTS_BODY_MAX}
            placeholder="What happened on this project?"
            className="mt-1 w-full resize-y rounded border border-cut-border bg-cut-cream px-3 py-2 text-sm text-cut-charcoal placeholder:text-cut-muted focus:border-cut-charcoal focus:outline-none"
          />
        </label>
        <button
          type="submit"
          disabled={pending}
          className="rounded border border-cut-charcoal bg-cut-charcoal px-3 py-1.5 text-sm text-cut-cream hover:opacity-90 disabled:opacity-60"
        >
          {pending ? "Posting…" : "Post update"}
        </button>
      </form>
      {notice ? <p className="mt-2 text-sm text-cut-muted">{notice}</p> : null}
      {error ? <p className="mt-2 text-sm text-red-400">{error}</p> : null}
      {loading ? <p className="mt-3 text-sm text-cut-muted">Loading updates…</p> : null}
      {!loading && posts.length === 0 ? (
        <p className="mt-3 text-sm text-cut-muted">No updates yet.</p>
      ) : null}
      {!loading && posts.length > 0 ? (
        <ul className="mt-3 space-y-2">
          {posts.map((post) => (
            <li key={post.id} className="rounded border border-cut-border bg-cut-cream p-3">
              <p className="text-xs text-cut-muted">
                <time dateTime={post.createdAt}>{formatBtsTime(post.createdAt)}</time>
                <span className="ml-1.5">ET</span>
              </p>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-cut-charcoal">
                {post.body}
              </p>
              {post.localOnly ? (
                <p className="mt-2 text-sm text-cut-muted">{LOCAL_BTS_NOTE}</p>
              ) : null}
              <button
                type="button"
                onClick={() => {
                  void onRemove(post);
                }}
                disabled={pending}
                className="mt-2 text-sm text-cut-muted hover:text-cut-charcoal disabled:opacity-60"
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
