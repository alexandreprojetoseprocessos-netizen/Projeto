import path from "node:path";
import autoprefixer from "autoprefixer";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "tailwindcss";

export default defineConfig({
  plugins: [react()],
  envDir: path.resolve(__dirname, "../../"),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src")
    },
    extensions: [".ts", ".tsx", ".js", ".jsx", ".mjs", ".json"]
  },
  css: {
    postcss: {
      plugins: [tailwindcss(), autoprefixer()]
    }
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) return;

          if (
            id.includes("recharts") ||
            id.includes("react-smooth") ||
            id.includes("victory-vendor") ||
            id.includes("/d3-")
          ) {
            return "charts";
          }
          if (id.includes("@supabase")) return "supabase";
          if (id.includes("react-router") || id.includes("@remix-run")) return "router";
          if (
            id.includes("@hello-pangea/dnd") ||
            id.includes("@dnd-kit") ||
            id.includes("@minoru/react-dnd-treeview")
          ) {
            return "dnd";
          }
          if (id.includes("lucide-react")) return "icons";
        }
      }
    }
  },
  server: {
    port: 5173
  }
});
