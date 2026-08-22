export type YouTubeVideoType = "short" | "video";

export type ParsedYouTubeUrl = {
  youtubeId: string;
  videoType: YouTubeVideoType;
  canonicalUrl: string;
  embedUrl: string;
};

const YOUTUBE_ID_PATTERN = /^[A-Za-z0-9_-]{6,20}$/;

export function parseYouTubeUrl(rawValue: string): ParsedYouTubeUrl | null {
  const value = rawValue.trim();

  if (!value) {
    return null;
  }

  let url: URL;

  try {
    url = new URL(value);
  } catch {
    return null;
  }

  const host = url.hostname.replace(/^www\./, "").toLowerCase();

  let youtubeId = "";
  let videoType: YouTubeVideoType = "video";

  if (host === "youtu.be") {
    youtubeId = url.pathname.split("/").filter(Boolean)[0] ?? "";
  } else if (
    host === "youtube.com" ||
    host === "m.youtube.com" ||
    host === "music.youtube.com"
  ) {
    const parts = url.pathname.split("/").filter(Boolean);

    if (parts[0] === "shorts") {
      youtubeId = parts[1] ?? "";
      videoType = "short";
    } else if (parts[0] === "embed") {
      youtubeId = parts[1] ?? "";
    } else if (parts[0] === "live") {
      youtubeId = parts[1] ?? "";
    } else {
      youtubeId = url.searchParams.get("v") ?? "";
    }
  } else {
    return null;
  }

  youtubeId = youtubeId.split(/[?&#/]/)[0];

  if (!YOUTUBE_ID_PATTERN.test(youtubeId)) {
    return null;
  }

  return {
    youtubeId,
    videoType,
    canonicalUrl:
      videoType === "short"
        ? `https://www.youtube.com/shorts/${youtubeId}`
        : `https://www.youtube.com/watch?v=${youtubeId}`,
    embedUrl: `https://www.youtube.com/embed/${youtubeId}?rel=0&modestbranding=1`,
  };
}
