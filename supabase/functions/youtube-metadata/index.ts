// ==========================================================
// ROFFLE
// YOUTUBE METADATA EDGE FUNCTION
// Server-side YouTube oEmbed lookup.
// No YouTube API key required.
// ==========================================================

import "jsr:@supabase/functions-js/edge-runtime.d.ts";


const CORS_HEADERS = {
  "Access-Control-Allow-Origin":
    "*",

  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",

  "Access-Control-Allow-Methods":
    "POST, OPTIONS",

  "Content-Type":
    "application/json",
};


function jsonResponse(
  payload:
    Record<string, unknown>,
  status = 200,
) {
  return new Response(
    JSON.stringify(
      payload
    ),
    {
      status,
      headers:
        CORS_HEADERS,
    }
  );
}


function normalizeYouTubeUrl(
  rawValue:
    unknown,
) {
  if (
    typeof rawValue !==
    "string"
  ) {
    return null;
  }

  const value =
    rawValue.trim();

  if (!value) {
    return null;
  }

  let url:
    URL;

  try {
    url =
      new URL(
        value
      );
  } catch {
    return null;
  }

  const host =
    url.hostname
      .replace(
        /^www\./,
        ""
      )
      .toLowerCase();

  const allowed =
    host ===
      "youtube.com" ||
    host ===
      "m.youtube.com" ||
    host ===
      "music.youtube.com" ||
    host ===
      "youtu.be";

  if (!allowed) {
    return null;
  }

  return url.toString();
}


Deno.serve(
  async (
    request
  ) => {
    if (
      request.method ===
      "OPTIONS"
    ) {
      return new Response(
        "ok",
        {
          headers:
            CORS_HEADERS,
        }
      );
    }

    if (
      request.method !==
      "POST"
    ) {
      return jsonResponse(
        {
          error:
            "Method not allowed.",
        },
        405
      );
    }

    let body:
      Record<string, unknown>;

    try {
      body =
        await request.json();
    } catch {
      return jsonResponse(
        {
          error:
            "Invalid request body.",
        },
        400
      );
    }

    const youtubeUrl =
      normalizeYouTubeUrl(
        body.url
      );

    if (!youtubeUrl) {
      return jsonResponse(
        {
          error:
            "Invalid YouTube URL.",
        },
        400
      );
    }

    const endpoint =
      new URL(
        "https://www.youtube.com/oembed"
      );

    endpoint.searchParams.set(
      "url",
      youtubeUrl
    );

    endpoint.searchParams.set(
      "format",
      "json"
    );


    try {
      const response =
        await fetch(
          endpoint
        );

      if (!response.ok) {
        return jsonResponse(
          {
            error:
              "YouTube metadata lookup failed.",
          },
          response.status
        );
      }

      const payload =
        await response.json() as {
          title?: string;
          author_name?: string;
          thumbnail_url?: string;
        };

      const title =
        payload.title
          ?.trim();

      if (!title) {
        return jsonResponse(
          {
            error:
              "YouTube did not return a title.",
          },
          502
        );
      }

      return jsonResponse(
        {
          title,

          authorName:
            payload.author_name
              ?.trim() ??
            null,

          thumbnailUrl:
            payload.thumbnail_url
              ?.trim() ??
            null,
        }
      );
    } catch (
      error
    ) {
      console.error(
        "ROFFLE YOUTUBE METADATA ERROR:",
        error
      );

      return jsonResponse(
        {
          error:
            "Could not contact YouTube.",
        },
        502
      );
    }
  }
);
