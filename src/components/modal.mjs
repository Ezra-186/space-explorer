export function initModal() {
    const dlg = document.getElementById("media-modal");
    if (!dlg) return;

    const closeBtn = dlg.querySelector(".modal-close");

    // close: X button
    closeBtn?.addEventListener("click", () => dlg.close());

    // close: backdrop click
    dlg.addEventListener("click", (e) => {
        if (e.target === dlg) dlg.close();
    });

    // close: Esc (dialog "cancel")
    dlg.addEventListener("cancel", (e) => {
        e.preventDefault();
        dlg.close();
    });
}

// modal: open helper
export function openImageModal({ src, alt = "", caption = "" }) {
    const dlg = document.getElementById("media-modal");
    if (!dlg) return;

    const img = dlg.querySelector("#modal-img");
    const cap = dlg.querySelector("#modal-caption");

    if (img) { img.src = src; img.alt = alt; }
    if (cap) cap.textContent = caption;

    dlg.showModal();
}
