import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const fromRoot = (path: string) => fileURLToPath(new URL(path, import.meta.url));

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    include: ["tests/**/*.test.ts"],
    setupFiles: ["tests/setup.ts"],
    // Integration tests share one database, so run the files sequentially.
    fileParallelism: false,
    testTimeout: 30_000,
    hookTimeout: 30_000,
  },
  resolve: {
    alias: [
      // `server-only` throws outside a React Server Component graph. The data
      // layer is imported directly in tests, so it is stubbed out here.
      { find: /^server-only$/, replacement: fromRoot("./tests/stubs/server-only.ts") },
      // Next ships `next/server` through export conditions Vite's Node
      // resolver does not apply; point it at the real file instead.
      { find: /^next\/server$/, replacement: fromRoot("./node_modules/next/server.js") },
      { find: /^@\//, replacement: fromRoot("./src/") },
    ],
  },
});
