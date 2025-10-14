const API = 'https://images-api.nasa.gov';

// api: search images
export async function searchImages({ q = 'nebula', page = 1 } = {}) {
    const url = new URL(`${API}/search`);
    url.searchParams.set('q', q);
    url.searchParams.set('media_type', 'image');
    url.searchParams.set('page', String(page));

    const res = await fetch(url);
    if (!res.ok) throw new Error(`nasa images HTTP ${res.status}`);

    const data = await res.json();
    const items = data.collection?.items ?? [];

    return items.map((it) => {
        const meta = it.data?.[0] || {};
        const link = it.links?.find((l) => l.render === 'image') || it.links?.[0];
        return {
            id: meta.nasa_id,
            title: meta.title,
            date: meta.date_created,
            desc: meta.description,
            thumb: link?.href
        };
    });
}
