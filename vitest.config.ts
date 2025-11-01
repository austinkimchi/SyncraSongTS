import { defineConfig } from "vitest/config";
import { playwright } from '@vitest/browser-playwright';
import react from "@vitejs/plugin-react-swc";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  test: {
    globals: true,
    environment: "jsdom",
    browser: {
      enabled: true,
      provider: playwright(),
      instances: [
        { browser: 'chromium' },
      ]
    }
  },
  server: {
    port: 80,
    allowedHosts: ["ssv2.austin.kim"]
  },
  optimizeDeps: {
    exclude: ["node_modules/.cache"],
    force: false,
  },
  envPrefix: ["APP_"],
});
