import { cpSync, existsSync, mkdirSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const sourceRoot = resolve(process.argv[2] || join(projectRoot, ".meetings-source"));
const destinationRoot = join(projectRoot, "meetings");

if (!existsSync(sourceRoot)) {
  throw new Error(`Meetings source directory does not exist: ${sourceRoot}`);
}

function findPdfs(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const sourcePath = join(directory, entry.name);
    if (entry.isDirectory()) {
      return findPdfs(sourcePath);
    }
    return entry.isFile() && entry.name.toLowerCase().endsWith(".pdf") ? [sourcePath] : [];
  });
}

function titleize(filename) {
  return filename
    .replace(/\.pdf$/i, "")
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function folderDate(folder) {
  const folderName = folder.split("/").pop();
  const match = /^(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)-(\d{1,2})-(\d{4})$/i.exec(folderName);
  if (!match) {
    return folderName;
  }
  const months = {
    jan: "January", feb: "February", mar: "March", apr: "April",
    may: "May", jun: "June", jul: "July", aug: "August",
    sep: "September", oct: "October", nov: "November", dec: "December"
  };
  return `${months[match[1].toLowerCase()]} ${match[2]}, ${match[3]}`;
}

function folderSortValue(folder) {
  const folderName = folder.split("/").pop();
  const match = /^(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)-(\d{1,2})-(\d{4})$/i.exec(folderName);
  if (!match) {
    return 0;
  }
  const months = { jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5, jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11 };
  return Date.UTC(Number(match[3]), months[match[1].toLowerCase()], Number(match[2]));
}

rmSync(destinationRoot, { recursive: true, force: true });
mkdirSync(destinationRoot, { recursive: true });

const groups = new Map();
for (const sourcePath of findPdfs(sourceRoot)) {
  const relativePath = relative(sourceRoot, sourcePath).replaceAll("\\", "/");
  const destinationPath = join(destinationRoot, relativePath);
  mkdirSync(dirname(destinationPath), { recursive: true });
  cpSync(sourcePath, destinationPath);

  const folder = dirname(relativePath).replaceAll("\\", "/") || "root";
  if (!groups.has(folder)) {
    groups.set(folder, []);
  }
  groups.get(folder).push({
    title: titleize(relativePath.split("/").pop()),
    path: `meetings/${relativePath}`
  });
}

const meetings = Array.from(groups.entries())
  .map(([folder, files]) => ({
    folder,
    title: "SIGARCH meeting materials",
    date: folderDate(folder),
    files: files.sort((a, b) => a.title.localeCompare(b.title))
  }))
  .sort((a, b) => folderSortValue(b.folder) - folderSortValue(a.folder) || b.folder.localeCompare(a.folder))
  .map(({ folder, ...meeting }) => meeting);

writeFileSync(join(projectRoot, "meetings.json"), `${JSON.stringify(meetings, null, 2)}\n`);
console.log(`Copied ${meetings.reduce((count, meeting) => count + meeting.files.length, 0)} meeting PDF(s).`);
