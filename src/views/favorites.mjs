import { getFavs, toggleFav } from '../state.mjs';

export async function renderView(main) {
    let imgs = getFavs('img');
    let launches = getFavs('launch'); 

    const isBadImg = (it) => !it?.thumb || String(it.thumb).startsWith('data:image/svg+xml');
    const isBadLaunch = (l) => !l?.img || String(l.img).startsWith('data:image/svg+xml');

    imgs.filter(isBadImg).forEach(it => toggleFav('img', it.id));  
    launches.filter(isBadLaunch).forEach(l => toggleFav('launch', l.id)); 

    // reload after purge
    imgs = getFavs('img').filter(it => !isBadImg(it));
    launches = getFavs('launch').filter(l => !isBadLaunch(l));

    // --- scaffold
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

    // --- render helpers
    function renderImages() {
        if (!imgs.length) {
            imgGrid.innerHTML = '';
            emptyImgs.hidden = false;
            return;
        }
        emptyImgs.hidden = true;
        imgGrid.innerHTML = imgs.map(it => `
      <figure class="tile">
        <button class="fav" type="button" data-type="img" data-id="${it.id}" aria-pressed="true">★</button>
        <img src="${it.thumb}" alt="${it.title || 'Image'}" loading="lazy" decoding="async">
        <figcaption>${it.title || ''}</figcaption>
      </figure>
    `).join('');
    }

    function renderLaunches() {
        if (!launches.length) {
            launchGrid.innerHTML = '';
            emptyLaunches.hidden = false;
            return;
        }
        emptyLaunches.hidden = true;
        launchGrid.innerHTML = launches.map(l => `
      <article class="card">
        <button class="fav" type="button" data-type="launch" data-id="${l.id}" aria-pressed="true">★</button>
        <img src="${l.img}" alt="${l.name || 'Launch'}" loading="lazy" decoding="async">
        <div class="card-body">
          <h3>${l.name || ''}</h3>
        </div>
      </article>
    `).join('');
    }

    renderImages();
    renderLaunches();

    main.addEventListener('click', (e) => {
        const btn = e.target.closest('button.fav');
        if (!btn) return;

        const { id, type } = btn.dataset; 
        const isOn = toggleFav(type, id); 

        if (!isOn) {
            const selector = type === 'img' ? '.tile' : '.card';
            const card = btn.closest(selector);
            if (card) card.remove();

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