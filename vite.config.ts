import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
export default defineConfig({
  plugins: [react()],
  build: {
    lib: {
      entry: "src/index.ts",
      formats: ["es"],
      fileName: "feature-flag-evaluator",
    },
    rollupOptions: { external: ["react", "react-dom", "react/jsx-runtime"] },
  },
  test: {
    environment: "jsdom",
    include: ["src/**/*.test.{ts,tsx}"],
    pool: "forks",
    // Use jsdom storage rather than Node's experimental browser globals.
    poolOptions: { forks: { execArgv: ["--no-experimental-webstorage"] } },
  },
});
