export function injectStyles() {
  if (document.getElementById("__highlight-styles")) return;
  const style = document.createElement("style");
  style.id = "__highlight-styles";
  style.textContent = `
    :root{--highlight-primary:#497d00;--highlight-icon:#ffffff;--highlight-shadow:rgba(15,23,42,.28);--highlight-overlay:rgba(15,23,42,.64);--highlight-surface:#ffffff;--highlight-foreground:#0f172a;--highlight-muted:#64748b;--highlight-border:#cbd5e1;--highlight-canvas-border:#e2e8f0;--highlight-annotation-stroke:#dc2626;--highlight-annotation-highlight:rgba(250,204,21,.35);--highlight-annotation-fill:rgba(220,38,38,.12)}
    #__highlight-btn{position:fixed;z-index:999999;width:48px;height:48px;border-radius:999px;border:0;box-shadow:0 10px 30px var(--highlight-shadow);cursor:pointer;display:flex;align-items:center;justify-content:center}
    #__highlight-overlay{position:fixed;inset:0;z-index:1000000;background:var(--highlight-overlay);display:flex;align-items:center;justify-content:center;padding:16px}
    #__highlight-modal{width:760px;max-width:96vw;max-height:92vh;overflow:auto;background:var(--highlight-surface);border-radius:10px;padding:20px;font-family:Inter,system-ui,sans-serif;color:var(--highlight-foreground)}
    #__highlight-modal input,#__highlight-modal textarea,#__highlight-modal select{width:100%;box-sizing:border-box;border:1px solid var(--highlight-border);border-radius:8px;padding:10px;font:inherit}
    #__highlight-modal button{font:inherit}
  `;
  document.head.appendChild(style);
}

export function createButton(color: string, position: string, onClick: () => void) {
  const existing = document.getElementById("__highlight-btn");
  if (existing) existing.remove();
  const button = document.createElement("button");
  button.id = "__highlight-btn";
  button.type = "button";
  button.style.background = color;
  button.setAttribute("aria-label", "Report an issue");
  button.innerHTML = `<svg width="22" height="22" fill="none" stroke="var(--highlight-icon)" stroke-width="2" viewBox="0 0 24 24"><path d="M8 10h8M8 14h5"/><path d="M21 12c0 4.418-4.03 8-9 8a10.5 10.5 0 0 1-3.8-.7L3 21l1.5-4.3A7.5 7.5 0 0 1 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8Z"/></svg>`;
  const positions: Record<string, string> = {
    "bottom-right": "bottom:24px;right:24px",
    "bottom-left": "bottom:24px;left:24px",
    "top-right": "top:24px;right:24px",
    "top-left": "top:24px;left:24px",
  };
  button.style.cssText += positions[position] ?? positions["bottom-right"];
  button.addEventListener("click", onClick);
  document.body.appendChild(button);
}
