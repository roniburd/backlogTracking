import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

// Unit tests target the pure logic in lib/ (per docs/ARCHITECTURE.md, that is
// where business logic lives and where tests pay off). Node environment by
// default; add a jsdom project later if/when component tests are needed.
export default defineConfig({
  resolve: {
    // Mirror the `@/*` -> repo-root alias from tsconfig.json so imports resolve.
    alias: {
      "@": fileURLToPath(new URL(".", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    include: ["lib/**/*.{test,spec}.ts", "test/**/*.{test,spec}.ts"],
  },
});
