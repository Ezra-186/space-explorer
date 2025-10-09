import { getLatestPhotos } from "../api/rover.mjs";
import { isFav, toggleFav } from "../state.mjs";

export async function renderView(main) {
  main.innerHTML = `
    <section>
      <h2>Mars Rover — Latest (Curiosity)</h2>
      <div id="rover-skel" class="skeleton" style="height:160px"></div>
      <div id="grid" class="grid"></div>
      <p id="rover-error" class="error" hidden></p>
    </section>
  `;

  const grid = main.querySelector("#grid");

  try {
    const photos = await getLatestPhotos(); // defaults to curiosity
    grid.innerHTML = photos.map(p => `
      <figure class="tile">
        <img src="${p.img_src}" alt="Sol ${p.sol} ${p.camera.full_name}" loading="lazy" decoding="async">
        <figcaption>
          Sol ${p.sol} • ${p.camera.name}
          <button class="fav" data-type="rover" data-id="${p.id}" aria-pressed="${isFav('rover', String(p.id)) ? 'true' : 'false'}">☆</button>
        </figcaption>
      </figure>
    `).join("");

    // hook up fav toggles
    grid.querySelectorAll("button.fav").forEach(btn => {
      const id = btn.dataset.id;
      btn.addEventListener("click", () => {
        toggleFav("rover", id, { img: btn.closest(".tile").querySelector("img")?.src });
        btn.setAttribute("aria-pressed", btn.getAttribute("aria-pressed") === "true" ? "false" : "true");
      });
    });

  } catch (e) {
    const el = main.querySelector("#rover-error");
    el.textContent = `Could not load Rover photos. ${e?.message ?? ""}`;
    el.hidden = false;
    console.error("[rover] view error:", e);
  } finally {
    const sk = main.querySelector("#rover-skel");
    if (sk) sk.remove();
  }
}
