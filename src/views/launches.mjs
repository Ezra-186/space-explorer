import { listLaunches } from '../api/spacex.mjs';
import { isFav, toggleFav } from '../state.mjs';

let state = { upcoming: false, page: 1, hasNext: true, loading: false };

export async function renderView(main) {
    main.innerHTML = `
    <section>
      <h2>SpaceX Launches</h2>
      <div class="tabs" role="tablist">
        <button id="tab-past" role="tab" aria-selected="${!state.upcoming}" data-k="past">Past</button>
        <button id="tab-up" role="tab" aria-selected="${state.upcoming}" data-k="up">Upcoming</button>
      </div>
      <div id="launch-grid" class="grid"></div>
      <div class="row"><button id="more" class="btn" hidden>Load more</button></div>
      <p id="launch-error" class="error" hidden></p>
      <dialog id="detail"><article></article><form method="dialog"><button>Close</button></form></dialog>
    </section>
  `;

    const grid = main.querySelector('#launch-grid');
    const more = main.querySelector('#more');
    const err = main.querySelector('#launch-error');
    const dlg = main.querySelector('#detail');

    // ONE-TIME EVENT DELEGATION (outside fill)
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

    dlg.addEventListener('click', (e) => {
        const r = dlg.getBoundingClientRect();
        const inBox = e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
        if (!inBox) dlg.close();
    });
    addEventListener('keydown', (e) => { if (e.key === 'Escape' && dlg.open) dlg.close(); });

    function reset(kind) {
        state = { upcoming: kind === 'up', page: 1, hasNext: true, loading: false };
        grid.innerHTML = '';
    }

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
                    'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="320" height="180"><rect width="100%25" height="100%25" fill="%23111827"/><text x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" fill="%23a3a3a3" font-family="system-ui" font-size="14">No image</text></svg>';

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

    // tabs
    main.querySelectorAll('[role="tab"]').forEach((tab) => {
        tab.onclick = () => {
            const k = tab.dataset.k;
            main.querySelectorAll('[role="tab"]').forEach((t) => t.setAttribute('aria-selected', String(t === tab)));
            reset(k === 'up' ? 'up' : 'past');
            fill();
        };
    });

    more.onclick = fill;

    // first load
    reset(state.upcoming ? 'up' : 'past');
    fill();
}
