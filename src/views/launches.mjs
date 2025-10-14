import { listLaunches } from '../api/spacex.mjs';
import { isFav, toggleFav } from '../state.mjs';

// storage: last selected tab
const TAB_KEY = "launches:tab";

let state = { upcoming: false, page: 1, hasNext: true, loading: false };

const LAUNCH_PLACEHOLDER =
    "data:image/svg+xml;utf8,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%27320%27 height=%27180%27%3E%3Crect width=%27100%25%27 height=%27100%25%27 fill=%27%23111827%27/%3E%3Ctext x=%2750%25%27 y=%2750%25%27 dominant-baseline=%27middle%27 text-anchor=%27middle%27 fill=%27%23a3a3a3%27 font-family=%27system-ui%27 font-size=%2714%27%3ENo%20image%3C/text%3E%3C/svg%3E";

export async function renderView(main) {
    main.innerHTML = `
    <section>
      <h2>SpaceX Launches</h2>
      <div class="tabs" role="tablist">
        <button id="tab-past" role="tab" aria-selected="false" data-k="past">Past</button>
        <button id="tab-up" role="tab" aria-selected="false" data-k="up">Upcoming</button>
      </div>
      <div id="launch-grid" class="grid"></div>
      <div class="row"><button id="more" class="btn" hidden>Load more</button></div>
      <p id="launch-error" class="error" hidden></p>
      <dialog id="detail"><article></article><form method="dialog"><button>Close</button></form></dialog>
    </section>
  `;

    // ui: refs
    const grid = main.querySelector('#launch-grid');
    const more = main.querySelector('#more');
    const err = main.querySelector('#launch-error');
    const dlg = main.querySelector('#detail');
    const tabPast = main.querySelector('#tab-past');
    const tabUp = main.querySelector('#tab-up');

    // ui: tab selection
    function setTabSelected(kind) {
        const pastSel = kind !== 'up';
        tabPast.setAttribute('aria-selected', String(pastSel));
        tabUp.setAttribute('aria-selected', String(!pastSel));
    }

    // events: card actions
    grid.addEventListener('click', (ev) => {
        const favBtn = ev.target.closest('button.fav');
        if (favBtn) {
            ev.stopPropagation();
            const id = favBtn.dataset.id;
            const card = favBtn.closest('.card');
            let img = card?.querySelector('img')?.src || '';
            if (img.startsWith('data:image/svg+xml')) img = '';
            const name = card?.querySelector('h3')?.textContent || '';
            const on = toggleFav('launch', id, { img, name });
            favBtn.setAttribute('aria-pressed', String(on));
            return;
        }

        const moreBtn = ev.target.closest('button.more');
        if (moreBtn) {
            const card = moreBtn.closest('.card');
            dlg.querySelector('article').innerHTML = card.outerHTML;
            dlg.showModal();
        }
    });

    // modal: close
    dlg.addEventListener('click', (e) => {
        const r = dlg.getBoundingClientRect();
        const inBox = e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
        if (!inBox) dlg.close();
    });
    addEventListener('keydown', (e) => { if (e.key === 'Escape' && dlg.open) dlg.close(); });

    // data: reset list
    function reset(kind) {
        state = { upcoming: kind === 'up', page: 1, hasNext: true, loading: false };
        localStorage.setItem(TAB_KEY, kind);
        grid.innerHTML = '';
    }

    // data: load page
    async function fill() {
        if (state.loading || !state.hasNext) return;
        state.loading = true;
        more.disabled = true;

        try {
            const { docs, hasNextPage } = await listLaunches({
                upcoming: state.upcoming,
                page: state.page,
                limit: 12
            });

            state.hasNext = hasNextPage;
            state.page += 1;

            if (!docs.length && state.page === 2) {
                grid.innerHTML = `<p class="muted">No launches found.</p>`;
                state.hasNext = false;
                more.hidden = true;
                return;
            }

            const cards = docs.map((l) => {
                const img =
                    l.links?.patch?.small ||
                    (l.links?.flickr?.original?.[0] ?? '') ||
                    LAUNCH_PLACEHOLDER;
                const date = new Date(l.date_utc).toLocaleString();
                const rocket = typeof l.rocket === 'object' ? l.rocket?.name : '';

                return `
          <article class="card">
            <button class="fav" data-id="${l.id}" aria-pressed="${isFav('launch', l.id)}">★</button>
            <img src="${img}" alt="${l.name}" loading="lazy" decoding="async">
            <div class="card-body">
              <h3>${l.name}</h3>
              <p>${date}${rocket ? ' • ' + rocket : ''}</p>
              <button class="btn more" data-id="${l.id}">Details</button>
            </div>
          </article>
        `;
            }).join('');

            grid.insertAdjacentHTML('beforeend', cards);
            more.hidden = !state.hasNext;
        } catch (e) {
            err.textContent = `Could not load launches. ${e.message}`;
            err.hidden = false;
        } finally {
            state.loading = false;
            more.disabled = false;
        }
    }

    // tabs: click
    main.querySelectorAll('[role="tab"]').forEach((tab) => {
        tab.onclick = () => {
            const k = tab.dataset.k;
            setTabSelected(k);
            reset(k === 'up' ? 'up' : 'past');
            fill();
        };
    });

    // first load: restore tab
    const firstKind = localStorage.getItem(TAB_KEY) || (state.upcoming ? 'up' : 'past');
    setTabSelected(firstKind);
    reset(firstKind);
    fill();

    // more: click
    more.onclick = fill;
}
