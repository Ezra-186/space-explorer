import { renderView as renderAPOD } from "./views/apod.mjs";
import { renderView as renderRover } from "./views/rover.mjs";
import { renderView as renderLaunches } from "./views/launches.mjs";

const routes = {
    "/apod": renderAPOD,
    "/rover": renderRover,
    "/launches": renderLaunches,
};

export function startRouter() {
    function render() {
        const hash = location.hash || "#/apod";
        const path = hash.replace("#", "");
        const fn = routes[path] || routes["/apod"];
        setActiveTab(path);
        fn(document.getElementById("view"));
    }
    window.addEventListener("hashchange", render);
    render();
}

function setActiveTab(path) {
    document.querySelectorAll(".tabs a").forEach(a => {
        a.removeAttribute("aria-current");
    });
    const id = path.slice(1);
    const el = document.getElementById(`tab-${id}`);
    if (el) el.setAttribute("aria-current", "page");
}
