const BASE = "https://api.spacexdata.com/v5";

export async function getUpcoming() {
    const res = await fetch(`${BASE}/launches/upcoming`);
    if (!res.ok) throw new Error("SpaceX request failed");
    return res.json();
}
