const KEY = import.meta.env.VITE_NASA_KEY || "DEMO_KEY";
const BASE = "https://api.nasa.gov/mars-photos/api/v1";

function cap(name) {
    const s = String(name || "curiosity").toLowerCase();
    return s.charAt(0).toUpperCase() + s.slice(1); 
}
function low(name) {
    return String(name || "curiosity").toLowerCase();
}

async function getJSON(url, label) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`${label} HTTP ${res.status}`);
    return res.json();
}

export async function getLatestPhotos(rover = "curiosity") {
    const r = low(rover);
    const R = cap(rover);
    console.debug("[rover] has key:", Boolean(import.meta.env.VITE_NASA_KEY));

    try {
        const latest = await getJSON(
            `${BASE}/rovers/${r}/latest_photos?api_key=${KEY}`,
            "latest_photos"
        );
        if (latest.latest_photos?.length) return latest.latest_photos;
    } catch (e) {
        console.warn("[rover] latest_photos failed:", e.message);
    }

    let manifest;
    try {
        manifest = await getJSON(`${BASE}/manifests/${R}?api_key=${KEY}`, "manifest");
    } catch (e) {
        console.warn("[rover] manifest failed:", e.message);
    }

    const sols = manifest?.photo_manifest?.photos ?? [];
    // Walk back through up to 15 recent sols
    for (let i = sols.length - 1, tries = 0; i >= 0 && tries < 15; i--, tries++) {
        const sol = sols[i].sol;
        try {
            const data = await getJSON(
                `${BASE}/rovers/${r}/photos?sol=${sol}&api_key=${KEY}`,
                `photos?sol=${sol}`
            );
            if (data.photos?.length) return data.photos;
        } catch (e) {
            console.warn("[rover] fallback sol failed:", e.message);
        }
    }

    const maxDate = manifest?.photo_manifest?.max_date;
    if (maxDate) {
        const byDate = await getJSON(
            `${BASE}/rovers/${r}/photos?earth_date=${maxDate}&api_key=${KEY}`,
            `photos?earth_date=${maxDate}`
        );
        if (byDate.photos?.length) return byDate.photos;
    }

    return [];
}
