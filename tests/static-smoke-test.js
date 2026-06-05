const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

function parseJson(relativePath) {
  return JSON.parse(read(relativePath));
}

const required = [
  ".github/workflows/deploy-pages.yml",
  "web/index.html",
  "web/lessons.html",
  "web/reading.html",
  "web/vocabulary.html",
  "web/review.html",
  "web/video.html",
  "web/song.html",
  "web/progress.html",
  "web/data/lessons.json",
  "web/assets/js/data-schema.js",
  "web/assets/js/migrations.js",
  "web/assets/js/backup.js",
  "web/assets/js/progress.js"
];

required.forEach((file) => assert(fs.existsSync(path.join(root, file)), `Missing required file: ${file}`));

const lessons = parseJson("web/data/lessons.json");
assert(Array.isArray(lessons) && lessons.length > 0, "lessons.json must contain at least one lesson.");
lessons.forEach((lesson) => {
  ["id", "slug", "title", "language", "level", "topic", "estimatedTime", "shortDescription", "tags", "publishedAt", "updatedAt", "dataFile"].forEach((field) => {
    assert(Object.prototype.hasOwnProperty.call(lesson, field), `Lesson ${lesson.slug || lesson.id} missing ${field}`);
  });
  assert(!lesson.dataFile.startsWith("/"), `Lesson ${lesson.slug} dataFile must be relative.`);
  parseJson(path.join("web", lesson.dataFile));
});

fs.readdirSync(path.join(root, "web")).filter((file) => file.endsWith(".html")).forEach((file) => {
  const html = read(path.join("web", file));
  assert(!/href="\/|src="\//.test(html), `${file} contains root-relative href or src.`);
  assert(html.includes("assets/js/data-schema.js"), `${file} must load data-schema.js.`);
});

console.log("Static smoke test OK");

