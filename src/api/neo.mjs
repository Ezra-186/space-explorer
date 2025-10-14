const RAW = import.meta.env.VITE_NASA_API_KEY || import.meta.env.VITE_NASA_KEY || "DEMO_KEY";
const KEY = (RAW || "").trim();
const BASE = "https://api.nasa.gov/neo/rest/v1";

// util: add api key
function withKey(url) {
    return `${url}${url.includes("?") ? "&" : "?"}api_key=${encodeURIComponent(KEY)}`;
}

// util: fetch json (guard)
async function fetchJSON(url) {
    const res = await fetch(url, { cache: "no-store", headers: { Accept: "application/json" } });
    const text = await res.text();
    const ct = res.headers.get("content-type") || "";
    if (!ct.includes("application/json")) throw new Error(`NEO non-JSON (status ${res.status})`);
    let data;
    try { data = JSON.parse(text); } catch { throw new Error(`NEO invalid JSON (status ${res.status})`); }
    if (!res.ok || data?.error) throw new Error(data?.error?.message || `NEO HTTP ${res.status}`);
    return data;
}

// util: number format
function fmt(n) { return new Intl.NumberFormat().format(Number(n)); }

// range: default
export function defaultRange(days = 7) {
    const d = new Date();
    const start = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
    const end = new Date(start); end.setUTCDate(end.getUTCDate() + Math.max(1, Math.min(days, 7)) - 1);
    const toISO = x => x.toISOString().slice(0, 10);
    return { start: toISO(start), end: toISO(end) };
}

// api: feed - flat list
export async function getNeoFeed(startISO, endISO) {
    const url = withKey(`${BASE}/feed?start_date=${startISO}&end_date=${endISO}`);
    const j = await fetchJSON(url);
    const map = j?.near_earth_objects || {};
    const days = Object.keys(map).sort();
    const items = [];
    for (const date of days) {
        for (const a of map[date] || []) {
            const ca = (a.close_approach_data || [])[0] || {};
            const vel = ca.relative_velocity || {};
            const miss = ca.miss_distance || {};
            const dia = a.estimated_diameter?.kilometers || {};
            items.push({
                id: a.id,
                name: a.name,
                date,
                date_full: ca.close_approach_date_full || date,
                hazardous: !!a.is_potentially_hazardous_asteroid,
                velocity_kph: Number(vel.kilometers_per_hour || 0),
                miss_km: Number(miss.kilometers || 0),
                diameter_km_min: Number(dia.estimated_diameter_min || 0),
                diameter_km_max: Number(dia.estimated_diameter_max || 0),
                nasa_jpl_url: a.nasa_jpl_url || "",
                orbiting_body: ca.orbiting_body || "Earth",
                _fmt: {
                    velocity_kph: fmt(vel.kilometers_per_hour || 0),
                    miss_km: fmt(miss.kilometers || 0),
                    diameter_km: `${(dia.estimated_diameter_min || 0).toFixed(3)}–${(dia.estimated_diameter_max || 0).toFixed(3)}`
                }
            });
        }
    }
    items.sort((a, b) => (a.date_full < b.date_full ? -1 : a.date_full > b.date_full ? 1 : 0));
    return items;
}
