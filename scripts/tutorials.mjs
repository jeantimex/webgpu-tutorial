import fs from "fs";
import path from "path";

const root = process.cwd();
const tutorialsPath = path.join(root, "tutorials.json");
const readmePath = path.join(root, "README.md");

const slugFromArgs = process.argv[3];
const action = process.argv[2];
const titleArg = process.argv[4];

const normalizeTitle = (name) =>
  name
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

const ensureDir = (dir) => {
  fs.mkdirSync(dir, { recursive: true });
};

const readTutorials = () => {
  if (!fs.existsSync(tutorialsPath)) return [];
  return JSON.parse(fs.readFileSync(tutorialsPath, "utf8"));
};

const writeTutorials = (data) => {
  fs.writeFileSync(tutorialsPath, JSON.stringify(data, null, 2) + "\n");
};

const readReadme = () => {
  if (!fs.existsSync(readmePath)) return "";
  return fs.readFileSync(readmePath, "utf8");
};

const writeReadme = (text) => {
  fs.writeFileSync(readmePath, text);
};

const updateReadmeTable = (tutorials) => {
  if (!fs.existsSync(readmePath)) return;
  const text = readReadme();
  const rowRe =
    /^\|\s*\d+\s*\|\s*\[(.+?)\]\((.+?)\)\s*\|\s*(.+?)\s*\|\s*$/gm;
  const descMap = new Map();
  let match;
  while ((match = rowRe.exec(text)) !== null) {
    descMap.set(match[1], match[3]);
  }

  const lines = [];
  lines.push("| Index | Title | Description |");
  lines.push("| :-- | :-- | :-- |");
  tutorials.forEach((entry, idx) => {
    const title = entry.title;
    const link = `src/tutorials/${entry.filename
      .split("/")
      .slice(-2, -1)[0]}/document.md`;
    const desc =
      descMap.get(title) ||
      "Learn the concepts and implementation details in this tutorial.";
    lines.push(`| ${String(idx + 1).padStart(2, "0")} | [${title}](${link}) | ${desc} |`);
  });

  const table = lines.join("\n");
  const pattern = /## Tutorials\n\n(?:\|.*\n)+/m;
  if (!pattern.test(text)) {
    throw new Error("README.md tutorials table not found.");
  }
  const updated = text.replace(pattern, `## Tutorials\n\n${table}\n`);
  writeReadme(updated);
};

const createTutorial = (slug, title) => {
  if (!slug) throw new Error("Missing tutorial slug.");
  const dir = path.join(root, "src", "tutorials", slug);
  if (fs.existsSync(dir)) {
    throw new Error(`Tutorial already exists: ${slug}`);
  }

  ensureDir(dir);

  const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${title}</title>
    <link rel="stylesheet" href="../../styles/common.css" />
  </head>
  <body>
    <canvas id="webgpu-canvas"></canvas>
    <script type="module" src="./index.ts"></script>
  </body>
</html>
`;

  const ts = `import { initWebGPU } from "../../utils/webgpu-util";

async function init(): Promise<void> {
  const canvas = document.querySelector("#webgpu-canvas") as HTMLCanvasElement;
  await initWebGPU(canvas);
}

init().catch((err: Error) => {
  console.error(err);
});
`;

  const md = `# ${title}

Write the tutorial content here.
`;

  fs.writeFileSync(path.join(dir, "index.html"), html);
  fs.writeFileSync(path.join(dir, "index.ts"), ts);
  fs.writeFileSync(path.join(dir, "document.md"), md);

  const tutorials = readTutorials();
  tutorials.push({
    title,
    filename: `src/tutorials/${slug}/index.html`,
  });
  writeTutorials(tutorials);
  updateReadmeTable(tutorials);
};

const deleteTutorial = (slug) => {
  if (!slug) throw new Error("Missing tutorial slug.");
  const dir = path.join(root, "src", "tutorials", slug);
  if (fs.existsSync(dir)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }

  const tutorials = readTutorials().filter((entry) => {
    return entry.filename !== `src/tutorials/${slug}/index.html`;
  });
  writeTutorials(tutorials);
  updateReadmeTable(tutorials);
};

if (!["create", "delete"].includes(action)) {
  console.error("Usage: node scripts/tutorials.mjs <create|delete> <slug> [title]");
  process.exit(1);
}

const slug = slugFromArgs;
const title = titleArg || normalizeTitle(slug || "");

try {
  if (action === "create") {
    createTutorial(slug, title);
  } else {
    deleteTutorial(slug);
  }
  console.log(`${action} tutorial: ${slug}`);
} catch (err) {
  console.error(err.message || err);
  process.exit(1);
}
