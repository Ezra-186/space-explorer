const SNAPI_BASE = "https://api.spaceflightnewsapi.net/v4";

// RSS feeds (no keys)
const RSS_FEEDS = [
    { site: "Space.com", url: "https://www.space.com/feeds/all" },
    { site: "NASA", url: "https://www.nasa.gov/rss/dyn/breaking_news.rss" },
    { site: "SpaceNews", url: "https://spacenews.com/feed/" },
    { site: "Phys.org", url: "https://phys.org/rss-feed/space-news/" }
];

// CORS proxies (try each)
const PROXIES = [
    (u) => `https://api.allorigins.win/raw?url=${encodeURIComponent(u)}`,
    (u) => `https://cors.isomorphic-git.org/${u}`,
    (u) => `https://thingproxy.freeboard.io/fetch/${u}`
];

const https = (u) => String(u || "").replace(/^http:/, "https:");

// tiny SVG so cards are never “blank”
const PLACEHOLDER_IMG =
    "data:image/svg+xml;utf8," +
    encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' width='640' height='360'>
  <rect width='100%' height='100%' fill='#0e1624'/>
  <text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle'
        font-family='system-ui' font-size='20' fill='#6b7a90'>Space news</text>
</svg>`);

// public API used by the view
export async function getArticles({ limit = 6, search = "" } = {}) {
    // 1) Spaceflight News API (JSON)
    try {
        const list = await fetchSnapi({ limit, search });
        if (list.length) return list;
    } catch { }

    // 2) RSS fallback (XML → JS objects)
    const fallback = await fetchRss(limit);
    if (fallback.length) return fallback;

    // 3) give up
    throw new Error("Space news temporarily unavailable");
}

/* ---------------- SNAPI ---------------- */
async function fetchSnapi({ limit, search }) {
    const qs = new URLSearchParams({ limit: String(limit), ordering: "-published_at" });
    if (search) qs.set("search", search);

    const res = await fetch(`${SNAPI_BASE}/articles/?${qs}`, {
        cache: "no-store",
        headers: { Accept: "application/json" }
    });

    const txt = await res.text();
    const ct = res.headers.get("content-type") || "";
    if (!ct.includes("application/json")) throw new Error("SNAPI not JSON");

    const data = JSON.parse(txt);
    if (!res.ok || data?.detail) throw new Error("SNAPI error");

    return (data.results || []).map((a) => ({
        id: a.id,
        title: a.title,
        site: a.news_site,
        url: https(a.url),
        // if feed gives no image, use placeholder so layout is stable
        image: https(a.image_url) || PLACEHOLDER_IMG,
        published: a.published_at,
        summary: a.summary || ""
    }));
}

/* ---------------- RSS fallback ---------------- */
async function fetchRss(limit) {
    const perFeed = Math.max(4, limit); // grab a few from each

    const batches = await Promise.allSettled(
        RSS_FEEDS.map((f) => fetchRssWithProxies(f, perFeed))
    );

    // keep good results
    const merged = [];
    for (const b of batches) if (b.status === "fulfilled") merged.push(...b.value);

    // ort by date desc, trim
    const seen = new Set();
    const unique = merged.filter((a) => {
        const key = a.url || a.title;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });

    unique.sort((a, b) => new Date(b.published) - new Date(a.published));
    return unique.slice(0, limit);
}

async function fetchRssWithProxies(feed, maxItems) {
    for (const make of PROXIES) {
        try {
            const out = await fetchOneRss(make(feed.url), feed, maxItems);
            if (out.length) return out;
        } catch { }
    }
    try {
        return await fetchOneRss(feed.url, feed, maxItems);
    } catch {
        return [];
    }
}

async function fetchOneRss(url, feed, maxItems) {
    const res = await fetchWithTimeout(url, { cache: "no-store" }, 8000);
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

/* ---------------- helpers ---------------- */
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

// tries common places where feeds put images
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

    // nothing found so use placeholder
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

async function fetchWithTimeout(url, options, ms) {
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), ms);
    try {
        return await fetch(url, { ...options, signal: controller.signal });
    } finally {
        clearTimeout(t);
    }
}
