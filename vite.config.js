import { defineConfig } from "vite";
import { resolve } from "path";
import { globSync } from "glob";
import fs from "fs";

const copyMarkdownPlugin = () => {
  return {
    name: "copy-markdown",
    closeBundle: () => {
      const files = globSync("*.md");
      files.forEach((file) => {
        const dest = resolve(__dirname, "dist", file);
        fs.copyFileSync(resolve(__dirname, file), dest);
        console.log(`Copied ${file} to dist/`);
      });
    },
  };
};

export default defineConfig({
  base: "/webgpu-tutorial/",
  plugins: [copyMarkdownPlugin()],
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
