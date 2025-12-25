import path from "path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    proxy: {
      // Dev-only helper to bypass CORS for pdf.js when the remote host doesn't send ACAO headers.
      // Usage from the app: `/__pdf_proxy/<remote-path>` (same-origin).
      "/__pdf_proxy": {
        target: "https://json-api.uz",
        changeOrigin: true,
        secure: true,
        rewrite: (p) => p.replace(/^\/__pdf_proxy/, ""),
      },
    },
  },
});
