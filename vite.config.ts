import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import svgr from "vite-plugin-svgr";
import path from "path";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), svgr()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  // sockjs-client는 CJS 전용 패키지 — Vite가 esbuild로 pre-bundle해야
  // ESM default import에서 생성자가 올바르게 노출됨.
  optimizeDeps: {
    include: ["sockjs-client"],
  },
});
