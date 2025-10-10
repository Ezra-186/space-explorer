import { listLaunches } from '../api/spacex.mjs';

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
      <div id="btn-row" class="row">
        <button id="more" class="btn" hidden>Load more</button>
      </div>
      <p id="launch-error" class="error" hidden></p>
      <dialog id="detail"><article></article><form method="dialog"><button>Close</button></form></dialog>
    </section>
  `;

    const grid = main.querySelector('#launch-grid');
    const more = main.querySelector('#more');
    const err = main.querySelector('#launch-error');
    const dlg = main.querySelector('#detail');

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

            // Empty state 
            if (!docs.length && state.page === 2) { 
                grid.innerHTML = `<p class="muted">No launches found.</p>`;
                state.hasNext = false;
                more.hidden = true;
                return;
            }

            // Build cards 
            const cards = docs.map((l) => {
                const img =
                    l.links?.patch?.small ||
                    (l.links?.flickr?.original?.[0] ?? '') ||
                    'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="320" height="180"><rect width="100%25" height="100%25" fill="%23111827"/><text x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" fill="%23a3a3a3" font-family="system-ui" font-size="14">No image</text></svg>';

                const date = new Date(l.date_utc).toLocaleString();
                const rocket = typeof l.rocket === 'object' ? l.rocket?.name : '';

                return `
        <article class="card">
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

            // details dialog hookup
            grid.querySelectorAll('button.more').forEach((b) => {
                b.onclick = () => {
                    const card = b.closest('.card');
                    dlg.querySelector('article').innerHTML = card.outerHTML;
                    dlg.showModal();
                };
            });

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
