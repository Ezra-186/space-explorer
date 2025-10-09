import { getUpcoming } from "../api/spacex.mjs";

export async function renderView(main) {
    main.innerHTML = `
    <section>
      <h2>Upcoming SpaceX Launches</h2>
      <div id="spx-skel" class="skeleton" style="height:120px"></div>
      <ul id="list" class="list"></ul>
      <p id="spx-error" class="error" hidden></p>
    </section>
  `;
    const list = main.querySelector("#list");
    try {
        const launches = await getUpcoming();
        launches.sort((a, b) => new Date(a.date_utc) - new Date(b.date_utc));
        list.innerHTML = launches.slice(0, 15).map(x => `
      <li class="item">
        <button class="row" data-id="${x.id}" aria-expanded="false">
          <span>${x.name}</span>
          <time datetime="${x.date_utc}">${new Date(x.date_utc).toLocaleString()}</time>
        </button>
        <div class="details" hidden>
          <p class="muted">Flight: ${x.flight_number ?? "—"}</p>
          <p>${x.details ?? "No details yet."}</p>
          <p class="muted">Launchpad: ${x.launchpad ?? "—"}</p>
        </div>
      </li>
    `).join("");

        list.addEventListener("click", (e) => {
            const btn = e.target.closest("button.row");
            if (!btn) return;
            const box = btn.nextElementSibling;
            const open = box.hasAttribute("hidden") ? false : true;
            box.toggleAttribute("hidden");
            btn.setAttribute("aria-expanded", String(!open));
        });
    } catch (e) {
        const el = main.querySelector("#spx-error");
        el.textContent = "Could not load launches.";
        el.hidden = false;
    } finally {
        const sk = main.querySelector("#spx-skel");
        if (sk) sk.remove();
    }
}
