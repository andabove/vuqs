import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    name: "vuqs",
    environment: "happy-dom",
    include: ["src/**/*.test.ts"],
  },
});
