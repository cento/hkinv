import { defineConfig } from "vite";
import { readFileSync } from "fs";

function getVersion(): string {
  try {
    const pkg = JSON.parse(readFileSync("package.json", "utf8"));
    return pkg.version || "0.0.0";
  } catch {
    return "0.0.0";
  }
}
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(getVersion()),
  },
  plugins: [
    react(),
    VitePWA({
      registerType: "prompt",
      includeAssets: ["icon-192.png", "icon-512.png"],
      manifest: false,
      workbox: {
        globPatterns: ["**/*.{js,css,html,wasm,png,svg,json}"],
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
      },
      devOptions: {
        enabled: false,
      },
    }),
  ],
  base: "./",
  build: {
    outDir: "dist",
    target: "esnext",
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          "vendor-react": ["react", "react-dom", "react-router-dom"],
          "vendor-mui": [
            "@mui/material",
            "@mui/icons-material",
            "@mui/x-data-grid",
          ],
          "vendor-pdf": ["jspdf", "jspdf-autotable"],
        },
      },
    },
  },
  server: {
    port: 5173,
    open: true,
  },
});
