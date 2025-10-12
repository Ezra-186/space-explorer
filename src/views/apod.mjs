import { getRandomGalleryImage } from "../api/nasa.mjs";
import { openImageModal } from "../components/modal.mjs";

export async function renderView(main) {
  main.innerHTML = `
    <section id="apod-view">
      <div id="apod-skeleton" class="skeleton" style="height:clamp(240px,45vh,460px)"></div>
      <article id="apod-card" class="card hero" hidden></article>
      <p id="apod-error" class="error" hidden></p>
    </section>
  `;

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
}