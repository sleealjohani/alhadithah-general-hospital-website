#!/usr/bin/env node
/*
 * Refresh the @AljoufCluster X feed cache in Supabase.
 *
 * Runs on GitHub Actions (a residential-style runner X actually serves),
 * fetches the public syndication timeline, and upserts it into
 * external_feed_cache so the site's /api/x-feed function can serve it even
 * when the host's own request to X is blocked.
 *
 * Env: SUPABASE_URL (or VITE_SUPABASE_URL), SUPABASE_SERVICE_ROLE_KEY.
 */

const HANDLE = "AljoufCluster";
const SYNDICATION_URL = `https://syndication.twitter.com/srv/timeline-profile/screen-name/${HANDLE}?showReplies=false&lang=ar`;
const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";
const DAY_MS = 24 * 60 * 60 * 1000;
const DAYS = 7;
const LIMITS = [4, 5, 6, 8];

const SUPABASE_URL = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "").replace(/\/$/, "");
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

if (!SUPABASE_URL || !KEY) {
  console.error("Missing SUPABASE_URL and/or SUPABASE_SERVICE_ROLE_KEY.");
  process.exit(1);
}

function permalink(tweet) {
  return tweet.permalink
    ? `https://x.com${tweet.permalink}`
    : `https://x.com/${HANDLE}/status/${tweet.id_str || tweet.id}`;
}

function cleanText(text) {
  return String(text || "").replace(/\s*https:\/\/t\.co\/\w+\s*$/g, "").trim();
}

function extractMedia(tweet) {
  const details = tweet.mediaDetails || tweet.extended_entities?.media || tweet.entities?.media || [];
  return details
    .map((item) => {
      const url = item.media_url_https || item.media_url || item.preview_image_url;
      return url ? { type: item.type === "photo" ? "photo" : "video", url, expandedUrl: permalink(tweet) } : null;
    })
    .filter(Boolean)
    .slice(0, 4);
}

const response = await fetch(SYNDICATION_URL, {
  headers: { "user-agent": UA, accept: "text/html", "accept-language": "ar,en;q=0.8" }
});
if (!response.ok) {
  console.error("Syndication request failed:", response.status);
  process.exit(1);
}

const html = await response.text();
const match = html.match(/<script id="__NEXT_DATA__" type="application\/json">(.*?)<\/script>/s);
if (!match) {
  console.error("Could not find __NEXT_DATA__ in syndication response.");
  process.exit(1);
}

const data = JSON.parse(match[1]);
const entries = data?.props?.pageProps?.timeline?.entries || [];
const all = entries
  .map((entry) => entry?.content?.tweet)
  .filter(Boolean)
  .map((tweet) => ({
    id: tweet.id_str || tweet.id,
    createdAt: new Date(tweet.created_at).toISOString(),
    text: cleanText(tweet.full_text || tweet.text),
    url: permalink(tweet),
    media: extractMedia(tweet)
  }))
  .filter((item) => item.id && item.text)
  .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

if (all.length === 0) {
  console.error("No tweets parsed.");
  process.exit(1);
}

const now = new Date();
const expiresAt = new Date(now.getTime() + 25 * 60 * 1000).toISOString();
const isRecentWindow = Date.now() - new Date(all[0].createdAt).getTime() <= DAYS * DAY_MS;

for (const limit of LIMITS) {
  const cacheKey = `x-feed:${HANDLE.toLowerCase()}:days-${DAYS}:limit-${limit}`;
  const payload = {
    generatedAt: now.toISOString(),
    handle: HANDLE,
    isRecentWindow,
    isStale: false,
    items: all.slice(0, limit),
    profileUrl: `https://x.com/${HANDLE}`,
    source: "x-syndication-scheduled",
    windowDays: DAYS
  };
  const res = await fetch(`${SUPABASE_URL}/rest/v1/external_feed_cache?on_conflict=cache_key`, {
    method: "POST",
    headers: {
      apikey: KEY,
      authorization: `Bearer ${KEY}`,
      "content-type": "application/json",
      prefer: "resolution=merge-duplicates"
    },
    body: JSON.stringify({
      cache_key: cacheKey,
      expires_at: expiresAt,
      fetched_at: now.toISOString(),
      payload,
      source: "scheduled"
    })
  });
  if (!res.ok) {
    console.error(`Cache write failed for ${cacheKey}:`, res.status, await res.text());
    process.exit(1);
  }
  console.log(`Cached ${cacheKey}`);
}

console.log(`Done — ${all.length} tweets, latest ${all[0].createdAt.slice(0, 10)}.`);
