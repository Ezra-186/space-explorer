import { getRandomGalleryImage } from "../api/nasa.mjs";
import { getArticles } from "../api/news.mjs";
import { openImageModal } from "../components/modal.mjs";

export async function renderView(main) {
  // scaffold: hero + news areas
  main.innerHTML = `
    <section id="apod-view">
      <div id="apod-skeleton" class="skeleton" style="height:clamp(240px,45vh,460px)"></div>
      <article id="apod-card" class="card hero" hidden></article>
      <p id="apod-error" class="error" hidden></p>
    </section>

    <section id="news-view" class="container" style="margin-top:1.5rem;">
      <h2>Latest Space News</h2>
      <p id="news-error" class="error" hidden></p>
      <div id="news-grid" class="news-grid">
        <div class="skeleton" style="height:120px"></div>
        <div class="skeleton" style="height:120px"></div>
        <div class="skeleton" style="height:120px"></div>
      </div>
    </section>
  `;

  // hero: random nasa image
  const sk = main.querySelector("#apod-skeleton");
  const card = main.querySelector("#apod-card");
  const err = main.querySelector("#apod-error");

  try {
    const topics = [
      "space", "nebula", "galaxy", "milky way", "orion", "supernova",
      "james webb", "jwst", "saturn", "jupiter", "mars", "black hole"
    ];
    const q = topics[Math.floor(Math.random() * topics.length)];
    const g = await getRandomGalleryImage(q);

    card.innerHTML = `
      <img src="${g.src}" alt="${g.alt || 'NASA image'}" loading="lazy" decoding="async">
      <div class="content">
        <h2>${g.title || 'NASA image'}</h2>
        ${g.date ? `<time datetime="${g.date}">${g.date}</time>` : ""}
        ${g.description ? `<p>${g.description}</p>` : ""}
        <p class="muted">Source: NASA Images (random · ${q})</p>
        ${g.page ? `<p class="muted"><a class="source-link" href="${g.page}" target="_blank" rel="noopener">View source</a></p>` : ""}
      </div>
    `;
    card.hidden = false;

    // modal: click to zoom
    const imgEl = card.querySelector("img");
    const titleEl = card.querySelector(".content h2");
    if (imgEl && !imgEl.closest("a")) {
      imgEl.addEventListener("click", () => {
        openImageModal({
          src: imgEl.src,
          alt: imgEl.alt || "NASA image",
          caption: titleEl?.textContent || ""
        });
      });
    }
  } catch (e) {
    err.textContent = "Could not load a NASA gallery image right now.";
    err.hidden = false;
    console.warn(e);
  } finally {
    sk?.remove();
  }

  // news: spaceflight news api
  const newsGrid = main.querySelector("#news-grid");
  const newsErr = main.querySelector("#news-error");

  try {
    const items = await getArticles({ limit: 6 });
    newsGrid.innerHTML = items.map(a => `
      <article class="news-card">
        <a class="thumb" href="${a.url}" target="_blank" rel="noopener">
          ${a.image ? `<img src="${a.image}" alt="${a.title}" loading="lazy" decoding="async">` : ""}
        </a>
        <div class="body">
          <h3 class="title">
            <a href="${a.url}" target="_blank" rel="noopener">${a.title}</a>
          </h3>
          <p class="meta">
            <span class="source">${a.site}</span>
            <span class="dot">•</span>
            <time datetime="${new Date(a.published).toISOString()}">
              ${new Date(a.published).toLocaleString([], { year: "numeric", month: "short", day: "2-digit" })}
            </time>
          </p>
        </div>
      </article>
    `).join("");
  } catch (e) {
    newsGrid.innerHTML = "";
    newsErr.textContent = e.message || "Failed to load space news. Spaceflight News is having issues right now. The rest of the app still works.";
    newsErr.hidden = false;
  }
}
