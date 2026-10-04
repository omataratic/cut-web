"use client";

import { useState, type ChangeEvent, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  saveLocalSubmission,
  validateSubmissionInput,
  type SubmissionInput,
} from "@/lib/submissions";

const empty: SubmissionInput = {
  title: "",
  creator: "",
  synopsis: "",
  youtubeUrl: "",
  goalUsd: "",
};

export function UploadForm() {
  const router = useRouter();
  const [fields, setFields] = useState<SubmissionInput>(empty);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const set =
    (key: keyof SubmissionInput) =>
    (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setFields((current) => ({ ...current, [key]: event.target.value }));
    };

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    const validated = validateSubmissionInput(fields);
    if (!validated.ok) {
      setError(validated.error);
      return;
    }

    setPending(true);
    try {
      const response = await fetch("/api/films", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(fields),
      });
      const data = (await response.json()) as {
        error?: string;
        submission?: { id: string };
      };

      if (response.ok && data.submission?.id) {
        router.push(`/film/${data.submission.id}`);
        return;
      }

      if (response.status === 503) {
        const saved = saveLocalSubmission(validated.value);
        router.push(`/film/${saved.id}`);
        return;
      }

      setError(data.error || "Could not save this film.");
    } catch {
      try {
        const saved = saveLocalSubmission(validated.value);
        router.push(`/film/${saved.id}`);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not save this film.");
      }
    } finally {
      setPending(false);
    }
  };

  return (
    <form
      onSubmit={onSubmit}
      className="space-y-4 rounded border border-cut-border bg-cut-mist p-4 sm:p-5"
    >
      <label className="block text-sm text-cut-charcoal">
        Film title
        <input
          required
          value={fields.title}
          onChange={set("title")}
          maxLength={120}
          className="mt-1 w-full rounded border border-cut-border bg-cut-cream px-3 py-2 text-sm text-cut-charcoal outline-none placeholder:text-cut-muted focus:border-cut-charcoal"
        />
      </label>

      <label className="block text-sm text-cut-charcoal">
        Creator name
        <input
          required
          value={fields.creator}
          onChange={set("creator")}
          maxLength={80}
          className="mt-1 w-full rounded border border-cut-border bg-cut-cream px-3 py-2 text-sm text-cut-charcoal outline-none placeholder:text-cut-muted focus:border-cut-charcoal"
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
          className="mt-1 w-full rounded border border-cut-border bg-cut-cream px-3 py-2 text-sm text-cut-charcoal outline-none placeholder:text-cut-muted focus:border-cut-charcoal"
        />
      </label>

      <label className="block text-sm text-cut-charcoal">
        YouTube link
        <input
          required
          type="url"
          inputMode="url"
          placeholder="https://www.youtube.com/watch?v=…"
          value={fields.youtubeUrl}
          onChange={set("youtubeUrl")}
          className="mt-1 w-full rounded border border-cut-border bg-cut-cream px-3 py-2 text-sm text-cut-charcoal outline-none placeholder:text-cut-muted focus:border-cut-charcoal"
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
            className="w-full bg-transparent px-3 py-2 text-sm tabular-nums text-cut-charcoal outline-none placeholder:text-cut-muted"
            aria-describedby="goal-note"
          />
        </span>
      </label>
      <p id="goal-note" className="text-sm leading-relaxed text-cut-muted">
        The goal is a display number only. Nothing is charged.
      </p>

      {error ? <p className="text-sm text-red-400">{error}</p> : null}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded border border-cut-charcoal bg-cut-charcoal px-4 py-2.5 text-sm text-cut-cream hover:opacity-90 disabled:opacity-60"
      >
        {pending ? "Saving…" : "Submit preview"}
      </button>
    </form>
  );
}
