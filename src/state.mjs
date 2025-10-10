const KEY = "space-explorer:favs";

(() => {
    const OLD = localStorage.getItem("fx_favs");
    if (OLD) {
        try {
            const prev = JSON.parse(OLD) || {};
            const cur = JSON.parse(localStorage.getItem(KEY) || "{}");
            const merged = { ...cur };
            for (const t in prev) merged[t] = { ...(merged[t] || {}), ...prev[t] };
            localStorage.setItem(KEY, JSON.stringify(merged));
            localStorage.removeItem("fx_favs");
        } catch { /* ignore */ }
    }
})();

function read() {
    try { return JSON.parse(localStorage.getItem(KEY)) || {}; }
    catch { return {}; }
}
function write(db) { localStorage.setItem(KEY, JSON.stringify(db)); }

export function isFav(type, id) {
    const db = read();
    return Boolean(db[type]?.[id]);
}

export function toggleFav(type, id, payload = {}) {
    const db = read();
    db[type] ||= {};
    if (db[type][id]) delete db[type][id];
    else db[type][id] = payload;
    write(db);
    return Boolean(db[type]?.[id]);
}

export function getFavs(type) {
    const db = read();
    return Object.entries(db[type] || {}).map(([id, p]) => ({ id, ...p }));
}
