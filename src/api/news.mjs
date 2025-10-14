const BASE = "https://api.spaceflightnewsapi.net/v4";

function https(u) { return String(u || "").replace(/^http:/, "https:"); }

// util: fetch json
async function fetchJSON(url) {
    const res = await fetch(url, { cache: "no-store", headers: { Accept: "application/json" } });
    const txt = await res.text();
    let data;
    try { data = JSON.parse(txt); } catch { throw new Error(`News invalid JSON (status ${res.status})`); }
    if (!res.ok || data?.detail) throw new Error(data?.detail || `News HTTP ${res.status}`);
    return data;
}

// api: list articles
export async function getArticles({ limit = 6, search = "" } = {}) {
    const qs = new URLSearchParams({ limit: String(limit), ordering: "-published_at" });
    if (search) qs.set("search", search);
    const url = `${BASE}/articles/?${qs}`;
    const j = await fetchJSON(url);
    return (j?.results || []).map(a => ({
        id: a.id,
        title: a.title,
        site: a.news_site,
        url: https(a.url),
        image: https(a.image_url),
        published: a.published_at,
        summary: a.summary || ""
    }));
}
