// view: near-earth objects
import { defaultRange, getNeoFeed } from "../api/neo.mjs";

export async function renderView(main) {
  // scaffold
  const { start, end } = defaultRange(7);
  main.innerHTML = `
    <section class="container">
      <h2>Near-Earth Objects (7-Day Window)</h2>
      <form id="neo-form" class="toolbar" style="display:flex;gap:.75rem;flex-wrap:wrap;align-items:end;margin:.5rem 0 1rem;">
        <label>Start
          <input id="neo-start" type="date" value="${start}" max="${end}">
        </label>
        <label>End
          <input id="neo-end" type="date" value="${end}" max="">
        </label>
        <button class="btn" id="neo-load" type="submit">Load</button>
      </form>
      <p class="muted" id="neo-note">Max window is 7 days.</p>
      <p class="error" id="neo-err" hidden></p>
      <div id="neo-grid" class="grid"></div>
    </section>
  `;

  // refs
  const form = main.querySelector("#neo-form");
  const startEl = main.querySelector("#neo-start");
  const endEl = main.querySelector("#neo-end");
  const err = main.querySelector("#neo-err");
  const grid = main.querySelector("#neo-grid");

  // inputs: clamp end date
  function clampRange() {
    const s = new Date(startEl.value);
    const e = new Date(s); e.setDate(e.getDate() + 6);
    const max = e.toISOString().slice(0, 10);
    endEl.max = max;
    if (endEl.value > max) endEl.value = max;
  }
  clampRange();
  startEl.addEventListener("change", clampRange);

  // load: fetch + render
  async function load() {
    err.hidden = true;
    grid.innerHTML = `<div class="skeleton" style="height:200px"></div>`;
    try {
      const items = await getNeoFeed(startEl.value, endEl.value);
      if (!items.length) throw new Error("No objects in this window.");
      grid.innerHTML = items.map(a => `
        <article class="card">
          <div class="content">
            <h3>${a.name} ${a.hazardous ? "⚠️" : ""}</h3>
            <p><strong>Approach:</strong> ${a.date_full} (${a.orbiting_body})</p>
            <p><strong>Diameter (km):</strong> ${a._fmt.diameter_km}</p>
            <p><strong>Speed (km/h):</strong> ${a._fmt.velocity_kph}</p>
            <p><strong>Miss distance (km):</strong> ${a._fmt.miss_km}</p>
            <p><a class="btn" href="${a.nasa_jpl_url}" target="_blank" rel="noopener">JPL Details</a></p>
          </div>
        </article>
      `).join("");
    } catch (e) {
      grid.innerHTML = "";
      err.textContent = e.message || "Failed to load NEO feed.";
      err.hidden = false;
    }
  }

  // form: submit
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    load();
  });

  // first load
  load();
}
