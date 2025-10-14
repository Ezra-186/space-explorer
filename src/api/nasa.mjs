const KEY = (import.meta.env.VITE_NASA_API_KEY || import.meta.env.VITE_NASA_KEY || "DEMO_KEY").trim();
const BASE = "https://api.nasa.gov";

// apod: endpoint
const APOD_URL = `${BASE}/planetary/apod?thumbs=true&api_key=${encodeURIComponent(KEY)}`;

// apod: today
export async function getTodayAPOD() {
  const res = await fetch(APOD_URL, { cache: "no-store" });
  let data;
  try { data = await res.json(); }
  catch { throw new Error(`APOD invalid JSON (status ${res.status})`); }
  if (!res.ok || data?.code || data?.error) {
    const msg = data?.msg || data?.error?.message || `HTTP ${res.status}`;
    throw new Error(`APOD error: ${msg}`);
  }
  return data;
}

// images: random gallery image (people-safe)
export async function getRandomGalleryImage(query = "space", { peopleSafe = true } = {}) {
  const page = 1 + Math.floor(Math.random() * 5);
  const url = `https://images-api.nasa.gov/search?media_type=image&q=${encodeURIComponent(query)}&page=${page}`;

  const res = await fetch(url, { cache: "no-store" });
  let json;
  try { json = await res.json(); }
  catch { throw new Error(`NASA Images invalid JSON (status ${res.status})`); }
  const items = json?.collection?.items ?? [];

  // filter: remove obvious people/ceremony/portrait shots
  const HUMAN_WORDS = [
    "astronaut", "portrait", "people", "person", "crew", "group", "student", "students", "class", "training",
    "administrator", "press", "ceremony", "meeting", "conference", "award", "audience", "self-portrait", "selfie",
    "team", "family", "gala", "visit"
  ];
  const hasPeople = (data = {}, href = "", title = "", desc = "") => {
    const kws = (data.keywords || []).map(k => String(k).toLowerCase());
    const t = String(title).toLowerCase();
    const d = String(desc).toLowerCase();
    const h = String(href).toLowerCase();
    return HUMAN_WORDS.some(w => kws.includes(w) || t.includes(w) || d.includes(w) || h.includes(`/${w}/`));
  };

  let candidates = items.map((it) => {
    const data = it?.data?.[0] || {};
    const link = (it?.links || []).find(l => l?.href) || {};
    const nasa_id = data?.nasa_id;
    return {
      src: link.href,
      alt: data?.title || "NASA image",
      title: data?.title || "NASA image",
      description: data?.description || "",
      date: (data?.date_created || "").slice(0, 10),
      page: nasa_id ? `https://images.nasa.gov/details-${nasa_id}` : null,
      _raw: { data, href: link.href }
    };
  }).filter(c => !!c.src);

  if (peopleSafe) {
    candidates = candidates.filter(c => !hasPeople(c._raw.data, c._raw.href, c.title, c.description));
  }
  if (!candidates.length) {
    if (query !== "nebula") return getRandomGalleryImage("nebula", { peopleSafe });
    throw new Error("No suitable gallery images after filtering");
  }

  return candidates[Math.floor(Math.random() * candidates.length)];
}
