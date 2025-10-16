import { renderView as renderAPOD } from "./views/apod.mjs";
import { renderView as renderGallery } from "./views/gallery.mjs";
import { renderView as renderLaunches } from "./views/launches.mjs";
import { renderView as renderFavorites } from "./views/favorites.mjs";
import { renderView as renderNEO } from "./views/neo.mjs";

// Routes 
const routes = {
    "/": renderAPOD,
    "/apod": renderAPOD,
    "/gallery": renderGallery,
    "/launches": renderLaunches,
    "/favorites": renderFavorites,
    "/neo": renderNEO,
};

const DEFAULT_ROUTE = "/apod";

function normalizeRouteFromHash(input) {
    let h = input || "";
    if (h.includes("#")) h = h.slice(h.indexOf("#") + 1);
    if (h.startsWith("#")) h = h.slice(1);
    h = h.split("?")[0].split("&")[0].replace(/\/+$/, "");
    if (!h.startsWith("/")) h = `/${h}`;
    if (h === "/apod") h = "/";
    if (h === "") h = "/";
    return h;
}

export function startRouter() {
    const main = document.getElementById("view");
    if (!main) return;

    // a11y: ensure focus target exists
    if (!main.hasAttribute("tabindex")) main.setAttribute("tabindex", "-1");

    async function render() {
        // path from current hash
        const path = normalizeRouteFromHash(location.hash || `#${DEFAULT_ROUTE}`);
        const handler = routes[path] || renderAPOD;

        // render with guard
        try {
            await handler(main);
        } catch (e) {
            console.error("[router] view error:", e);
            main.innerHTML = '<p class="error">Something went wrong loading this view.</p>';
        }

        // ---- nav highlight (robust pluss ARIA) ----
        const canonicalForHighlight = path === "/" ? "/apod" : path;
        const currentHref = `#${canonicalForHighlight}`;

        document.querySelectorAll('#primary-nav a[role="tab"]').forEach((a) => {
            const href = a.getAttribute("href") || "";
            const on = normalizeRouteFromHash(href) === normalizeRouteFromHash(currentHref);

            // class hooks
            a.classList.toggle("active", on);
            a.closest("li")?.classList.toggle("active", on);
            a.setAttribute("aria-selected", on ? "true" : "false");
            if (on) a.setAttribute("aria-current", "page");
            else a.removeAttribute("aria-current");
        });

        main.focus({ preventScroll: true });
    }

    addEventListener("hashchange", render, { passive: true });
    render();
}
