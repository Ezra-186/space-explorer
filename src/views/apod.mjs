import { getTodayAPOD } from "../api/nasa.mjs";

export async function renderView(main) {
  main.innerHTML = `
    <section id="apod-view">
      <div id="apod-skeleton" class="skeleton" style="height:clamp(240px,45vh,460px)"></div>
      <article id="apod-card" class="card hero" hidden></article>
      <p id="apod-error" class="error" hidden></p>
    </section>
  `;

  try {
    const data = await getTodayAPOD();
    const isVideo = data.media_type === "video";
    const mediaSrc = isVideo ? (data.thumbnail_url || "") : data.url;

    const card = main.querySelector("#apod-card");
    card.innerHTML = `
      ${mediaSrc ? `<img src="${mediaSrc}" alt="${data.title}" loading="lazy" decoding="async">` : ""}
      <div class="content">
        <h2>${data.title}</h2>
        <time datetime="${data.date}">${data.date}</time>
        <p>${data.explanation}</p>
        ${isVideo ? `<p class="muted">Video: <a href="${data.url}" target="_blank" rel="noopener">Open original</a></p>` : ""}
      </div>
    `;
    card.hidden = false;
  } catch (e) {
    const el = main.querySelector("#apod-error");
    el.textContent = "Could not load APOD.";
    el.hidden = false;
  } finally {
    const sk = main.querySelector("#apod-skeleton");
    if (sk) sk.remove();
  }
}
