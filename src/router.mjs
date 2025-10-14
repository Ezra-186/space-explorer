import { renderView as renderAPOD } from "./views/apod.mjs";
import { renderView as renderGallery } from "./views/gallery.mjs";
import { renderView as renderLaunches } from "./views/launches.mjs";
import { renderView as renderFavorites } from "./views/favorites.mjs";
import { renderView as renderNEO } from "./views/neo.mjs";

const routes = {
    "/": renderAPOD,
    "/apod": renderAPOD,
    "/gallery": renderGallery,
    "/launches": renderLaunches,
    "/favorites": renderFavorites,
    "/neo": renderNEO,
};

export function startRouter() {
    const main = document.getElementById("view");
    if (!main) return;

    async function render() {
        const hash = location.hash.replace(/^#/, "");
        const path = hash || "/apod";
        const handler = routes[path] || renderAPOD;

        // view: render with error guard
        try {
            await handler(main);
        } catch (e) {
            console.error("[router] view error:", e);
            main.innerHTML = '<p class="error">Something went wrong loading this view.</p>';
        }

        // nav: highlight active
        document.querySelectorAll('#primary-nav [role="tab"]')
            .forEach((a) => a.classList.toggle("active", a.getAttribute("href") === `#${path}`));

        // a11y: focus main
        main.focus({ preventScroll: true });
    }

    addEventListener("hashchange", render);
    render();
}
