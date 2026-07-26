import { readdirSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const meetingsRoot = join(projectRoot, "meetings");

function titleize(filename) {
  return filename
    .replace(/\.pdf$/i, "")
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatDate(slug) {
  const match = /^(\w+)-(\d{1,2})-(\d{4})$/.exec(slug);
  if (!match) {
    return slug;
  }
  const date = new Date(`${match[1]} ${match[2]}, ${match[3]} 12:00:00 UTC`);
  return Number.isNaN(date.getTime())
    ? slug
    : new Intl.DateTimeFormat("en-US", { dateStyle: "long", timeZone: "UTC" }).format(date);
}

const meetings = readdirSync(meetingsRoot, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => {
    const files = readdirSync(join(meetingsRoot, entry.name))
      .filter((filename) => filename.toLowerCase().endsWith(".pdf"))
      .sort()
      .map((filename) => ({
        title: titleize(filename),
        path: relative(projectRoot, join(meetingsRoot, entry.name, filename)).replaceAll("\\", "/")
      }));

    return {
      title: "SIGARCH meeting materials",
      date: formatDate(entry.name),
      files
    };
  })
  .filter((meeting) => meeting.files.length > 0)
  .sort((a, b) => new Date(b.date) - new Date(a.date));

writeFileSync(join(projectRoot, "meetings.json"), `${JSON.stringify(meetings, null, 2)}\n`);
console.log(`Indexed ${meetings.reduce((total, meeting) => total + meeting.files.length, 0)} PDF(s).`);
