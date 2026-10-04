"use client";

import Link from "next/link";
import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { RemoveProjectButton } from "@/components/RemoveProjectButton";
import { getOrCreateCreatorId } from "@/lib/creator";
import { loadDashboardProjects, type PreviewProject } from "@/lib/dashboard-projects";
import {
  readLocalSubmission,
  updateLocalSubmission,
  validateSubmissionInput,
  type SubmissionInput,
} from "@/lib/submissions";
import { youtubeWatchUrl } from "@/lib/youtube";

const fieldClass =
  "mt-1 w-full rounded border border-cut-border bg-cut-cream px-3 py-2 text-sm text-cut-charcoal outline-none placeholder:text-cut-muted focus:border-cut-charcoal";

function fieldsFromProject(project: PreviewProject): SubmissionInput {
  return {
    title: project.title,
    creator: project.creator,
    synopsis: project.synopsis,
    youtubeUrl: youtubeWatchUrl(project.youtubeId) ?? "",
    goalUsd: String(project.goalUsd),
  };
}

export function PreviewEditForm({ id }: { id: string }) {
  const [fields, setFields] = useState<SubmissionInput | null>(null);
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
          (item): item is PreviewProject => item.kind === "preview" && item.id === id,
        );
        if (!project) {
          setMissing(true);
          setLoading(false);
          return;
        }
        setFields(fieldsFromProject(project));
        setLoading(false);
      })();
    }, 0);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [id]);

  const set =
    (key: keyof SubmissionInput) =>
    (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setSaved(false);
      setFields((current) => (current ? { ...current, [key]: event.target.value } : current));
    };

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!fields) return;
    setError(null);
    setSaved(false);
    const validated = validateSubmissionInput(fields);
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
      const response = await fetch(`/api/films/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...fields, creatorId }),
      });
      const data = (await response.json().catch(() => ({}))) as { error?: string };
      if (response.status === 404) {
        const local = updateLocalSubmission(id, creatorId, validated.value);
        if (!local.ok) {
          setError(local.error);
          return;
        }
        setSaved(true);
        return;
      }
      if (!response.ok) {
        setError(data.error || "Could not save this edit. Nothing was changed.");
        return;
      }
      if (readLocalSubmission(id)) {
        updateLocalSubmission(id, creatorId, validated.value);
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
      <h1 className="font-serif text-3xl text-cut-charcoal">Edit preview</h1>
      <p className="mt-3 text-sm leading-relaxed text-cut-muted">
        Change the title, creator name, synopsis, YouTube link, or the display-only
        funding goal. Nothing is charged.
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
                maxLength={120}
                className={fieldClass}
              />
            </label>
            <label className="block text-sm text-cut-charcoal">
              Creator name
              <input
                required
                value={fields.creator}
                onChange={set("creator")}
                maxLength={80}
                className={fieldClass}
              />
            </label>
            <label className="block text-sm text-cut-charcoal">
              Synopsis
              <textarea
                required
                value={fields.synopsis}
                onChange={set("synopsis")}
                maxLength={600}
                rows={4}
                className={fieldClass}
              />
            </label>
            <label className="block text-sm text-cut-charcoal">
              YouTube link
              <input
                required
                type="url"
                inputMode="url"
                value={fields.youtubeUrl}
                onChange={set("youtubeUrl")}
                className={fieldClass}
              />
            </label>
            <label className="block text-sm text-cut-charcoal">
              Funding goal (USD)
              <span className="mt-1 flex overflow-hidden rounded border border-cut-border bg-cut-cream focus-within:border-cut-charcoal">
                <span className="flex items-center border-r border-cut-border px-3 text-xs text-cut-muted">
                  USD
                </span>
                <input
                  required
                  inputMode="decimal"
                  value={fields.goalUsd}
                  onChange={set("goalUsd")}
                  className="w-full bg-transparent px-3 py-2 text-sm tabular-nums text-cut-charcoal outline-none"
                  aria-describedby="goal-note"
                />
              </span>
            </label>
            <p id="goal-note" className="text-sm leading-relaxed text-cut-muted">
              The goal is a display number only. Nothing is charged.
            </p>
            {error ? <p className="text-sm text-red-400">{error}</p> : null}
            {saved ? <p className="text-sm text-cut-charcoal">Saved.</p> : null}
            <button
              type="submit"
              disabled={pending}
              className="w-full rounded border border-cut-charcoal bg-cut-charcoal px-4 py-2.5 text-sm text-cut-cream hover:opacity-90 disabled:opacity-60"
            >
              {pending ? "Saving…" : "Save preview"}
            </button>
          </form>
          <div className="mt-8 border-t border-cut-border pt-6">
            <h2 className="font-serif text-xl text-cut-charcoal">Remove this project</h2>
            <p className="mt-2 text-sm leading-relaxed text-cut-muted">
              Removing takes the preview off the public list, including its votes.
            </p>
            <div className="mt-4">
              <RemoveProjectButton kind="preview" id={id} />
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
