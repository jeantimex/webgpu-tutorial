import { defineConfig } from "vite";
import { resolve } from "path";

export default defineConfig({
  base: "/webgpu-tutorial/",
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
        "01-hello-webgpu": resolve(__dirname, "01-hello-webgpu.html"),
      },
    },
  },
});
