import { defineConfig } from "vite";
import { resolve } from "path";
import { globSync } from "glob";

export default defineConfig({
  base: "/webgpu-tutorial/",
  build: {
    rollupOptions: {
      input: Object.fromEntries(
        globSync("*.html").map((file) => [
          // Use the filename without extension as the entry name
          // e.g., "01-hello-webgpu.html" -> "01-hello-webgpu"
          file.slice(0, -5),
          resolve(__dirname, file),
        ])
      ),
    },
  },
});
