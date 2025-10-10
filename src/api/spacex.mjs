const BASE = "https://api.spacexdata.com/v5";

export async function getUpcoming() {
    const res = await fetch(`${BASE}/launches/upcoming`);
    if (!res.ok) throw new Error("SpaceX request failed");
    return res.json();
}

const API = 'https://api.spacexdata.com/v4';

// Paginated launches
export async function listLaunches({ upcoming = false, page = 1, limit = 12 } = {}) {
    const body = {
        query: { upcoming },
        options: {
            limit,
            page,
            sort: { date_utc: upcoming ? 'asc' : 'desc' },
            select: ['name', 'date_utc', 'links', 'rocket', 'details'],
            populate: [{ path: 'rocket', select: ['name'] }]
        }
    };
    const res = await fetch(`${API}/launches/query`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body)
    });
    if (!res.ok) throw new Error(`spacex launches HTTP ${res.status}`);
    return res.json();
}