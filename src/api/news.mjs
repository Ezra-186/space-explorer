const SNAPI_BASE = "https://api.spaceflightnewsapi.net/v4";

// Try these feeds first. Order matters for speed.
const RSS_FEEDS = [
    { site: "SpaceNews", url: "https://spacenews.com/feed/" },
    { site: "Space.com", url: "https://www.space.com/feeds/all" },
    { site: "NASA", url: "https://www.nasa.gov/rss/dyn/breaking_news.rss" },
    { site: "JPL", url: "https://www.jpl.nasa.gov/feeds/news" },
    { site: "Phys.org", url: "https://phys.org/rss-feed/space-news/" },
    { site: "NASA Blog", url: "https://blogs.nasa.gov/news/feed/" },
    { site: "ESA", url: "https://www.esa.int/rssfeed/Our_Activities/Space_Science" }
];

// Proxies. Fast ones first.
function viaJina(u) {
    return `https://r.jina.ai/${u}`;
}
const PROXIES = [
    (u) => viaJina(u),
    (u) => `https://cors.isomorphic-git.org/${u}`,
    (u) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(u)}`,
    (u) => `https://api.allorigins.win/raw?url=${encodeURIComponent(u)}`,
    (u) => `https://thingproxy.freeboard.io/fetch/${u}`
];

const https = (u) => String(u || "").replace(/^http:/, "https:");

// ONE placeholder only (put the jpg in /public for Vite)
const PLACEHOLDER_IMG = "/space_news.png";
export const NEWS_PLACEHOLDER = PLACEHOLDER_IMG;

// Memory cache for this tab (10 minutes)
const _cache = new Map();
const CACHE_TTL_MS = 10 * 60 * 1000;

// Public API
export async function getArticles({ limit = 6, search = "" } = {}) {
    try {
        const list = await fetchSnapi({ limit, search, timeoutMs: 1500 });
        if (list.length) return list;
    } catch { }

    const items = await fetchRssFast(limit, search);
    if (items.length) return items;

    throw new Error("Space news temporarily unavailable");
}

/* ---------- SNAPI (JSON) ---------- */
async function fetchSnapi({ limit, search, timeoutMs }) {
    const qs = new URLSearchParams({ limit: String(limit), ordering: "-published_at" });
    if (search) qs.set("search", search);

    const res = await fetchWithTimeout(`${SNAPI_BASE}/articles/?${qs}`, {
        cache: "no-store",
        headers: { Accept: "application/json" }
    }, timeoutMs);

    const txt = await res.text();
    const ct = res.headers.get("content-type") || "";
    if (!ct.includes("application/json")) throw new Error("SNAPI not JSON");

    const data = JSON.parse(txt);
    if (!res.ok || data?.detail) throw new Error("SNAPI error");

    return (data.results || []).map(a => ({
        id: a.id,
        title: a.title,
        site: a.news_site,
        url: https(a.url),
        image: https(a.image_url) || PLACEHOLDER_IMG,
        published: a.published_at,
        summary: a.summary || ""
    }));
}

/* ---------- RSS fast fallback ---------- */
async function fetchRssFast(limit, search) {
    const want = limit;
    const got = [];

    for (const feed of RSS_FEEDS) {
        if (got.length >= want) break;

        // cached
        const cached = readCache(feed.url);
        let items;
        if (cached) {
            items = cached;
        } else {
            items = await raceProxiesForFeed(feed, Math.max(4, want));
            if (items.length) writeCache(feed.url, items);
        }

        const filtered = search
            ? items.filter(x => matchSearch(x, search))
            : items;

        for (const a of filtered) {
            if (got.length < want) got.push(a);
            else break;
        }
    }

    // sort newest first
    got.sort((a, b) => new Date(b.published) - new Date(a.published));
    return got.slice(0, want);
}

async function raceProxiesForFeed(feed, maxItems) {
    const urls = PROXIES.map(make => make(addBust(feed.url)));
    const attempts = urls.map(u =>
        new Promise(async (resolve, reject) => {
            try {
                const out = await fetchOneRssOnce(u, feed, maxItems, 2500);
                if (out.length) resolve(out);
                else reject(new Error("empty"));
            } catch (e) {
                reject(e);
            }
        })
    );

    try {
        return await Promise.any(attempts);
    } catch {
        try {
            return await fetchOneRssOnce(addBust(feed.url), feed, maxItems, 2500);
        } catch {
            return [];
        }
    }
}

