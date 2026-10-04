"use client";

import Link from "next/link";
import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { RemoveProjectButton } from "@/components/RemoveProjectButton";
import { getOrCreateCreatorId } from "@/lib/creator";
import {
  loadDashboardProjects,
  type FinishedProject,
} from "@/lib/dashboard-projects";
import {
  FINISHED_CREATOR_MAX,
  FINISHED_SYNOPSIS_MAX,
  FINISHED_TITLE_MAX,
  validateFinishedInput,
  type FinishedFilmInput,
} from "@/lib/finished";

const fieldClass =
  "mt-1 w-full rounded border border-cut-border bg-cut-cream px-3 py-2 text-sm text-cut-charcoal outline-none placeholder:text-cut-muted focus:border-cut-charcoal";

export function FinishedEditForm({ id }: { id: string }) {
  const [fields, setFields] = useState<FinishedFilmInput | null>(null);
  const [missing, setMissing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [pending, setPending] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const timer = window.setTimeout(() => {
      void (async () => {
        let creatorId: string;
        try {
          creatorId = getOrCreateCreatorId();
        } catch (err) {
          if (cancelled) return;
          setError(
            err instanceof Error ? err.message : "This browser cannot store a creator id.",
          );
          setLoading(false);
          return;
        }
        const result = await loadDashboardProjects(creatorId);
        if (cancelled) return;
        if (!result.ok) {
          setError(result.error);
          setLoading(false);
          return;
        }
        const project = result.projects.find(
          (item): item is FinishedProject => item.kind === "finished" && item.id === id,
        );
        if (!project) {
          setMissing(true);
          setLoading(false);
          return;
        }
        setFields({
          title: project.title,
          creator: project.creator,
          synopsis: project.synopsis,
        });
        setLoading(false);
      })();
    }, 0);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [id]);

  const set =
    (key: keyof FinishedFilmInput) =>
    (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setSaved(false);
      setFields((current) => (current ? { ...current, [key]: event.target.value } : current));
    };

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!fields) return;
    setError(null);
    setSaved(false);
    const validated = validateFinishedInput(fields);
    if (!validated.ok) {
      setError(validated.error);
      return;
    }
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
      const response = await fetch(`/api/finished/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: fields.title,
          creator: fields.creator,
          synopsis: fields.synopsis,
          creatorId,
        }),
      });
      const data = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) {
        setError(data.error || "Could not save this edit. Nothing was changed.");
        return;
      }
      setSaved(true);
    } catch {
      setError("Could not save this edit. Nothing was changed.");
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="mx-auto max-w-xl px-4 py-10">
      <p className="mb-4 text-sm">
        <Link href="/dashboard" className="text-cut-muted hover:text-cut-charcoal">
          ← Dashboard
        </Link>
      </p>
      <h1 className="font-serif text-3xl text-cut-charcoal">Edit finished film</h1>
      <p className="mt-3 text-sm leading-relaxed text-cut-muted">
        Change the title, creator name, or synopsis. Playback stays locked.
        Streaming is meant to be $3.99/month. Checkout is off.
      </p>

      {loading ? <p className="mt-6 text-sm text-cut-muted">Loading…</p> : null}
      {missing ? (
        <p className="mt-6 text-sm text-cut-muted">
          This project is not on this browser&apos;s dashboard.
        </p>
      ) : null}
      {error && !fields ? <p className="mt-6 text-sm text-red-400">{error}</p> : null}

      {fields ? (
        <>
          <form
            onSubmit={onSubmit}
            className="mt-6 space-y-4 rounded border border-cut-border bg-cut-mist p-4 sm:p-5"
          >
            <label className="block text-sm text-cut-charcoal">
              Film title
              <input
                required
                value={fields.title}
                onChange={set("title")}
                maxLength={FINISHED_TITLE_MAX}
                className={fieldClass}
              />
            </label>
            <label className="block text-sm text-cut-charcoal">
              Creator name
              <input
                required
                value={fields.creator}
                onChange={set("creator")}
                maxLength={FINISHED_CREATOR_MAX}
                className={fieldClass}
              />
            </label>
            <label className="block text-sm text-cut-charcoal">
              Synopsis
              <textarea
                required
                value={fields.synopsis}
                onChange={set("synopsis")}
                maxLength={FINISHED_SYNOPSIS_MAX}
                rows={4}
                className={fieldClass}
              />
            </label>
            {error ? <p className="text-sm text-red-400">{error}</p> : null}
            {saved ? <p className="text-sm text-cut-charcoal">Saved.</p> : null}
            <button
              type="submit"
              disabled={pending}
              className="w-full rounded border border-cut-charcoal bg-cut-charcoal px-4 py-2.5 text-sm text-cut-cream hover:opacity-90 disabled:opacity-60"
            >
              {pending ? "Saving…" : "Save finished film"}
            </button>
          </form>
          <div className="mt-8 border-t border-cut-border pt-6">
            <h2 className="font-serif text-xl text-cut-charcoal">Remove this project</h2>
            <p className="mt-2 text-sm leading-relaxed text-cut-muted">
              Removing takes the listing off the public list. The movie file was
              never stored here.
            </p>
            <div className="mt-4">
              <RemoveProjectButton kind="finished" id={id} />
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
