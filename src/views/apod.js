export function renderAPOD(apod) {
    const card = document.getElementById("apod-card");
    const isVideo = apod.media_type === "video";
    const img = isVideo ? apod.thumbnail_url ?? "" : apod.url;

    card.innerHTML = `
    ${img ? `<img src="${img}" alt="${apod.title}">` : ""}
    <div class="content">
      <h2>${apod.title}</h2>
      <time datetime="${apod.date}">${apod.date}</time>
      <p>${apod.explanation}</p>
      ${isVideo ? `<p class="muted">Video: <a href="${apod.url}" target="_blank" rel="noopener">Open original</a></p>` : ""}
    </div>
  `;
    card.hidden = false;
}
