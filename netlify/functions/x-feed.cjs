/* global exports, fetch, process, URLSearchParams */

/*
 * Live @AljoufCluster feed for the homepage.
 *
 * Order of attempts:
 *   1. X API v2 recent search — only if X_BEARER_TOKEN is set (paid tier).
 *   2. X syndication timeline — free, no token, server-side (the same data
 *      X's own embed widget uses). This is the default and works without any
 *      paid API access.
 * Results are cached in Supabase (external_feed_cache) when configured, and a
 * stale cached copy is served if a live fetch fails.
 */

const HANDLE = "AljoufCluster";
const DAY_MS = 24 * 60 * 60 * 1000;
const CACHE_MINUTES = 10;
const X_RECENT_SEARCH_URL = "https://api.x.com/2/tweets/search/recent";
const SYNDICATION_URL = `https://syndication.twitter.com/srv/timeline-profile/screen-name/${HANDLE}`;
const BROWSER_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";

function clampNumber(value, min, max, fallback) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, Math.floor(parsed)));
}

function json(statusCode, body, cacheSeconds = 120) {
  return {
    statusCode,
    headers: {
      "access-control-allow-origin": "*",
      "cache-control": `public, max-age=${cacheSeconds}, s-maxage=${cacheSeconds}, stale-while-revalidate=600`,
      "content-type": "application/json; charset=utf-8"
    },
    body: JSON.stringify(body)
  };
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

/* --- Free path: X syndication timeline (no token) ------------------------ */
async function fetchFromSyndication(days, limit) {
  const response = await fetch(`${SYNDICATION_URL}?showReplies=false&lang=ar`, {
    headers: { "user-agent": BROWSER_UA, accept: "text/html" }
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

/* --- Optional paid path: X API v2 recent search -------------------------- */
function buildRecentSearchUrl(days, limit) {
  const params = new URLSearchParams({
    expansions: "attachments.media_keys,author_id",
    max_results: String(Math.max(10, Math.min(100, limit * 2))),
    "media.fields": "alt_text,preview_image_url,type,url",
    query: `from:${HANDLE} -is:retweet`,
    sort_order: "recency",
    start_time: new Date(Date.now() - days * DAY_MS).toISOString(),
    "tweet.fields": "attachments,created_at,entities",
    "user.fields": "name,profile_image_url,username"
  });
  return `${X_RECENT_SEARCH_URL}?${params.toString()}`;
}

async function fetchFromApi(days, limit) {
  const bearerToken = getEnv("X_BEARER_TOKEN");
  if (!bearerToken) throw new Error("missing_x_bearer_token");

  const response = await fetch(buildRecentSearchUrl(days, limit), {
    headers: { authorization: `Bearer ${bearerToken}` }
  });
  if (!response.ok) throw new Error(`x_api_${response.status}`);

  const payload = await response.json();
  const mediaMap = new Map((payload.includes?.media || []).map((m) => [m.media_key, m]));
  const items = (payload.data || [])
    .map((tweet) => ({
      id: tweet.id,
      createdAt: tweet.created_at,
      text: cleanText(tweet.text),
      url: `https://x.com/${HANDLE}/status/${tweet.id}`,
      media: (tweet.attachments?.media_keys || [])
        .map((k) => mediaMap.get(k))
        .filter(Boolean)
        .map((m) => ({
          type: m.type || "photo",
          url: m.url || m.preview_image_url,
          expandedUrl: `https://x.com/${HANDLE}/status/${tweet.id}`
        }))
        .filter((m) => m.url)
        .slice(0, 4)
    }))
    .filter((item) => item.id && item.createdAt && item.text)
    .slice(0, limit);

  return {
    generatedAt: new Date().toISOString(),
    handle: HANDLE,
    isRecentWindow: true,
    isStale: false,
    items,
    profileUrl: `https://x.com/${HANDLE}`,
    source: "x-api",
    windowDays: days
  };
}

async function fetchLive(days, limit) {
  /* Prefer the paid API only when a token is present; otherwise use the free
     syndication feed. If the API path errors, fall back to syndication. */
  if (getEnv("X_BEARER_TOKEN")) {
    try {
      return await fetchFromApi(days, limit);
    } catch {
      /* fall through to the free path */
    }
  }
  return fetchFromSyndication(days, limit);
}

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return json(204, {}, 300);
  }

  const days = clampNumber(event.queryStringParameters?.days, 1, 30, 7);
  const limit = clampNumber(event.queryStringParameters?.limit, 1, 8, 5);
  const cacheKey = getCacheKey(days, limit);
  const cached = await readCache(cacheKey).catch(() => null);
  const cachedPayload = cached?.payload || null;
  const isCacheFresh = cached?.expires_at ? new Date(cached.expires_at).getTime() > Date.now() : false;

  if (cachedPayload && isCacheFresh) {
    return json(200, { ...cachedPayload, isStale: false, source: "supabase-cache" });
  }

  try {
    const livePayload = await fetchLive(days, limit);
    await writeCache(cacheKey, livePayload).catch(() => undefined);
    return json(200, livePayload);
  } catch (error) {
    if (cachedPayload) {
      return json(200, {
        ...cachedPayload,
        error: error instanceof Error ? error.message : "x_feed_unavailable",
        isStale: true,
        source: "supabase-cache"
      });
    }
    return json(200, {
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
};
