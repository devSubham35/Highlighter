import { AnnotationCanvas, AnnotationTool } from "./annotate";
import { uploadScreenshot, submitReport } from "./api";
import { captureScreenshot } from "./capture";
import { collectMetadata } from "./metadata";
import { createButton, injectStyles } from "./ui";

type WidgetConfig = {
  projectKey: string;
  position?: "bottom-right" | "bottom-left" | "top-right" | "top-left";
  color?: string;
  apiBaseUrl?: string;
};

const FeedbackWidget = {
  config: null as WidgetConfig | null,

  init(config: WidgetConfig) {
    this.config = { position: "bottom-right", color: "var(--highlight-primary)", apiBaseUrl: "", ...config };
    injectStyles();
    createButton(this.config.color!, this.config.position!, () => this.open());
  },

  async open() {
    const cfg = this.config;
    if (!cfg) return;
    const metadata = collectMetadata();
    const overlay = document.createElement("div");
    overlay.id = "__highlight-overlay";
    overlay.innerHTML = `
      <div id="__highlight-modal">
        <h2 style="margin:0 0 12px;font-size:20px">Report an issue</h2>
        <p id="__highlight-status" style="margin:0 0 12px;color:var(--highlight-muted)">Capturing screenshot...</p>
        <canvas id="__highlight-canvas" style="width:100%;border:1px solid var(--highlight-canvas-border);border-radius:8px;cursor:crosshair"></canvas>
        <div style="display:flex;gap:8px;flex-wrap:wrap;margin:12px 0">
          <button data-tool="rectangle" type="button">Rectangle</button>
          <button data-tool="arrow" type="button">Arrow</button>
          <button data-tool="highlight" type="button">Highlight</button>
          <button id="__highlight-undo" type="button" style="margin-left:auto">Undo</button>
        </div>
        <div style="display:grid;gap:8px">
          <input id="__highlight-title" placeholder="Bug title *" />
          <textarea id="__highlight-description" placeholder="Describe the issue"></textarea>
          <select id="__highlight-severity"><option value="LOW">Low</option><option value="MEDIUM" selected>Medium</option><option value="HIGH">High</option><option value="CRITICAL">Critical</option></select>
        </div>
        <div style="display:flex;gap:10px;justify-content:flex-end;margin-top:16px">
          <button id="__highlight-cancel" type="button">Cancel</button>
          <button id="__highlight-submit" type="button" style="background:var(--highlight-primary);color:var(--highlight-icon);border:0;border-radius:8px;padding:10px 14px">Submit report</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);

    const canvas = overlay.querySelector<HTMLCanvasElement>("#__highlight-canvas")!;
    const status = overlay.querySelector<HTMLElement>("#__highlight-status")!;
    let annotator: AnnotationCanvas | null = null;

    try {
      const blob = await captureScreenshot();
      const url = URL.createObjectURL(blob);
      const image = new Image();
      image.src = url;
      await new Promise((resolve) => {
        image.onload = resolve;
      });
      canvas.width = image.width;
      canvas.height = image.height;
      annotator = new AnnotationCanvas(canvas);
      annotator.setImage(image);
      URL.revokeObjectURL(url);
      status.remove();
    } catch {
      status.textContent = "Screenshot capture is unavailable on this page.";
    }

    overlay.addEventListener("click", (event) => {
      const target = event.target as HTMLElement;
      const tool = target.closest<HTMLElement>("[data-tool]");
      if (tool && annotator) annotator.setTool(tool.dataset.tool as AnnotationTool);
    });
    overlay.querySelector("#__highlight-undo")?.addEventListener("click", () => annotator?.undo());
    overlay.querySelector("#__highlight-cancel")?.addEventListener("click", () => overlay.remove());
    overlay.querySelector("#__highlight-submit")?.addEventListener("click", async () => {
      const title = overlay.querySelector<HTMLInputElement>("#__highlight-title")!.value.trim();
      const description = overlay.querySelector<HTMLTextAreaElement>("#__highlight-description")!.value.trim();
      const severity = overlay.querySelector<HTMLSelectElement>("#__highlight-severity")!.value;
      if (!title) return window.alert("Title is required");
      let screenshotUrl: string | undefined;
      try {
        if (annotator) screenshotUrl = await uploadScreenshot(cfg.apiBaseUrl!, cfg.projectKey, await annotator.toBlob());
      } catch {
        console.warn("Highlight screenshot upload failed");
      }
      await submitReport(cfg.apiBaseUrl!, {
        projectApiKey: cfg.projectKey,
        title,
        description,
        severity,
        screenshotUrl,
        ...metadata,
      });
      overlay.remove();
      this.toast("Bug report submitted");
    });
  },

  toast(message: string) {
    const toast = document.createElement("div");
    toast.style.cssText = "position:fixed;right:24px;bottom:24px;background:var(--highlight-primary);color:var(--highlight-icon);padding:12px 16px;border-radius:8px;z-index:1000001;font-family:system-ui,sans-serif";
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3500);
  },
};

declare global {
  interface Window {
    FeedbackWidget: typeof FeedbackWidget;
  }
}

const currentScript = document.currentScript as HTMLScriptElement | null;
const projectKey = currentScript?.getAttribute("data-project-key");
if (projectKey) {
  FeedbackWidget.init({
    projectKey,
    apiBaseUrl: currentScript?.getAttribute("data-api-base-url") ?? "",
    position: (currentScript?.getAttribute("data-position") as WidgetConfig["position"]) ?? "bottom-right",
    color: currentScript?.getAttribute("data-color") ?? "var(--highlight-primary)",
  });
}

window.FeedbackWidget = FeedbackWidget;
