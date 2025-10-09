import { startRouter } from "./router.mjs";

// footer year
const year = document.getElementById("year");
if (year) year.textContent = new Date().getFullYear();


startRouter();

