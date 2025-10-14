import { getFavs, toggleFav } from '../state.mjs';

const PLACEHOLDER =
  "data:image/svg+xml;utf8,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%27320%27 height=%27180%27%3E%3Crect width=%27100%25%27 height=%27100%25%27 fill=%27%23111827%27/%3E%3Ctext x=%2750%25%27 y=%2750%25%27 dominant-baseline=%27middle%27 text-anchor=%27middle%27 fill=%27%23a3a3a3%27 font-family=%27system-ui%27 font-size=%2714%27%3ENo%20image%3C/text%3E%3C/svg%3E";

export async function renderView(main) {
  let imgs = getFavs('img');
  let launches = getFavs('launch');

  main.innerHTML = `
    <section>
      <h2>Favorites</h2>

      <h3>Images</h3>
      <div id="fav-imgs" class="gallery-grid"></div>
      <p id="empty-imgs" class="muted" ${imgs.length ? 'hidden' : ''}>No image favorites yet.</p>

      <h3>Launches</h3>
      <div id="fav-launches" class="grid"></div>
      <p id="empty-launches" class="muted" ${launches.length ? 'hidden' : ''}>No launch favorites yet.</p>
    </section>
  `;

  const imgGrid = main.querySelector('#fav-imgs');
  const launchGrid = main.querySelector('#fav-launches');
  const emptyImgs = main.querySelector('#empty-imgs');
  const emptyLaunches = main.querySelector('#empty-launches');
  const safeSrc = (url) =>
    (url && !String(url).startsWith('data:image/svg+xml')) ? url : PLACEHOLDER;

  // Render image favorites
  function renderImages() {
    if (!imgs.length) {
      imgGrid.innerHTML = '';
      emptyImgs.hidden = false;
      return;
    }
    emptyImgs.hidden = true;

    imgGrid.innerHTML = imgs.map(it => {
      const src = safeSrc(it.thumb);
      const title = it.title || 'Image';
      return `
        <figure class="tile">
          <button class="fav" type="button" data-type="img" data-id="${it.id}" aria-pressed="true">★</button>
          <img src="${src}" alt="${title}" loading="lazy" decoding="async">
          <figcaption>${title}</figcaption>
        </figure>
      `;
    }).join('');
  }

  // Render launch favorites
  function renderLaunches() {
    if (!launches.length) {
      launchGrid.innerHTML = '';
      emptyLaunches.hidden = false;
      return;
    }
    emptyLaunches.hidden = true;

    launchGrid.innerHTML = launches.map(l => {
      const src = safeSrc(l.img);
      const name = l.name || 'Launch';
      return `
        <article class="card">
          <button class="fav" type="button" data-type="launch" data-id="${l.id}" aria-pressed="true">★</button>
          <img src="${src}" alt="${name}" loading="lazy" decoding="async">
          <div class="card-body">
            <h3>${name}</h3>
          </div>
        </article>
      `;
    }).join('');
  }

  // First paint
  renderImages();
  renderLaunches();

  // Remove from favorites
  main.addEventListener('click', (e) => {
    const btn = e.target.closest('button.fav');
    if (!btn) return;

    const { id, type } = btn.dataset;
    const isOn = toggleFav(type, id);

    if (!isOn) {
      const selector = type === 'img' ? '.tile' : '.card';
      btn.closest(selector)?.remove();

      if (type === 'img') {
        imgs = imgs.filter(it => String(it.id) !== String(id));
        if (!imgGrid.querySelector('.tile')) emptyImgs.hidden = false;
      } else {
        launches = launches.filter(l => String(l.id) !== String(id));
        if (!launchGrid.querySelector('.card')) emptyLaunches.hidden = false;
      }
    } else {
      btn.setAttribute('aria-pressed', 'true');
    }
  });
}
