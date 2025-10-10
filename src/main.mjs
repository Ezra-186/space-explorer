import { startRouter } from "./router.mjs";

// footer year
const year = document.getElementById("year");
if (year) year.textContent = new Date().getFullYear();

// footer last modified
const lastmod = document.getElementById("lastmod");
if (lastmod) {
    const ts = new Date(document.lastModified);
    if (!Number.isNaN(ts.getTime())) {
        lastmod.dateTime = ts.toISOString();
        lastmod.textContent = ts.toLocaleString([], {
            year: "numeric", month: "short", day: "2-digit",
            hour: "2-digit", minute: "2-digit"
        });
    }
}

startRouter();

// mobile menu toggle (dropdown)
const header = document.querySelector('.site-header');
const toggle = document.querySelector('.menu-toggle');
const panel = document.getElementById('primary-nav');

function setOpen(open) {
    header?.setAttribute('data-open', open ? 'true' : 'false');
    toggle?.setAttribute('aria-expanded', open ? 'true' : 'false');
    toggle?.classList.toggle('open', open);
    toggle?.setAttribute('aria-label', open ? 'Close menu' : 'Menu');
}

if (toggle && panel) {
    toggle.addEventListener('click', () => {
        const open = header?.getAttribute('data-open') === 'true';
        setOpen(!open);
    });

    panel.addEventListener('click', (e) => {
        if (e.target.closest('a')) setOpen(false);
    });

    addEventListener('hashchange', () => setOpen(false));

    document.addEventListener('click', (e) => {
        const open = header?.getAttribute('data-open') === 'true';
        if (!open) return;
        if (e.target === toggle || toggle.contains(e.target)) return;
        if (panel.contains(e.target)) return;
        setOpen(false);
    });

    addEventListener('keydown', (e) => { if (e.key === 'Escape') setOpen(false); });
}

