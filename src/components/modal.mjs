export function initModal() {
    const dlg = document.getElementById("media-modal");
    if (!dlg) return;
    const closeBtn = dlg.querySelector(".modal-close");
    closeBtn?.addEventListener("click", () => dlg.close());
    dlg.addEventListener("click", (e) => { if (e.target === dlg) dlg.close(); });
    addEventListener("keydown", (e) => { if (e.key === "Escape" && dlg.open) dlg.close(); });
}

export function openImageModal({ src, alt = "", caption = "" }) {
    const dlg = document.getElementById("media-modal");
    const img = dlg?.querySelector("#modal-img");
    const cap = dlg?.querySelector("#modal-caption");
    if (!dlg || !img) return;
    img.src = src;
    img.alt = alt;
    if (cap) cap.textContent = caption;
    dlg.showModal();
}