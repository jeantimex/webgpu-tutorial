import fs from "fs";
import path from "path";
import { globSync } from "glob";

const root = process.cwd();
const tutorialsPath = path.join(root, "tutorials.json");

const folderPaths = globSync("src/tutorials/*/index.html").map((file) =>
  path.dirname(file)
);
const folderNames = folderPaths.map((dir) => path.basename(dir));

let existing = [];
if (fs.existsSync(tutorialsPath)) {
  existing = JSON.parse(fs.readFileSync(tutorialsPath, "utf8"));
}

const existingByName = new Map(
  existing.map((entry) => [
    entry.filename?.split("/").slice(-2, -1)[0],
    entry,
  ])
);

const normalizeTitle = (name) =>
  name
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

const readTitleFromDoc = (dir) => {
  const docPath = path.join(dir, "document.md");
  if (!fs.existsSync(docPath)) return null;
  const text = fs.readFileSync(docPath, "utf8");
  const match = text.match(/^#\s+(.+)\s*$/m);
  return match ? match[1].trim() : null;
};

const buildEntry = (name) => {
  const dir = path.join(root, "src", "tutorials", name);
  const title = readTitleFromDoc(dir) || normalizeTitle(name);
  const entry = {
    title,
    filename: `src/tutorials/${name}/index.html`,
  };
  return entry;
};

const ordered = [];
const seen = new Set();

for (const entry of existing) {
  const name = entry.filename?.split("/").slice(-2, -1)[0];
  if (!name || !folderNames.includes(name) || seen.has(name)) continue;
  ordered.push({
    ...entry,
    filename: `src/tutorials/${name}/index.html`,
  });
  seen.add(name);
}

for (const name of folderNames) {
  if (seen.has(name)) continue;
  const entry = buildEntry(name);
  ordered.push(entry);
}

fs.writeFileSync(tutorialsPath, JSON.stringify(ordered, null, 2) + "\n");
console.log(`Synced ${ordered.length} tutorials to tutorials.json`);
