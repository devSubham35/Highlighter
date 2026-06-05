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
    this.config = { position: "bottom-right", color: "#2563eb", apiBaseUrl: "", ...config };
    injectStyles();
    createButton(this.config.color!, this.config.position!, () => this.open());
  },

  async open() {
    const cfg = this.config;
    if (!cfg) return;
    const metadata = collectMetadata();
    const overlay = document.createElement("div");
    overlay.id = "__highlighter-overlay";
    overlay.innerHTML = `
      <div id="__highlighter-modal">
        <h2 style="margin:0 0 12px;font-size:20px">Report an issue</h2>
        <p id="__highlighter-status" style="margin:0 0 12px;color:#64748b">Capturing screenshot...</p>
        <canvas id="__highlighter-canvas" style="width:100%;border:1px solid #e2e8f0;border-radius:8px;cursor:crosshair"></canvas>
        <div style="display:flex;gap:8px;flex-wrap:wrap;margin:12px 0">
          <button data-tool="rectangle" type="button">Rectangle</button>
          <button data-tool="arrow" type="button">Arrow</button>
          <button data-tool="highlight" type="button">Highlight</button>
          <button id="__highlighter-undo" type="button" style="margin-left:auto">Undo</button>
        </div>
        <div style="display:grid;gap:8px">
          <input id="__highlighter-title" placeholder="Bug title *" />
          <textarea id="__highlighter-description" placeholder="Describe the issue"></textarea>
          <select id="__highlighter-severity"><option value="LOW">Low</option><option value="MEDIUM" selected>Medium</option><option value="HIGH">High</option><option value="CRITICAL">Critical</option></select>
        </div>
        <div style="display:flex;gap:10px;justify-content:flex-end;margin-top:16px">
          <button id="__highlighter-cancel" type="button">Cancel</button>
          <button id="__highlighter-submit" type="button" style="background:#2563eb;color:white;border:0;border-radius:8px;padding:10px 14px">Submit report</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);

    const canvas = overlay.querySelector<HTMLCanvasElement>("#__highlighter-canvas")!;
    const status = overlay.querySelector<HTMLElement>("#__highlighter-status")!;
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
    overlay.querySelector("#__highlighter-undo")?.addEventListener("click", () => annotator?.undo());
    overlay.querySelector("#__highlighter-cancel")?.addEventListener("click", () => overlay.remove());
    overlay.querySelector("#__highlighter-submit")?.addEventListener("click", async () => {
      const title = overlay.querySelector<HTMLInputElement>("#__highlighter-title")!.value.trim();
      const description = overlay.querySelector<HTMLTextAreaElement>("#__highlighter-description")!.value.trim();
      const severity = overlay.querySelector<HTMLSelectElement>("#__highlighter-severity")!.value;
      if (!title) return window.alert("Title is required");
      let screenshotUrl: string | undefined;
      try {
        if (annotator) screenshotUrl = await uploadScreenshot(cfg.apiBaseUrl!, cfg.projectKey, await annotator.toBlob());
      } catch {
        console.warn("Highlighter screenshot upload failed");
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
    toast.style.cssText = "position:fixed;right:24px;bottom:24px;background:#16a34a;color:white;padding:12px 16px;border-radius:8px;z-index:1000001;font-family:system-ui,sans-serif";
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
    color: currentScript?.getAttribute("data-color") ?? "#2563eb",
  });
}

window.FeedbackWidget = FeedbackWidget;
