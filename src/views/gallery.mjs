import { searchImages } from '../api/nasa-images.mjs';
import { isFav, toggleFav } from '../state.mjs';

// ui: placeholder
const PLACEHOLDER =
  "data:image/svg+xml;utf8,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%27320%27 height=%27180%27%3E%3Crect width=%27100%25%27 height=%27100%25%27 fill=%27%23111827%27/%3E%3Ctext x=%2750%25%27 y=%2750%25%27 dominant-baseline=%27middle%27 text-anchor=%27middle%27 fill=%27%23a3a3a3%27 font-family=%27system-ui%27 font-size=%2714%27%3ENo%20image%3C/text%3E%3C/svg%3E";

// ui: quick-pick categories
const SUGGESTIONS = [
  'Galaxy', 'Nebula', 'Andromeda', 'Orion Nebula', 'Milky Way',
  'Supernova', 'Aurora', 'Eclipse', 'Comet',
  'Moon', 'Earth', 'Mars', 'Jupiter', 'Saturn',
  'Hubble', 'James Webb', 'International Space Station'
];

// storage: last search (fallback "Star")
let q = localStorage.getItem("gallery:lastQ") || 'Star';
let page = 1;
let loading = false;
let selectedChip = '';

export async function renderView(main) {
  main.innerHTML = `
    <section>
      <h2>NASA Image Gallery</h2>

      <form id="qform" class="row" role="search">
        <input id="q" name="q" placeholder="Search images…" value="${q}" aria-label="Search images" />
        <button class="btn">Search</button>
      </form>

      <div id="chips" class="chips" role="toolbar" aria-label="Quick categories"></div>

      <div id="img-grid" class="gallery-grid"></div>

      <div class="row"><button id="more" class="btn" hidden>Load more</button></div>
      <div id="sentinel" aria-hidden="true"></div>
      <p id="img-error" class="error" hidden></p>

      <dialog id="zoom" class="modal">
        <div class="modal-card">
          <button class="modal-close" aria-label="Close">×</button>
          <img alt="">
        </div>
      </dialog>
    </section>
  `;

  // ui: refs
  const grid = main.querySelector('#img-grid');
  const more = main.querySelector('#more');
  const err = main.querySelector('#img-error');
  const form = main.querySelector('#qform');
  const input = main.querySelector('#q');
  const zoom = main.querySelector('#zoom');
  const imgFull = zoom.querySelector('img');
  const closeBtn = zoom.querySelector('.modal-close');
  const sentinel = main.querySelector('#sentinel');
  const chipsWrap = main.querySelector('#chips');

  // ui: chip pressed state
  function updateChipPressed() {
    chipsWrap.querySelectorAll('.chip').forEach(b =>
      b.setAttribute('aria-pressed', String(b.dataset.q === selectedChip))
    );
  }

  // ui: quick-pick chips
  function renderChips() {
    chipsWrap.innerHTML = SUGGESTIONS.map(label => `
      <button type="button" class="chip" data-q="${label}" aria-pressed="${label === selectedChip}">
        ${label}
      </button>
    `).join('');
    chipsWrap.querySelectorAll('.chip').forEach(btn => {
      btn.onclick = () => {
        selectedChip = btn.dataset.q;
        input.value = selectedChip;
        reset(selectedChip);
        updateChipPressed();
        fill();
      };
    });
  }

  // data: reset list
  function reset(newQ) {
    q = newQ;
    localStorage.setItem("gallery:lastQ", q);
    page = 1;
    grid.innerHTML = '';
    err.hidden = true;
  }

  // data: load page
  async function fill() {
    if (loading) return;
    loading = true; more.disabled = true;

    try {
      const items = await searchImages({ q, page });
      page += 1;
      more.hidden = items.length < 100;

      // ui: cards + favorites
      const cards = items.map((it) => {
        const thumb = it.thumb || PLACEHOLDER;
        const full = it.full || it.thumb || thumb;
        const title = it.title || 'Image';
        return `
          <figure class="tile">
            <button
              class="fav"
              type="button"
              data-id="${it.id}"
              aria-pressed="${isFav('img', it.id)}"
              aria-label="${isFav('img', it.id) ? 'Remove favorite' : 'Add to favorites'}"></button>
            <img src="${thumb}" alt="${title}"
                 loading="lazy" decoding="async" data-full="${full}">
            <figcaption>${title}</figcaption>
          </figure>
        `;
      }).join('');
      grid.insertAdjacentHTML('beforeend', cards);

      // ui: delegation (fav + zoom)
      if (!grid._delegated) {
        grid._delegated = true;
        grid.addEventListener('click', (ev) => {
          const favBtn = ev.target.closest('button.fav');
          if (favBtn) {
            ev.preventDefault();
            ev.stopPropagation();
            const id = favBtn.dataset.id;
            const imgEl = favBtn.nextElementSibling;
            let thumb = imgEl?.getAttribute('src') || '';
            const title = imgEl?.getAttribute('alt') || '';
            if (thumb.startsWith('data:image/svg+xml')) thumb = '';
            const on = toggleFav('img', id, { thumb, title });
            favBtn.setAttribute('aria-pressed', String(on));
            favBtn.setAttribute('aria-label', on ? 'Remove favorite' : 'Add to favorites');
            // kick a short pulse animation
            favBtn.classList.add('just-toggled');
            favBtn.addEventListener('animationend', () => favBtn.classList.remove('just-toggled'), { once: true });
            return;
          }

          const pic = ev.target.closest('img');
          if (pic && grid.contains(pic)) {
            imgFull.src = pic.dataset.full || pic.src;
            imgFull.alt = pic.alt || '';
            zoom.showModal();
          }
        });
      }

    } catch (e) {
      err.textContent = `Could not load images. ${e.message}`;
      err.hidden = false;
    } finally {
      loading = false; more.disabled = false;
    }
  }

  // form: submit
  form.onsubmit = (ev) => {
    ev.preventDefault();
    const value = input.value.trim() || 'Star';
    selectedChip = SUGGESTIONS.includes(value) ? value : '';
    updateChipPressed();
    reset(value);
    fill();
  };

  // more: click
  more.onclick = fill;

  // modal: close
  closeBtn.onclick = () => zoom.close();
  zoom.addEventListener('click', (e) => {
    const box = zoom.querySelector('.modal-card').getBoundingClientRect();
    const inBox = e.clientX >= box.left && e.clientX <= box.right &&
      e.clientY >= box.top && e.clientY <= box.bottom;
    if (!inBox) zoom.close();
  });

  // paging: infinite scroll
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((ent) => { if (ent.isIntersecting) fill(); });
    }, { rootMargin: '600px 0px' });
    io.observe(sentinel);
    more.style.display = 'none';
  } else {
    more.style.display = '';
  }

  // init: chips + first load
  selectedChip = SUGGESTIONS.includes(q) ? q : '';
  renderChips();
  updateChipPressed();
  reset(q);
  fill();
}
