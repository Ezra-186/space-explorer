// state: favorites store
const FAVS_KEY = "favs:v1";

// read/write helpers
function readFavs() {
    try { return JSON.parse(localStorage.getItem(FAVS_KEY)) || []; }
    catch { return []; }
}
function writeFavs(list) {
    try { localStorage.setItem(FAVS_KEY, JSON.stringify(list)); } catch { }
}

// normalize helpers
const normType = (t) => String(t ?? "").trim().toLowerCase();
const normId = (id) => String(id ?? "").trim();
const favKey = (t, id) => `${normType(t)}:${normId(id)}`;

// strip placeholder data-URI
function cleanSrc(v = "") {
    const s = String(v || "");
    return s.startsWith("data:image/svg+xml") ? "" : s;
}

// ---- MIGRATION (runs once when module is loaded)
(function migrateFavs() {
    const src = readFavs();
    if (!src.length) return;

    const seen = new Set();
    const out = [];

    for (const it of src) {
        const type = normType(it.type);
        const id = normId(it.id);
        if (!type || !id) continue;

        // normalize media fields
        const thumb = cleanSrc(it.thumb);
        const img = cleanSrc(it.img);

        // IMPORTANT: drop image favorites that have no usable media
        if (type === "img" && !(thumb || img)) continue;

        const k = favKey(type, id);
        if (seen.has(k)) continue;
        seen.add(k);

        out.push({
            type,
            id,
            name: it.name || "",
            title: it.title || "",
            thumb,
            img
        });
    }

    // dedupe across legacy "image" vs "img" by collapsing to "img"
    const collapsed = [];
    const keepSeen = new Set();
    for (const it of out) {
        const t = it.type === "image" ? "img" : it.type;
        const k = favKey(t, it.id);
        if (keepSeen.has(k)) continue;
        keepSeen.add(k);
        collapsed.push({ ...it, type: t });
    }

    writeFavs(collapsed);
})();

// ---- PUBLIC API

export function isFav(type, id) {
    const k = favKey(type, id);
    return readFavs().some(it => favKey(it.type, it.id) === k);
}

export function getFavs(type) {
    const list = readFavs();
    if (!type) return list;
    const t = normType(type);
    return list.filter(it => it.type === t);
}

// Remove all variants for this item (handles "img" and legacy "image")
export function toggleFav(type, id, payload = {}) {
    const t = normType(type);
    const i = normId(id);

    const list = readFavs();
    const kept = list.filter(it => {
        const itType = normType(it.type);
        const itId = normId(it.id);
        const sameType = (t === "img")
            ? (itType === "img" || itType === "image")
            : (itType === t);
        return !(sameType && itId === i);
    });

    const wasOn = kept.length !== list.length;
    if (wasOn) { writeFavs(kept); return false; }

    // add one clean entry
    const entry = {
        type: t === "image" ? "img" : t,
        id: i,
        name: payload.name || "",
        title: payload.title || "",
        thumb: cleanSrc(payload.thumb),
        img: cleanSrc(payload.img)
    };

    // if it's an image favorite and there is no usable media, don't store it
    if (entry.type === "img" && !(entry.thumb || entry.img)) return false;

    writeFavs([...kept, entry]);
    return true;
}
