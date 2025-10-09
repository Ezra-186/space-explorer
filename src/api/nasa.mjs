const KEY = import.meta.env.VITE_NASA_KEY || "DEMO_KEY";
const BASE = "https://api.nasa.gov";

export async function getTodayAPOD() {
    const url = `${BASE}/planetary/apod?thumbs=true&api_key=${KEY}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error("APOD request failed");
    return res.json();
}
