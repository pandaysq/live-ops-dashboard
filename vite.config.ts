import path from "node:path";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: { alias: { "@": path.resolve(process.cwd(), "src") } },
  server: { host: "0.0.0.0", proxy: { "/api/socket.io": { target: "http://127.0.0.1:3001", ws: true } } },
});
