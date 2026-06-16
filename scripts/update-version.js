#!/usr/bin/env node
/**
 * update-version.js — Deterministic CHANGELOG.md generator
 *
 * Reads the full git history, classifies each commit by author stream and
 * change significance, calculates version numbers, and regenerates CHANGELOG.md.
 *
 * Usage:  node scripts/update-version.js
 *         npm run update-version
 *
 * Cross-platform: works on Windows, macOS, and Linux (requires git in PATH).
 */

const { execSync } = require("child_process");
const { writeFileSync, mkdirSync, existsSync } = require("fs");
const path = require("path");

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const PUBLIC_DIR = path.join(process.cwd(), "public");
const CHANGELOG_PATH = path.join(PUBLIC_DIR, "CHANGELOG.md");
const VERSION_JSON_PATH = path.join(PUBLIC_DIR, "version.json");

/** Determine which stream an author belongs to. */
function getStream(author) {
  const lower = author.toLowerCase();
  if (lower.includes("ayman") || lower.includes("aymaan")) return "ayman";
  if (lower.includes("raunak")) return "raunak";
  return null;
}

// ---------------------------------------------------------------------------
// Git helpers
// ---------------------------------------------------------------------------

function git(args) {
  return execSync(`git ${args}`, {
    encoding: "utf8",
    maxBuffer: 10 * 1024 * 1024,
  }).trim();
}

function getCommits() {
  // Use %ai (ISO 8601 datetime) for precise ordering, and %ad (short date) for display
  const raw = git(
    `log --reverse --format="%H|%an|%ae|%ad|%ai|%s" --date=short`
  );
  if (!raw) return [];
  return raw.split("\n").map((line) => {
    const [hash, author, email, date, datetime, ...subjectParts] =
      line.split("|");
    return {
      hash,
      author,
      email,
      date,
      datetime,
      subject: subjectParts.join("|"),
    };
  });
}

function getCommitFiles(hash) {
  return git(`show --name-only --format="" ${hash}`);
}

// ---------------------------------------------------------------------------
// Classification heuristics
// ---------------------------------------------------------------------------

const PATCH_KEYWORDS = [
  "fix",
  "typo",
  "lint",
  "format",
  "comment",
  "readme",
  "docs",
  "chore",
  "remove unused",
  "delete unused",
  "cleanup",
  "clean up",
  "bump",
  "revert",
  "patch",
  "tweak",
  "adjust",
  "minor",
  "simplify",
  "update readme",
  "update docs",
  "correct",
  "formatting",
  "whitespace",
];

const MINOR_KEYWORDS = [
  "refactor",
  "migrate",
  "architecture",
  "overhaul",
  "restructure",
  "auth",
  "dashboard",
  "admin",
  "infrastructure",
  "tailwind",
  "upgrade",
  "major",
  "rewrite",
  "reorganize",
  "rearchitect",
];

const FEATURE_KEYWORDS = [
  "feat",
  "feature",
  "add",
  "implement",
  "integrate",
  "create",
  "introduce",
  "new",
  "enable",
  "support",
  "enhance",
  "extend",
];

function classifyCommit(commit, filesText) {
  const subject = commit.subject.toLowerCase();
  const files = filesText.toLowerCase();
  const fileCount = files.split("\n").filter(Boolean).length;

  // Documentation-only checks
  const docOnly =
    /^docs?[: ]/.test(commit.subject) ||
    (fileCount <= 2 &&
      /\.(md|txt|yml|yaml)$/.test(files) &&
      !files.includes(".ts") &&
      !files.includes(".tsx") &&
      !files.includes(".js"));

  // Config-only checks
  const configOnly =
    fileCount <= 2 &&
    /\.(json|yml|yaml|lock|gitignore)$/.test(files) &&
    !files.includes(".ts") &&
    !files.includes(".tsx");

  // Minor: major refactors, migrations, architecture changes
  if (
    MINOR_KEYWORDS.some((kw) => subject.includes(kw)) &&
    (fileCount >= 5 ||
      /refactor|migrate|overhaul|architecture/.test(subject))
  ) {
    return "minor";
  }

  // Initial commit is always minor
  if (
    subject.includes("initial commit") ||
    subject.includes("create next app")
  ) {
    return "minor";
  }

  // Feature: new functionality keywords at start of subject
  if (
    FEATURE_KEYWORDS.some(
      (kw) =>
        subject.startsWith(kw + ":") ||
        subject.startsWith(kw + " ") ||
        subject.startsWith(kw + "(")
    ) ||
    (FEATURE_KEYWORDS.some((kw) => subject.includes(kw)) && fileCount >= 3)
  ) {
    if (fileCount <= 2 && PATCH_KEYWORDS.some((kw) => subject.includes(kw))) {
      return "patch";
    }
    return "feature";
  }

  // Patch: everything else
  if (docOnly || configOnly) return "patch";
  if (PATCH_KEYWORDS.some((kw) => subject.includes(kw))) return "patch";
  if (fileCount <= 2) return "patch";

  return fileCount >= 5 ? "feature" : "patch";
}

// ---------------------------------------------------------------------------
// Version calculation
// ---------------------------------------------------------------------------

function bumpVersion(version, classification) {
  const [major, minor, feature, patch] = version;
  switch (classification) {
    case "minor":
      return [major, minor + 1, 0, 0];
    case "feature":
      return [major, minor, feature + 1, 0];
    case "patch":
      return [major, minor, feature, patch + 1];
    default:
      return version;
  }
}

