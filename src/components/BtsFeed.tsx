"use client";

import {
  useCallback,
  useState,
  useSyncExternalStore,
  type FormEvent,
} from "react";
import { useAccount } from "wagmi";
import {
  claimFilmOwner,
  createBtsPost,
  deleteBtsPost,
  formatBtsTime,
  getCachedBtsPosts,
  getCachedFilmOwner,
  invalidateBtsCaches,
  isFilmOwner,
  parseYoutubeId,
  truncateWallet,
  type BtsPost,
} from "@/lib/bts";

type BtsFeedProps = {
  filmId: string;
  mockOwnerWallet: string;
  filmTitle: string;
};

const btsListeners = new Set<() => void>();
const serverPostCache = new Map<string, BtsPost[]>();

function emitBtsChange() {
  invalidateBtsCaches();
  btsListeners.forEach((l) => l());
}

function subscribeBts(onStoreChange: () => void) {
  btsListeners.add(onStoreChange);
  const onStorage = (e: StorageEvent) => {
    if (e.key === "cut:bts:posts" || e.key === "cut:bts:owners") {
      onStoreChange();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    btsListeners.delete(onStoreChange);
    window.removeEventListener("storage", onStorage);
  };
}

function getBtsSnapshot(filmId: string): BtsPost[] {
  return getCachedBtsPosts(filmId);
}

function getBtsServerSnapshot(filmId: string): BtsPost[] {
  let cached = serverPostCache.get(filmId);
  if (!cached) {
    // Seeds only on server (no localStorage) — keeps hydration aligned for demo film.
    cached = getCachedBtsPosts(filmId);
    serverPostCache.set(filmId, cached);
  }
  return cached;
}

function getOwnerSnapshot(filmId: string, mockOwner: string): string {
  return getCachedFilmOwner(filmId, mockOwner);
}

export function BtsFeed({ filmId, mockOwnerWallet, filmTitle }: BtsFeedProps) {
  const { address, isConnected } = useAccount();
  const posts = useSyncExternalStore(
    subscribeBts,
    () => getBtsSnapshot(filmId),
    () => getBtsServerSnapshot(filmId),
  );
  const owner = useSyncExternalStore(
    subscribeBts,
    () => getOwnerSnapshot(filmId, mockOwnerWallet),
    () => mockOwnerWallet,
  );
  const ownerMatch = isFilmOwner(filmId, address, mockOwnerWallet);

  const handleClaim = () => {
    if (!address) return;
    claimFilmOwner(filmId, address);
    emitBtsChange();
  };

  const handleCreated = useCallback(() => {
    emitBtsChange();
  }, []);

  const handleDelete = (postId: string) => {
    deleteBtsPost(postId, filmId);
    emitBtsChange();
  };

  return (
    <section
      aria-labelledby="bts-heading"
      className="rounded border border-cut-border bg-cut-mist"
    >
      <div className="border-b border-cut-border px-4 py-3 sm:px-5">
        <h2
          id="bts-heading"
          className="font-serif text-xl text-cut-charcoal sm:text-2xl"
        >
          Progress / BTS
        </h2>
        <p className="mt-1 text-sm text-cut-muted">
          Behind-the-scenes notes from the filmmaker for {filmTitle}.
        </p>
      </div>

      <div className="space-y-4 p-4 sm:p-5">
        {ownerMatch && address ? (
          <BtsComposer
            filmId={filmId}
            authorWallet={address}
            onCreated={handleCreated}
          />
        ) : (
          <OwnerGate
            isConnected={isConnected}
            owner={owner}
            onClaim={handleClaim}
          />
        )}

        {posts.length === 0 ? (
          <EmptyFeed isOwner={ownerMatch} />
        ) : (
          <ul className="space-y-3">
            {posts.map((post) => (
              <BtsPostCard
                key={post.id}
                post={post}
                canDelete={
                  !!address &&
                  post.authorWallet.toLowerCase() === address.toLowerCase()
                }
                onDelete={() => handleDelete(post.id)}
              />
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

function OwnerGate({
  isConnected,
  owner,
  onClaim,
}: {
  isConnected: boolean;
  owner: string | undefined;
  onClaim: () => void;
}) {
  return (
    <div className="rounded border border-dashed border-cut-border bg-cut-cream px-3 py-3 text-sm text-cut-muted">
      {!isConnected ? (
        <p>
          Connect the filmmaker wallet to post Progress / BTS updates. Everyone
          can read the feed.
        </p>
      ) : (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p>
            Only the project owner can post.
            {owner ? (
              <>
                {" "}
                Owner:{" "}
                <span className="font-mono text-cut-charcoal">
                  {truncateWallet(owner)}
                </span>
              </>
            ) : null}
          </p>
          <button
            type="button"
            onClick={onClaim}
            className="shrink-0 rounded border border-cut-charcoal px-3 py-1.5 text-xs text-cut-charcoal hover:bg-cut-charcoal hover:text-cut-cream"
          >
            Claim filmmaker (local demo)
          </button>
        </div>
      )}
    </div>
  );
}

function EmptyFeed({ isOwner }: { isOwner: boolean }) {
  return (
    <div className="rounded border border-cut-border bg-cut-cream px-4 py-8 text-center">
      <p className="text-sm text-cut-muted">
        {isOwner
          ? "No Progress / BTS posts yet. Share a note, still, or short for your backers."
          : "No Progress / BTS posts yet. Check back when the filmmaker shares an update."}
      </p>
    </div>
  );
}

function BtsComposer({
  filmId,
  authorWallet,
  onCreated,
}: {
  filmId: string;
  authorWallet: string;
  onCreated: () => void;
}) {
  const [text, setText] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [filePreview, setFilePreview] = useState<string | undefined>();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const onFile = (file: File | null) => {
    if (!file) {
      setFilePreview(undefined);
      return;
    }
    if (!file.type.startsWith("image/")) {
      setError("Choose an image file.");
      return;
    }
    if (file.size > 1_500_000) {
      setError(
        "Image too large for local demo (max ~1.5 MB). Use an image URL instead.",
      );
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setFilePreview(reader.result);
        setImageUrl("");
        setError(null);
      }
    };
    reader.readAsDataURL(file);
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const resolvedImage = filePreview || imageUrl.trim() || undefined;
      if (youtubeUrl.trim() && !parseYoutubeId(youtubeUrl)) {
        throw new Error("Enter a valid YouTube or YouTube Shorts URL.");
      }
      createBtsPost({
        filmId,
        text,
        imageUrl: resolvedImage,
        youtubeUrl: youtubeUrl.trim() || undefined,
        authorWallet,
      });
      setText("");
      setImageUrl("");
      setYoutubeUrl("");
      setFilePreview(undefined);
      onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not post.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form
      onSubmit={submit}
      className="space-y-3 rounded border border-cut-border bg-cut-cream p-3 sm:p-4"
    >
      <p className="text-xs font-semibold tracking-wide text-cut-muted uppercase">
        New update · {truncateWallet(authorWallet)}
      </p>
      <label className="block">
        <span className="sr-only">Note</span>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={3}
          placeholder="Share a note from set, a still, or a short…"
          className="w-full resize-y rounded border border-cut-border bg-cut-mist px-3 py-2 text-sm text-cut-charcoal placeholder:text-cut-muted focus:border-cut-charcoal focus:outline-none"
        />
      </label>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block text-xs text-cut-muted">
          Image URL
          <input
            type="url"
            value={imageUrl}
            onChange={(e) => {
              setImageUrl(e.target.value);
              if (e.target.value) setFilePreview(undefined);
            }}
            placeholder="https://…"
            className="mt-1 w-full rounded border border-cut-border bg-cut-mist px-3 py-2 text-sm text-cut-charcoal placeholder:text-cut-muted focus:border-cut-charcoal focus:outline-none"
          />
        </label>
        <label className="block text-xs text-cut-muted">
          Or image file (local preview)
          <input
            type="file"
            accept="image/*"
            onChange={(e) => onFile(e.target.files?.[0] ?? null)}
            className="mt-1 block w-full text-sm text-cut-muted file:mr-2 file:rounded file:border file:border-cut-border file:bg-cut-mist file:px-2 file:py-1 file:text-cut-charcoal"
          />
        </label>
      </div>
      <label className="block text-xs text-cut-muted">
        YouTube / Shorts link
        <input
          type="url"
          value={youtubeUrl}
          onChange={(e) => setYoutubeUrl(e.target.value)}
          placeholder="https://youtube.com/shorts/…"
          className="mt-1 w-full rounded border border-cut-border bg-cut-mist px-3 py-2 text-sm text-cut-charcoal placeholder:text-cut-muted focus:border-cut-charcoal focus:outline-none"
        />
      </label>
      {(filePreview || imageUrl) && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={filePreview || imageUrl}
          alt="Preview"
          className="max-h-40 rounded border border-cut-border object-cover"
        />
      )}
      {error ? <p className="text-sm text-red-400">{error}</p> : null}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={busy}
          className="rounded border border-cut-charcoal bg-cut-charcoal px-4 py-1.5 text-sm text-cut-cream hover:opacity-90 disabled:opacity-50"
        >
          {busy ? "Posting…" : "Post update"}
        </button>
      </div>
    </form>
  );
}

function BtsPostCard({
  post,
  canDelete,
  onDelete,
}: {
  post: BtsPost;
  canDelete: boolean;
  onDelete: () => void;
}) {
  const ytId = post.youtubeUrl ? parseYoutubeId(post.youtubeUrl) : null;

  return (
    <li className="rounded border border-cut-border bg-cut-cream p-3 sm:p-4">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-xs text-cut-muted">
        <span>
          <span className="font-mono text-cut-charcoal">
            {truncateWallet(post.authorWallet)}
          </span>
          <span className="mx-1.5">·</span>
          <time dateTime={post.createdAt}>{formatBtsTime(post.createdAt)}</time>
          <span className="ml-1.5 text-cut-muted">(ET)</span>
        </span>
        {canDelete ? (
          <button
            type="button"
            onClick={onDelete}
            className="text-cut-muted hover:text-cut-charcoal"
          >
            Delete
          </button>
        ) : null}
      </div>
      {post.text ? (
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-cut-charcoal">
          {post.text}
        </p>
      ) : null}
      {post.imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={post.imageUrl}
          alt=""
          className="mt-3 max-h-80 w-full rounded border border-cut-border object-cover"
        />
      ) : null}
      {ytId ? (
        <div className="mt-3 aspect-[9/16] max-h-96 w-full max-w-xs overflow-hidden rounded border border-cut-border bg-black sm:aspect-video sm:max-h-none sm:max-w-lg">
          <iframe
            title="YouTube Short"
            src={`https://www.youtube.com/embed/${ytId}`}
            className="h-full w-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      ) : post.youtubeUrl ? (
        <a
          href={post.youtubeUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 inline-block text-sm text-cut-charcoal underline"
        >
          Watch on YouTube
        </a>
      ) : null}
    </li>
  );
}
