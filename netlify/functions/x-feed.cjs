/* global exports, fetch, process, URLSearchParams */

const HANDLE = "AljoufCluster";
const DAY_MS = 24 * 60 * 60 * 1000;
const CACHE_MINUTES = 10;
const X_RECENT_SEARCH_URL = "https://api.x.com/2/tweets/search/recent";

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
  const response = await fetch(`${config.url}/rest/v1/external_feed_cache?on_conflict=cache_key`, {
    method: "POST",
    headers: {
      ...config.headers,
      prefer: "resolution=merge-duplicates"
    },
    body: JSON.stringify({
      cache_key: cacheKey,
      expires_at: expiresAt.toISOString(),
      fetched_at: now.toISOString(),
      payload,
      source: "x-api"
    })
  });

  if (!response.ok) {
    throw new Error(`Supabase cache write failed: ${response.status}`);
  }
}

function buildRecentSearchUrl(days, limit) {
  const params = new URLSearchParams({
    "expansions": "attachments.media_keys,author_id",
    "max_results": String(Math.max(10, Math.min(100, limit * 2))),
    "media.fields": "alt_text,preview_image_url,type,url",
    "query": `from:${HANDLE} -is:retweet`,
    "sort_order": "recency",
    "start_time": new Date(Date.now() - days * DAY_MS).toISOString(),
    "tweet.fields": "attachments,created_at,entities",
    "user.fields": "name,profile_image_url,username"
  });

  return `${X_RECENT_SEARCH_URL}?${params.toString()}`;
}

function getMediaMap(includes) {
  const mediaItems = includes?.media || [];
  return new Map(mediaItems.map((item) => [item.media_key, item]));
}

function normalizeMedia(tweet, mediaMap) {
  return (tweet.attachments?.media_keys || [])
    .map((key) => mediaMap.get(key))
    .filter(Boolean)
    .map((item) => {
      const url = item.url || item.preview_image_url;
      if (!url) return null;

      return {
        altText: item.alt_text || "",
        expandedUrl: `https://x.com/${HANDLE}/status/${tweet.id}`,
        type: item.type || "photo",
        url
      };
    })
    .filter(Boolean)
    .slice(0, 4);
}

function normalizeXResponse(payload, limit) {
  const mediaMap = getMediaMap(payload.includes);

  return (payload.data || [])
    .map((tweet) => ({
      createdAt: tweet.created_at,
      id: tweet.id,
      media: normalizeMedia(tweet, mediaMap),
      text: tweet.text || "",
      url: `https://x.com/${HANDLE}/status/${tweet.id}`
    }))
    .filter((item) => item.id && item.createdAt && item.text)
    .slice(0, limit);
}

async function fetchFromX(days, limit) {
  const bearerToken = getEnv("X_BEARER_TOKEN");
  if (!bearerToken) {
    throw new Error("missing_x_bearer_token");
  }

  const response = await fetch(buildRecentSearchUrl(days, limit), {
    headers: {
      authorization: `Bearer ${bearerToken}`
    }
  });

  if (!response.ok) {
    throw new Error(`x_api_${response.status}`);
  }

  const payload = await response.json();
  const items = normalizeXResponse(payload, limit);

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

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return json(204, {}, 300);
  }

  const days = clampNumber(event.queryStringParameters?.days, 1, 7, 7);
  const limit = clampNumber(event.queryStringParameters?.limit, 1, 8, 5);
  const cacheKey = getCacheKey(days, limit);
  const cached = await readCache(cacheKey).catch(() => null);
  const cachedPayload = cached?.payload || null;
  const isCacheFresh = cached?.expires_at ? new Date(cached.expires_at).getTime() > Date.now() : false;

  if (cachedPayload && isCacheFresh) {
    return json(200, {
      ...cachedPayload,
      isStale: false,
      source: "supabase-cache"
    });
  }

  try {
    const livePayload = await fetchFromX(days, limit);
    await writeCache(cacheKey, livePayload).catch(() => undefined);
    return json(200, livePayload);
  } catch (error) {
    if (cachedPayload) {
      return json(200, {
        ...cachedPayload,
        error: error instanceof Error ? error.message : "x_feed_unavailable",
        isStale: true,
        source: "supabase-cache"
      }, 60);
    }

    return json(200, {
      error: error instanceof Error ? error.message : "x_feed_unavailable",
      generatedAt: new Date().toISOString(),
      handle: HANDLE,
      isRecentWindow: true,
      isStale: false,
      items: [],
      profileUrl: `https://x.com/${HANDLE}`,
      source: "unavailable",
      windowDays: days
    }, 60);
  }
};
