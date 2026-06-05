import { defineConfig } from "vite";
import path from "path";

export default defineConfig({
  build: {
    lib: {
      entry: path.resolve(__dirname, "src/index.ts"),
      name: "FeedbackWidget",
      fileName: () => "widget.js",
      formats: ["iife"],
    },
    outDir: path.resolve(__dirname, "../public"),
    emptyOutDir: false,
  },
});
