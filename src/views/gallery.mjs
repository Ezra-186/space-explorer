import { searchImages } from '../api/nasa-images.mjs';

// quick-pick categories
const SUGGESTIONS = [
  'Galaxy', 'Nebula', 'Andromeda', 'Orion Nebula', 'Milky Way',
  'Supernova', 'Aurora', 'Eclipse', 'Comet',
  'Moon', 'Earth', 'Mars', 'Jupiter', 'Saturn',
  'Hubble', 'James Webb', 'International Space Station'
];

let q = 'Star';
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

      <div class="row">
        <button id="more" class="btn" hidden>Load more</button>
      </div>
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

  function updateChipPressed() {
    chipsWrap.querySelectorAll('.chip').forEach(b =>
      b.setAttribute('aria-pressed', String(b.dataset.q === selectedChip))
    );
  }

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

  function reset(newQ) {
    q = newQ;
    page = 1;
    grid.innerHTML = '';
    err.hidden = true;
  }

  async function fill() {
    if (loading) return;
    loading = true; more.disabled = true;
    try {
      const items = await searchImages({ q, page });
      page += 1;
      more.hidden = items.length < 100;

      const cards = items.map((it) => `
        <figure class="tile">
          <img src="${it.thumb}" alt="${it.title}" loading="lazy" decoding="async" data-full="${it.thumb}">
          <figcaption>${it.title}</figcaption>
        </figure>
      `).join('');
      grid.insertAdjacentHTML('beforeend', cards);

      grid.querySelectorAll('img').forEach((img) => {
        img.onclick = () => {
          imgFull.src = img.dataset.full;
          imgFull.alt = img.alt;
          zoom.showModal();
        };
      });
    } catch (e) {
      err.textContent = `Could not load images. ${e.message}`;
      err.hidden = false;
    } finally {
      loading = false; more.disabled = false;
    }
  }

  // form submit
  form.onsubmit = (ev) => {
    ev.preventDefault();
    const value = input.value.trim() || 'Star';
    selectedChip = SUGGESTIONS.includes(value) ? value : '';
    updateChipPressed();
    reset(value);
    fill();
  };

  // "Load more"
  more.onclick = fill;

  // modal
  closeBtn.onclick = () => zoom.close();
  zoom.addEventListener('click', (e) => {
    const box = zoom.querySelector('.modal-card').getBoundingClientRect();
    const inBox = e.clientX >= box.left && e.clientX <= box.right && e.clientY >= box.top && e.clientY <= box.bottom;
    if (!inBox) zoom.close();
  });

  // lazy pagination
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((ent) => { if (ent.isIntersecting) fill(); });
    }, { rootMargin: '600px 0px' });
    io.observe(sentinel);
    more.style.display = 'none';
  } else {
    more.style.display = '';
  }

  // init
  renderChips();
  reset(q);
  fill();
}
