/** 11-character YouTube video ids. Same rule as the film embed. */
const YOUTUBE_ID = /^[A-Za-z0-9_-]{11}$/;

/**
 * Accept a normal YouTube link and return only the video id.
 * watch, youtu.be, shorts, embed, plus live and /v/ links.
 * Anything else returns null.
 */
export function youtubeIdFromLink(input: string): string | null {
  const trimmed = input.trim();
  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    return null;
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") return null;

  const host = url.hostname.toLowerCase().replace(/^www\./, "");
  const parts = url.pathname.split("/").filter(Boolean);
  let id: string | null = null;

  if (host === "youtu.be") {
    if (parts.length !== 1) return null;
    id = parts[0];
  } else if (host === "youtube.com" || host === "m.youtube.com") {
    if (parts.length === 1 && parts[0] === "watch") {
      id = url.searchParams.get("v");
    } else if (
      parts.length === 2 &&
      (parts[0] === "shorts" ||
        parts[0] === "embed" ||
        parts[0] === "live" ||
        parts[0] === "v")
    ) {
      id = parts[1];
    } else {
      return null;
    }
  } else {
    return null;
  }

  if (!id || !YOUTUBE_ID.test(id)) return null;
  return id;
}

/** Public YouTube still. Only for a real 11-character video id. */
export function youtubeThumbnailUrl(
  youtubeId: string | null | undefined,
): string | null {
  if (!youtubeId || !YOUTUBE_ID.test(youtubeId)) return null;
  return `https://i.ytimg.com/vi/${youtubeId}/hqdefault.jpg`;
}

