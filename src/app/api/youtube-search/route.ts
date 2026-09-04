export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export type YoutubeResult = {
  videoId: string;
  title: string;
  channel: string;
  duration: number | null;
  views: number | null;
  thumbnail: string | null;
};

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36";

/** `sp=EgIQAQ%3D%3D` — results filtered to videos, ranked by relevance. */
const VIDEOS_ONLY = "EgIQAQ%3D%3D";

/**
 * Results are cached per query for an hour, both because the same searches
 * repeat and to keep this from hitting YouTube once per keystroke's worth
 * of debounce across everyone on the site.
 */
const CACHE_TTL_MS = 60 * 60 * 1000;
const cache = new Map<string, { at: number; results: YoutubeResult[] }>();

function walk(node: unknown): Generator<Record<string, unknown>> {
  function* inner(o: unknown): Generator<Record<string, unknown>> {
    if (Array.isArray(o)) {
      for (const v of o) yield* inner(v);
    } else if (o && typeof o === "object") {
      const obj = o as Record<string, unknown>;
      if (obj.videoRenderer) yield obj.videoRenderer as Record<string, unknown>;
      for (const v of Object.values(obj)) yield* inner(v);
    }
  }
  return inner(node);
}

function text(node: unknown): string {
  const n = node as { simpleText?: string; runs?: { text: string }[] } | undefined;
  if (!n) return "";
  if (typeof n.simpleText === "string") return n.simpleText;
  if (Array.isArray(n.runs)) return n.runs.map((r) => r.text).join("");
  return "";
}

function seconds(label: string): number | null {
  if (!/^\d+(:\d{2})+$/.test(label)) return null;
  return label.split(":").reduce((total, part) => total * 60 + Number(part), 0);
}

function parse(html: string): YoutubeResult[] {
  // [\s\S] instead of the `s` flag, which this tsconfig target rejects.
  const match = html.match(/var ytInitialData = (\{[\s\S]*?\});<\/script>/);
  if (!match) return [];
  let data: unknown;
  try {
    data = JSON.parse(match[1]);
  } catch {
    return [];
  }

  const results: YoutubeResult[] = [];
  const seen = new Set<string>();
  for (const v of walk(data)) {
    const videoId = typeof v.videoId === "string" ? v.videoId : null;
    if (!videoId || seen.has(videoId)) continue;
    const title = text(v.title);
    if (!title) continue;
    // Live streams and premieres have no length and don't behave like a
    // track in a playlist, so they're left out.
    const duration = seconds(text(v.lengthText));
    if (duration === null) continue;
    seen.add(videoId);

    const viewLabel = text(v.viewCountText).replace(/[^\d]/g, "");
    const thumbs = (
      v.thumbnail as { thumbnails?: { url: string; width: number }[] } | undefined
    )?.thumbnails;

    results.push({
      videoId,
      title,
      channel: text(v.ownerText) || text(v.longBylineText),
      duration,
      views: viewLabel ? Number(viewLabel) : null,
      thumbnail: thumbs?.length ? thumbs[0].url : null,
    });
    if (results.length >= 12) break;
  }
  return results;
}

/**
 * Searches YouTube for songs that aren't in the curated playlist, so a
 * visitor can hear what they came for instead of hitting a dead end.
 *
 * This reads YouTube's public results page rather than the Data API — the
 * app has no API key, and the whole point is that it works on a fresh
 * deploy with nothing to configure. That also means it can break if
 * YouTube reshapes that page, so every failure is soft: the caller gets an
 * empty list or an error and the playlist carries on as before.
 */
export async function GET(request: Request) {
  const q = new URL(request.url).searchParams.get("q")?.trim() ?? "";
  if (q.length < 2 || q.length > 80) {
    return Response.json({ results: [] });
  }

  const key = q.toLowerCase();
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < CACHE_TTL_MS) {
    return Response.json({ results: hit.results });
  }

  const url =
    "https://www.youtube.com/results?search_query=" +
    encodeURIComponent(q) +
    "&sp=" +
    VIDEOS_ONLY +
    "&hl=en&gl=IN";

  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": UA,
        "Accept-Language": "en-US,en;q=0.9",
        // Datacentre IPs (which is what this runs on) often get YouTube's
        // consent interstitial instead of results; pre-answering it keeps
        // the real page coming back.
        Cookie: "CONSENT=YES+cb; SOCS=CAI",
      },
      signal: AbortSignal.timeout(8000),
      cache: "no-store",
    });
    if (!response.ok) {
      return Response.json({ results: [], error: "unavailable" }, { status: 502 });
    }
    const results = parse(await response.text());
    cache.set(key, { at: Date.now(), results });
    // Keep the map from growing without bound on a long-lived instance.
    if (cache.size > 200) {
      for (const [k, v] of cache) {
        if (Date.now() - v.at > CACHE_TTL_MS) cache.delete(k);
      }
    }
    return Response.json({ results });
  } catch {
    return Response.json({ results: [], error: "unavailable" }, { status: 502 });
  }
}
