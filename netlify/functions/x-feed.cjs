/* global exports, fetch */

const HANDLE = "AljoufCluster";
const DAY_MS = 24 * 60 * 60 * 1000;

function clampNumber(value, min, max, fallback) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, Math.floor(parsed)));
}

function json(statusCode, body) {
  return {
    statusCode,
    headers: {
      "access-control-allow-origin": "*",
      "cache-control": "public, max-age=300, s-maxage=600, stale-while-revalidate=1800",
      "content-type": "application/json; charset=utf-8"
    },
    body: JSON.stringify(body)
  };
}

function extractNextData(html) {
  const match = html.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]+?)<\/script>/);
  if (!match) return null;
  return JSON.parse(match[1]);
}

function visibleTweetText(tweet) {
  const text = tweet.full_text || tweet.text || "";
  const range = tweet.display_text_range;
  if (!Array.isArray(range) || range.length < 2) return text.trim();
  return text.slice(range[0], range[1]).trim();
}

function mediaFromTweet(tweet) {
  const media = tweet.extended_entities?.media || tweet.entities?.media || [];
  const seen = new Set();

  return media
    .map((item) => {
      const imageUrl = item.media_url_https || item.media_url;
      if (!imageUrl || seen.has(imageUrl)) return null;
      seen.add(imageUrl);

      return {
        expandedUrl: item.expanded_url || `https://x.com/${HANDLE}/status/${tweet.id_str}`,
        type: item.type || (item.video_info ? "video" : "photo"),
        url: imageUrl
      };
    })
    .filter(Boolean)
    .slice(0, 4);
}

function normalizeTweet(tweet) {
  if (!tweet?.id_str || !tweet.created_at) return null;
  const createdAt = new Date(tweet.created_at);
  if (Number.isNaN(createdAt.getTime())) return null;

  return {
    createdAt: createdAt.toISOString(),
    id: tweet.id_str,
    media: mediaFromTweet(tweet),
    text: visibleTweetText(tweet),
    url: tweet.permalink ? `https://x.com${tweet.permalink}` : `https://x.com/${HANDLE}/status/${tweet.id_str}`
  };
}

function uniqueTweets(items) {
  const seen = new Set();
  return items.filter((item) => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
}

exports.handler = async (event) => {
  const days = clampNumber(event.queryStringParameters?.days, 1, 30, 7);
  const limit = clampNumber(event.queryStringParameters?.limit, 1, 8, 5);
  const sourceUrl = `https://syndication.twitter.com/srv/timeline-profile/screen-name/${HANDLE}?lang=ar&limit=20&maxHeight=900px&theme=light`;

  try {
    const response = await fetch(sourceUrl, {
      headers: {
        "accept": "text/html,application/xhtml+xml",
        "user-agent": "Mozilla/5.0 (compatible; AlHadithahHospitalPortal/1.0)"
      }
    });

    if (!response.ok) {
      return json(response.status, {
        error: "x_feed_unavailable",
        items: []
      });
    }

    const data = extractNextData(await response.text());
    const entries = data?.props?.pageProps?.timeline?.entries || [];
    const items = uniqueTweets(
      entries
        .map((entry) => normalizeTweet(entry?.content?.tweet))
        .filter(Boolean)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    );

    const cutoff = Date.now() - days * DAY_MS;
    const recentItems = items.filter((item) => new Date(item.createdAt).getTime() >= cutoff);
    const selectedItems = (recentItems.length > 0 ? recentItems : items).slice(0, limit);

    return json(200, {
      generatedAt: new Date().toISOString(),
      handle: HANDLE,
      isRecentWindow: recentItems.length > 0,
      items: selectedItems,
      profileUrl: `https://x.com/${HANDLE}`,
      windowDays: days
    });
  } catch {
    return json(502, {
      error: "x_feed_fetch_failed",
      items: []
    });
  }
};