function addBust(u) {
    return u + (u.includes("?") ? "&" : "?") + "_ts=" + Date.now();
}

async function fetchOneRssOnce(url, feed, maxItems, timeoutMs) {
    const res = await fetchWithTimeout(url, { cache: "no-store" }, timeoutMs);
    const text = await res.text();

    const doc = new DOMParser().parseFromString(text, "application/xml");
    if (doc.querySelector("parsererror")) throw new Error("XML parse error");

    const items = [...doc.querySelectorAll("item")];
    const entries = items.length ? items : [...doc.querySelectorAll("entry")];
    if (!entries.length) throw new Error("No items");

    return entries.slice(0, maxItems).map((node, i) => {
        const title = qText(node, "title");
        const link = qText(node, "link") || qAttr(node, "link[href]");
        const pub = qText(node, "pubDate") || qText(node, "updated") || qText(node, "dc\\:date") || new Date().toISOString();
        const desc = qText(node, "description") || qText(node, "summary") || "";
        const img = findImage(node, desc, link);

        return {
            id: `${feed.site}-${i}-${hash(link || title)}`,
            title,
            site: feed.site,
            url: https(link),
            image: https(img || PLACEHOLDER_IMG),
            published: new Date(pub).toISOString(),
            summary: stripHtml(desc).trim()
        };
    });
}

/* ---------- helpers ---------- */
function qText(node, sel) {
    const el = node.querySelector(sel);
    return el ? (el.textContent || "").trim() : "";
}
function qAttr(node, sel) {
    const el = node.querySelector(sel);
    return el ? (el.getAttribute("href") || "").trim() : "";
}
function stripHtml(s) {
    const div = document.createElement("div");
    div.innerHTML = s || "";
    return div.textContent || "";
}
function toAbsolute(src, base) {
    try { return new URL(src, base).href; } catch { return src; }
}
function findImage(node, descHtml, baseLink) {
    const enc = node.querySelector("enclosure[url]");
    if (enc?.getAttribute("url")) return toAbsolute(enc.getAttribute("url"), baseLink);

    const media = node.querySelector("media\\:content[url], media\\:thumbnail[url], content[url]");
    if (media?.getAttribute("url")) return toAbsolute(media.getAttribute("url"), baseLink);

    const encHtml = (node.querySelector("content\\:encoded")?.textContent || "").trim();
    if (encHtml) {
        const tmp = document.createElement("div");
        tmp.innerHTML = encHtml;
        const img = tmp.querySelector("img[src]");
        if (img) return toAbsolute(img.getAttribute("src"), baseLink);
    }

    const tmp = document.createElement("div");
    tmp.innerHTML = descHtml || "";
    const img2 = tmp.querySelector("img[src]");
    if (img2) return toAbsolute(img2.getAttribute("src"), baseLink);

    return PLACEHOLDER_IMG;
}
function hash(s) {
    let h = 0;
    for (let i = 0; i < (s || "").length; i++) {
        h = ((h << 5) - h) + s.charCodeAt(i);
        h |= 0;
    }
    return Math.abs(h);
}
async function fetchWithTimeout(url, options, ms = 3000) {
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), ms);
    try {
        return await fetch(url, { ...options, signal: controller.signal });
    } finally {
        clearTimeout(t);
    }
}
function matchSearch(item, q) {
    const s = q.toLowerCase();
    return (
        item.title?.toLowerCase().includes(s) ||
        item.summary?.toLowerCase().includes(s) ||
        item.site?.toLowerCase().includes(s)
    );
}
function readCache(key) {
    const hit = _cache.get(key);
    if (!hit) return null;
    if (Date.now() - hit.ts > CACHE_TTL_MS) {
        _cache.delete(key);
        return null;
    }
    return hit.data;
}
function writeCache(key, data) {
    _cache.set(key, { ts: Date.now(), data });
}
