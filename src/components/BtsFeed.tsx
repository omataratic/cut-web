"use client";

import { useEffect, useState } from "react";
import {
  formatBtsTime,
  LOCAL_BTS_NOTE,
  publicLocalBtsPosts,
  type PublicBtsPost,
} from "@/lib/bts";

type BtsFeedProps = {
  filmId: string;
  filmTitle: string;
  posts: PublicBtsPost[];
};

export function BtsFeed({ filmId, filmTitle, posts }: BtsFeedProps) {
  const [localPosts, setLocalPosts] = useState<PublicBtsPost[]>([]);

  useEffect(() => {
    const load = () => setLocalPosts(publicLocalBtsPosts(filmId));
    const timer = window.setTimeout(load, 0);
    const onStorage = (event: StorageEvent) => {
      if (event.key === "cut:bts:local") load();
    };
    window.addEventListener("storage", onStorage);
    window.addEventListener("cut-bts", load);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("cut-bts", load);
    };
  }, [filmId]);

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
          Behind the scenes
        </h2>
        <p className="mt-1 text-sm text-cut-muted">
          Short updates for {filmTitle}.
        </p>
      </div>

      <div className="space-y-3 p-4 sm:p-5">
        {posts.length === 0 && localPosts.length === 0 ? (
          <p className="text-sm text-cut-muted">No updates yet.</p>
        ) : null}
        {posts.length > 0 ? (
          <ul className="space-y-3">
            {posts.map((post) => (
              <BtsPostItem key={post.id} post={post} />
            ))}
          </ul>
        ) : null}

        {localPosts.length > 0 ? (
          <div className="space-y-3">
            <p className="text-sm text-cut-muted">{LOCAL_BTS_NOTE}</p>
            <ul className="space-y-3">
              {localPosts.map((post) => (
                <BtsPostItem key={post.id} post={post} />
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </section>
  );
}

function BtsPostItem({ post }: { post: PublicBtsPost }) {
  return (
    <li className="rounded border border-cut-border bg-cut-cream p-3 sm:p-4">
      <p className="text-xs text-cut-muted">
        <time dateTime={post.createdAt}>{formatBtsTime(post.createdAt)}</time>
        <span className="ml-1.5">ET</span>
      </p>
      <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-cut-charcoal">
        {post.body}
      </p>
    </li>
  );
}
