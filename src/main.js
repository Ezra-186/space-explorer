import { getTodayAPOD } from "./api/nasa.js";
import { renderAPOD } from "./views/apod.js";

// footer year
const year = document.getElementById("year");
if (year) year.textContent = new Date().getFullYear();

// bootstrap APOD
(async () => {
    try {
        const data = await getTodayAPOD();
        renderAPOD(data);
    } catch (err) {
        const el = document.getElementById("apod-error");
        el.textContent = "Could not load APOD. Try again later.";
        el.hidden = false;
    } finally {
        const skel = document.getElementById("apod-skeleton");
        if (skel) skel.remove();
    }
})();
