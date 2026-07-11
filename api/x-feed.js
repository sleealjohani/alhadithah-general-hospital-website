/*
 * Live @AljoufCluster feed for the homepage — Vercel serverless function.
 *
 * Vercel maps this file to the /api/x-feed route automatically, so the client
 * keeps calling /api/x-feed exactly as before (no redirect config needed).
 *
 * How it works: the Supabase external_feed_cache table is populated every few
 * minutes by the scheduled GitHub Action (which runs on an IP X actually
 * serves). This function returns that cached copy first; if it's stale it makes
 * a best-effort live syndication fetch, and falls back to the stale cache if
 * that fetch is blocked (as it usually is from datacenter IPs).
 */

const HANDLE = "AljoufCluster";
const DAY_MS = 24 * 60 * 60 * 1000;
const CACHE_MINUTES = 10;
const SYNDICATION_URL = `https://syndication.twitter.com/srv/timeline-profile/screen-name/${HANDLE}`;
const BROWSER_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";

function clampNumber(value, min, max, fallback) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, Math.floor(parsed)));
}

function getEnv(name) {
  return process.env[name]?.trim() || "";
}

function getCacheKey(days, limit) {
  return `x-feed:${HANDLE.toLowerCase()}:days-${days}:limit-${limit}`;
}

function getSupabaseConfig() {
  const url = getEnv("SUPABASE_URL") || getEnv("VITE_SUPABASE_URL");
  const serviceRoleKey = getEnv("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !serviceRoleKey) return null;
  return {
    headers: {
      apikey: serviceRoleKey,
      authorization: `Bearer ${serviceRoleKey}`,
      "content-type": "application/json"
    },
    url: url.replace(/\/$/, "")
  };
}

async function readCache(cacheKey) {
  const config = getSupabaseConfig();
  if (!config) return null;
  const url = `${config.url}/rest/v1/external_feed_cache?cache_key=eq.${encodeURIComponent(cacheKey)}&select=payload,fetched_at,expires_at&limit=1`;
  const response = await fetch(url, { headers: config.headers });
  if (!response.ok) return null;
  const rows = await response.json();
  return rows[0] || null;
}

async function writeCache(cacheKey, payload) {
  const config = getSupabaseConfig();
  if (!config) return;
  const now = new Date();
  const expiresAt = new Date(now.getTime() + CACHE_MINUTES * 60 * 1000);
  await fetch(`${config.url}/rest/v1/external_feed_cache?on_conflict=cache_key`, {
    method: "POST",
    headers: { ...config.headers, prefer: "resolution=merge-duplicates" },
    body: JSON.stringify({
      cache_key: cacheKey,
      expires_at: expiresAt.toISOString(),
      fetched_at: now.toISOString(),
      payload,
      source: payload.source || "x-syndication"
    })
  });
}

function permalinkFor(tweet) {
  if (tweet.permalink) return `https://x.com${tweet.permalink}`;
  return `https://x.com/${HANDLE}/status/${tweet.id_str || tweet.id}`;
}

/* Strip a trailing t.co link (usually the self-permalink or media link). */
function cleanText(text) {
  return String(text || "")
    .replace(/\s*https:\/\/t\.co\/\w+\s*$/g, "")
    .trim();
}

function extractMedia(tweet) {
  const details = tweet.mediaDetails || tweet.extended_entities?.media || tweet.entities?.media || [];
  return details
    .map((item) => {
      const url = item.media_url_https || item.media_url || item.preview_image_url;
      if (!url) return null;
      return {
        type: item.type === "photo" ? "photo" : "video",
        url,
        expandedUrl: permalinkFor(tweet)
      };
    })
    .filter(Boolean)
    .slice(0, 4);
}

/* Free path: X syndication timeline (no token) — the only strategy. */
async function fetchLive(days, limit) {
  const response = await fetch(`${SYNDICATION_URL}?showReplies=false&lang=ar`, {
    headers: {
      "user-agent": BROWSER_UA,
      accept: "text/html,application/xhtml+xml",
      "accept-language": "ar,en;q=0.8",
      referer: "https://platform.twitter.com/"
    }
  });
  if (!response.ok) throw new Error(`syndication_${response.status}`);

  const html = await response.text();
  const match = html.match(/<script id="__NEXT_DATA__" type="application\/json">(.*?)<\/script>/s);
  if (!match) throw new Error("syndication_no_data");

  const data = JSON.parse(match[1]);
  const entries = data?.props?.pageProps?.timeline?.entries || [];

  const items = entries
    .map((entry) => entry?.content?.tweet)
    .filter(Boolean)
    .map((tweet) => ({
      id: tweet.id_str || tweet.id,
      createdAt: new Date(tweet.created_at).toISOString(),
      text: cleanText(tweet.full_text || tweet.text),
      url: permalinkFor(tweet),
      media: extractMedia(tweet)
    }))
    .filter((item) => item.id && item.text)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const newest = items[0];
  const isRecentWindow = newest ? Date.now() - new Date(newest.createdAt).getTime() <= days * DAY_MS : false;

  return {
    generatedAt: new Date().toISOString(),
    handle: HANDLE,
    isRecentWindow,
    isStale: false,
    items: items.slice(0, limit),
    profileUrl: `https://x.com/${HANDLE}`,
    source: "x-syndication",
    windowDays: days
  };
}

export default async function handler(req, res) {
  res.setHeader("access-control-allow-origin", "*");

  if (req.method === "OPTIONS") {
    res.setHeader("cache-control", "public, max-age=300");
    res.status(204).end();
    return;
  }

  const query = req.query || {};
  const days = clampNumber(query.days, 1, 30, 7);
  const limit = clampNumber(query.limit, 1, 8, 5);
  const cacheKey = getCacheKey(days, limit);
  const cached = await readCache(cacheKey).catch(() => null);
  const cachedPayload = cached?.payload || null;
  const isCacheFresh = cached?.expires_at ? new Date(cached.expires_at).getTime() > Date.now() : false;

  const send = (body, cacheSeconds = 120) => {
    res.setHeader(
      "cache-control",
      `public, max-age=${cacheSeconds}, s-maxage=${cacheSeconds}, stale-while-revalidate=600`
    );
    res.setHeader("content-type", "application/json; charset=utf-8");
    res.status(200).json(body);
  };

  if (cachedPayload && isCacheFresh) {
    send({ ...cachedPayload, isStale: false, source: "supabase-cache" });
    return;
  }

  try {
    const livePayload = await fetchLive(days, limit);
    await writeCache(cacheKey, livePayload).catch(() => undefined);
    send(livePayload);
  } catch (error) {
    if (cachedPayload) {
      send({
        ...cachedPayload,
        error: error instanceof Error ? error.message : "x_feed_unavailable",
        isStale: true,
        source: "supabase-cache"
      });
      return;
    }
    send({
      error: error instanceof Error ? error.message : "x_feed_unavailable",
      handle: HANDLE,
      isRecentWindow: false,
      isStale: false,
      items: [],
      profileUrl: `https://x.com/${HANDLE}`,
      source: "error",
      windowDays: days
    });
  }
}
