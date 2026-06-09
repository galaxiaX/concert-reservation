import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";

// Setup per Next.js 16 docs (node_modules/next/dist/docs/01-app/02-guides/testing/vitest.md):
// Vitest + @vitejs/plugin-react + jsdom. tsconfigPaths resolves the "@/*" alias.
export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
  },
});
