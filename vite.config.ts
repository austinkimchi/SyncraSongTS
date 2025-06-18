import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 80,
    allowedHosts: ["syncrasong.austin.kim"]
  },
  optimizeDeps: {
    exclude: ["node_modules/.cache"],
    force: false,
  },
});
