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
const SYNDICATION_BASE = `https://syndication.twitter.com/srv/timeline-profile/screen-name/${HANDLE}`;
/* Tried in order until one returns parseable tweets — resilience against a
   transient block, a language quirk, or a small endpoint change. */
const URL_VARIANTS = [
  `${SYNDICATION_BASE}?showReplies=false&lang=ar`,
  `${SYNDICATION_BASE}?showReplies=false&lang=en`,
  `${SYNDICATION_BASE}?showReplies=true&lang=ar`,
  SYNDICATION_BASE
];
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

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

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

function parseTweets(html) {
  const match = html.match(/<script id="__NEXT_DATA__" type="application\/json">(.*?)<\/script>/s);
  if (!match) return [];
  let data;
  try {
    data = JSON.parse(match[1]);
  } catch {
    return [];
  }
  const entries = data?.props?.pageProps?.timeline?.entries || [];
  return entries
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
}

/* Try each URL variant, each with a few retries + backoff, until tweets parse. */
async function fetchTweets() {
  for (const url of URL_VARIANTS) {
    for (let attempt = 1; attempt <= 3; attempt += 1) {
      try {
        const response = await fetch(url, {
          headers: {
            "user-agent": UA,
            accept: "text/html,application/xhtml+xml",
            "accept-language": "ar,en;q=0.8",
            referer: "https://platform.twitter.com/"
          }
        });
        if (response.ok) {
          const tweets = parseTweets(await response.text());
          if (tweets.length > 0) {
            console.log(`Fetched ${tweets.length} tweets from ${url}`);
            return tweets;
          }
          console.warn(`No tweets parsed from ${url} (attempt ${attempt}).`);
        } else {
          console.warn(`HTTP ${response.status} from ${url} (attempt ${attempt}).`);
        }
      } catch (error) {
        console.warn(`Fetch error from ${url} (attempt ${attempt}):`, error.message);
      }
      await sleep(attempt * 1500);
    }
  }
  return [];
}

const all = await fetchTweets();
if (all.length === 0) {
  console.error("Could not retrieve any tweets from any syndication variant.");
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
