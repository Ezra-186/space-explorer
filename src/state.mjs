const KEY = "fx_favs";

function load() { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch { return {}; } }
function save(data) { localStorage.setItem(KEY, JSON.stringify(data)); }

export function isFav(type, id) {
    const data = load(); return Boolean(data[type]?.[id]);
}
export function toggleFav(type, id, item) {
    const data = load();
    data[type] = data[type] || {};
    if (data[type][id]) delete data[type][id]; else data[type][id] = item;
    save(data);
}
export function allFavs() { return load(); }
