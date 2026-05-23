import vue from "@vitejs/plugin-vue";
import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [vue()],
  resolve: {
    dedupe: ["vue", "vue-router"],
    alias: {
      "@andabove/vuqs": fileURLToPath(new URL("../../packages/vuqs/src/index.ts", import.meta.url)),
    },
  },
});
