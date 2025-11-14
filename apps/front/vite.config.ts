import path from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  envDir: path.resolve(__dirname, "../../"),
  resolve: {
    extensions: [".ts", ".tsx", ".js", ".jsx", ".mjs", ".json"]
  },
  css: {
    postcss: {
      plugins: []
    }
  },
  server: {
    port: 5173
  }
});
