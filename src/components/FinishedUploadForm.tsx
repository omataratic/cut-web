"use client";

import { useState, type ChangeEvent, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { getOrCreateCreatorId } from "@/lib/creator";
import {
  FINISHED_CREATOR_MAX,
  FINISHED_SYNOPSIS_MAX,
  FINISHED_TITLE_MAX,
  validateFinishedInput,
  type FinishedFilmInput,
} from "@/lib/finished";

const empty: FinishedFilmInput = {
  title: "",
  creator: "",
  synopsis: "",
};

export function FinishedUploadForm() {
  const router = useRouter();
  const [fields, setFields] = useState<FinishedFilmInput>(empty);
  const [fileChosen, setFileChosen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const set =
    (key: keyof FinishedFilmInput) =>
    (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setFields((current) => ({ ...current, [key]: event.target.value }));
    };

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    const validated = validateFinishedInput(fields);
    if (!validated.ok) {
      setError(validated.error);
      return;
    }

    let creatorId: string;
    try {
      creatorId = getOrCreateCreatorId();
    } catch (err) {
      setError(err instanceof Error ? err.message : "This browser cannot store a creator id.");
      return;
    }

    setPending(true);
    try {
      const response = await fetch("/api/finished", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: fields.title,
          creator: fields.creator,
          synopsis: fields.synopsis,
          creatorId,
        }),
      });
      const data = (await response.json()) as {
        error?: string;
        url?: string;
        film?: { id: string };
      };

      if (!response.ok) {
        setError(data.error || "Could not save this finished film. It is not listed.");
        return;
      }

      const filmUrl =
        typeof data.url === "string" && data.url.startsWith("/finished/")
          ? data.url
          : data.film?.id
            ? `/finished/${data.film.id}`
            : null;
      if (!filmUrl) {
        setError("Could not save this finished film. It is not listed.");
        return;
      }
      router.push(filmUrl);
    } catch {
      setError("Could not save this finished film. It is not listed.");
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
          maxLength={FINISHED_TITLE_MAX}
          className="mt-1 w-full rounded border border-cut-border bg-cut-cream px-3 py-2 text-sm text-cut-charcoal outline-none placeholder:text-cut-muted focus:border-cut-charcoal"
        />
      </label>

      <label className="block text-sm text-cut-charcoal">
        Creator name
        <input
          required
          value={fields.creator}
          onChange={set("creator")}
          maxLength={FINISHED_CREATOR_MAX}
          className="mt-1 w-full rounded border border-cut-border bg-cut-cream px-3 py-2 text-sm text-cut-charcoal outline-none placeholder:text-cut-muted focus:border-cut-charcoal"
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
          className="mt-1 w-full rounded border border-cut-border bg-cut-cream px-3 py-2 text-sm text-cut-charcoal outline-none placeholder:text-cut-muted focus:border-cut-charcoal"
        />
      </label>

      <label className="block text-sm text-cut-charcoal">
        Movie file
        <input
          type="file"
          accept="video/*"
          onChange={(event) => {
            setFileChosen(Boolean(event.target.files?.length));
          }}
          className="mt-1 block w-full text-sm text-cut-muted file:mr-3 file:rounded file:border file:border-cut-border file:bg-cut-cream file:px-3 file:py-1.5 file:text-sm file:text-cut-charcoal"
        />
      </label>
      <p className="text-sm leading-relaxed text-cut-muted">
        The movie file is not kept on this public site. Choosing a file does not
        upload it, and the film cannot be played or downloaded yet. Submitting
        saves the title, creator, and synopsis only.
        {fileChosen
          ? " The file you picked stays on your computer."
          : ""}
      </p>
      <p className="text-sm leading-relaxed text-cut-muted">
        Streaming is meant to be $3.99/month for the creator, subscribers, and
        backer NFT holders. Checkout is off, and that check is not live, so the
        film stays locked for everyone.
      </p>

      {error ? <p className="text-sm text-red-400">{error}</p> : null}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded border border-cut-charcoal bg-cut-charcoal px-4 py-2.5 text-sm text-cut-cream hover:opacity-90 disabled:opacity-60"
      >
        {pending ? "Saving…" : "List finished film"}
      </button>
    </form>
  );
}
