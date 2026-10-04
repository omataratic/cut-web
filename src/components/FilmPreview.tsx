import type { Film } from "@/lib/mock-films";

/** YouTube ids are 11 characters. Reject anything else so the embed URL stays fixed. */
const YOUTUBE_ID = /^[A-Za-z0-9_-]{11}$/;

type FilmPreviewProps = {
  title: string;
  youtubeId?: Film["youtubeId"];
  still?: string | null;
};

export function FilmPreview({ title, youtubeId, still }: FilmPreviewProps) {
  const id = youtubeId && YOUTUBE_ID.test(youtubeId) ? youtubeId : null;

  if (id) {
    return (
      <div className="mb-5 aspect-[16/9] overflow-hidden rounded border border-cut-border bg-black">
        <iframe
          title={`${title} preview`}
          src={`https://www.youtube.com/embed/${id}`}
          className="h-full w-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
        />
      </div>
    );
  }

  if (still) {
    return (
      <div className="mb-5 aspect-[16/9] overflow-hidden rounded border border-cut-border bg-black">
        {/* Sample still, not a playable preview. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={still} alt="" className="h-full w-full object-cover" />
      </div>
    );
  }

  return (
    <div className="mb-5 flex aspect-[16/9] flex-col items-center justify-center gap-3 rounded border border-cut-border bg-black px-6 text-center">
      <span
        aria-hidden
        className="flex h-16 w-16 items-center justify-center rounded-full border border-white/25 text-white/80"
      >
        <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
          <path d="M9 7.2v9.6l8.4-4.8L9 7.2z" />
        </svg>
      </span>
      <p className="font-serif text-xl text-cut-charcoal sm:text-2xl">{title}</p>
      <p className="text-xs tracking-widest text-cut-muted uppercase">
        No preview yet
      </p>
      <p className="sr-only">
        Preview frame for {title}. No video is playing.
      </p>
    </div>
  );
}
