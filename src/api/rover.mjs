const KEY = import.meta.env.VITE_NASA_KEY || "DEMO_KEY";
const BASE = "https://api.nasa.gov/mars-photos/api/v1";

async function getJSON(url, label) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`${label} HTTP ${res.status}`);
    return res.json();
}

export async function getLatestPhotos(rover = "curiosity") {
    console.debug("[rover] has key:", Boolean(import.meta.env.VITE_NASA_KEY));

    try {
        const latest = await getJSON(
            `${BASE}/rovers/${rover}/latest_photos?api_key=${KEY}`,
            "latest_photos"
        );
        if (latest.latest_photos?.length) return latest.latest_photos;
    } catch (e) {
        console.warn("[rover] latest_photos failed:", e.message);
    }

    const manifest = await getJSON(
        `${BASE}/manifests/${rover}?api_key=${KEY}`,
        "manifest"
    );
    const sols = manifest.photo_manifest?.photos ?? [];

    for (let i = sols.length - 1, tries = 0; i >= 0 && tries < 10; i--, tries++) {
        const sol = sols[i].sol;
        try {
            const data = await getJSON(
                `${BASE}/rovers/${rover}/photos?sol=${sol}&api_key=${KEY}`,
                `photos?sol=${sol}`
            );
            if (data.photos?.length) return data.photos;
        } catch (e) {
            console.warn("[rover] fallback sol failed:", e.message);
        }
    }

    return [];
}
