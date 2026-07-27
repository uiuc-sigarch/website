import { existsSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const eventsRoot = join(projectRoot, "events");
const imageExtensions = new Set([".png", ".jpg", ".jpeg", ".webp", ".gif", ".avif"]);

function titleize(value) {
  return value
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function imageFiles(directory) {
  return readdirSync(directory, { withFileTypes: true })
    .filter((entry) => entry.isFile() && imageExtensions.has(resolveExtension(entry.name)))
    .map((entry) => entry.name)
    .sort();
}

function resolveExtension(filename) {
  const dot = filename.lastIndexOf(".");
  return dot === -1 ? "" : filename.slice(dot).toLowerCase();
}

function readEvent(directory, slug) {
  const metadataPath = join(directory, "event.json");
  const metadata = existsSync(metadataPath)
    ? JSON.parse(readFileSync(metadataPath, "utf8"))
    : {};
  const images = imageFiles(directory);
  const selectedImage = metadata.image && images.includes(metadata.image)
    ? metadata.image
    : images[0];

  return {
    slug,
    title: metadata.title || titleize(slug),
    date: metadata.date || "",
    description: metadata.description || "",
    luma: metadata.luma || "",
    image: selectedImage ? `events/${slug}/${selectedImage}` : ""
  };
}

const events = readdirSync(eventsRoot, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => readEvent(join(eventsRoot, entry.name), entry.name));

writeFileSync(join(projectRoot, "events.json"), `${JSON.stringify(events, null, 2)}\n`);
console.log(`Indexed ${events.length} event(s).`);