function versionString(v) {
  return `${v[0]}.${v[1]}.${v[2]}.${v[3]}`;
}

// ---------------------------------------------------------------------------
// Changelog entry formatting
// ---------------------------------------------------------------------------

/** Strip conventional-commit prefix and return clean sentence. */
function cleanSubject(subject) {
  const stripped = subject.replace(
    /^(feat|fix|docs?|style|refactor|chore|test|build|ci|perf)(\([^)]+\))?:\s*/i,
    ""
  );
  // Capitalize first letter
  return stripped.charAt(0).toUpperCase() + stripped.slice(1);
}

function formatChangelogEntry(entry, isLatest) {
  const { commit, classification, version } = entry;
  const shortHash = commit.hash.substring(0, 12);
  const desc = cleanSubject(commit.subject);

  const badge =
    classification === "minor"
      ? " ![minor]"
      : classification === "feature"
        ? " ![feature]"
        : "";

  const latestMarker = isLatest ? " **← latest**" : "";

  return `### ${versionString(version)}${badge}${latestMarker}

${desc}

*${commit.author} · ${commit.date} · \`${shortHash}\`*

`;
}

// ---------------------------------------------------------------------------
// Main generation
// ---------------------------------------------------------------------------

function generateChangelog(commits) {
  const aymanCommits = [];
  const raunakCommits = [];

  for (const commit of commits) {
    const stream = getStream(commit.author);
    if (stream === "ayman") aymanCommits.push(commit);
    else if (stream === "raunak") raunakCommits.push(commit);
  }

  let aymanVersion = [1, 0, 0, 0];
  let raunakVersion = [2, 0, 0, 0];
  const allEntries = [];

  for (const commit of aymanCommits) {
    const files = getCommitFiles(commit.hash);
    const classification = classifyCommit(commit, files);
    aymanVersion = bumpVersion(aymanVersion, classification);
    allEntries.push({ commit, classification, version: [...aymanVersion] });
  }

  for (const commit of raunakCommits) {
    const files = getCommitFiles(commit.hash);
    const classification = classifyCommit(commit, files);
    raunakVersion = bumpVersion(raunakVersion, classification);
    allEntries.push({ commit, classification, version: [...raunakVersion] });
  }

  // Sort newest first, using full datetime for same-day tiebreaking
  allEntries.sort((a, b) =>
    b.commit.datetime.localeCompare(a.commit.datetime)
  );

  const lines = [];

  lines.push("# Changelog");
  lines.push("");
  lines.push(`**Current version:** \`${versionString(raunakVersion)}\``);
  lines.push("");
  lines.push("---");
  lines.push("");

  for (let i = 0; i < allEntries.length; i++) {
    lines.push(formatChangelogEntry(allEntries[i], i === 0));
    lines.push("---");
    lines.push("");
  }

  lines.push("## Version Format");
  lines.push("");
  lines.push("`MAJOR.MINOR.FEATURE.PATCH`");
  lines.push("");
  lines.push("| Position | Name   | Trigger |");
  lines.push("|----------|--------|---------|");
  lines.push("| 4th      | Patch  | Typo fixes, lint, formatting, small bug fixes, docs |");
  lines.push("| 3rd      | Feature| New component, API route, page, hook, utility |");
  lines.push("| 2nd      | Minor  | Major refactor, auth system, dashboard, architecture |");
  lines.push("| 1st      | Major  | Author stream (`1` = Ayman, `2` = Raunak) |");
  lines.push("");
  lines.push("Run `npm run update-version` to regenerate this file from git history.");
  lines.push("");

  return {
    content: lines.join("\n"),
    aymanVersion: versionString(aymanVersion),
    raunakVersion: versionString(raunakVersion),
    totalCommits: commits.length,
    aymanCount: aymanCommits.length,
    raunakCount: raunakCommits.length,
  };
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

function main() {
  console.log("🔍 Scanning git history...");

  let commits;
  try {
    commits = getCommits();
  } catch (err) {
    console.error(
      "❌ Failed to read git history. Make sure you're in a git repository."
    );
    console.error(err.message);
    process.exit(1);
  }

  if (commits.length === 0) {
    console.error("❌ No commits found in git history.");
    process.exit(1);
  }

  console.log(`📊 Found ${commits.length} commits. Classifying...`);

  const result = generateChangelog(commits);

  // Ensure public/ directory exists
  if (!existsSync(PUBLIC_DIR)) {
    mkdirSync(PUBLIC_DIR, { recursive: true });
  }

  writeFileSync(CHANGELOG_PATH, result.content, "utf8");

  // Write a minimal JSON file for the version badge
  const versionJson = { version: result.raunakVersion };
  writeFileSync(VERSION_JSON_PATH, JSON.stringify(versionJson) + "\n", "utf8");

  console.log("✅ CHANGELOG.md + version.json generated successfully!");
  console.log("");
  console.log("📈 Summary:");
  console.log(`   Total commits:    ${result.totalCommits}`);
  console.log(
    `   Ayman stream:     ${result.aymanCount} commits → v${result.aymanVersion}`
  );
  console.log(
    `   Raunak stream:    ${result.raunakCount} commits → v${result.raunakVersion}`
  );
  console.log("");
  console.log(`   Output: ${CHANGELOG_PATH}`);
}

main();
