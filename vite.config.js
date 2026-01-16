import { defineConfig } from "vite";
import { dirname, resolve } from "path";
import { globSync } from "glob";
import fs from "fs";

const copyMarkdownPlugin = () => {
  return {
    name: "copy-markdown",
    closeBundle: () => {
      const files = globSync("src/tutorials/*/document.md");
      const sourceFiles = globSync("src/tutorials/**/*.{ts,wgsl,md}")
        .concat(globSync("src/utils/webgpu-util.ts"))
        .concat(globSync("src/styles/**/*.css"));
      const extraFiles = ["tutorials.json"];
      files.forEach((file) => {
        const dest = resolve(__dirname, "dist", file);
        fs.mkdirSync(dirname(dest), { recursive: true });
        fs.copyFileSync(resolve(__dirname, file), dest);
        console.log(`Copied ${file} to dist/`);
      });
      sourceFiles.forEach((file) => {
        const dest = resolve(__dirname, "dist", file);
        fs.mkdirSync(dirname(dest), { recursive: true });
        fs.copyFileSync(resolve(__dirname, file), dest);
        console.log(`Copied ${file} to dist/`);
      });
      extraFiles.forEach((file) => {
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
        ["index.html", ...globSync("src/tutorials/*/index.html")].map(
          (file) => [file.slice(0, -5), resolve(__dirname, file)]
        )
      ),
    },
  },
});
