import { renderView as renderAPOD } from './views/apod.mjs';
import { renderView as renderLaunches } from './views/launches.mjs';
import { renderView as renderGallery } from './views/gallery.mjs';
import { renderView as renderFavorites } from './views/favorites.mjs';

const routes = {
    '/': renderAPOD,
    '/apod': renderAPOD,
    '/gallery': renderGallery,
    '/launches': renderLaunches,
    '/favorites': renderFavorites
};

export function startRouter() {
    function render() {
        const hash = location.hash || '#/apod';
        const path = hash.replace('#', '');
        (routes[path] || apod)(document.getElementById('view'));
        document.querySelectorAll('.tabs a').forEach(a => a.removeAttribute('aria-current'));
        const el = document.getElementById(`tab-${path.slice(1) || 'apod'}`);
        if (el) el.setAttribute('aria-current', 'page');
    }
    addEventListener('hashchange', render);
    render();
}

function setActiveTab(path) {
    document.querySelectorAll('.tabs a').forEach(a => a.removeAttribute('aria-current'));
    const id = path.slice(1); // 'apod' | 'gallery' | 'launches'
    const el = document.getElementById(`tab-${id}`);
    if (el) el.setAttribute('aria-current', 'page');
}
