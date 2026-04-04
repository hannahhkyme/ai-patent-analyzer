#!/usr/bin/env node
/**
 * After filtering trivial diffs, always opens a Devin session to review and update API docs.
 * Intended for CI (e.g. GitHub Actions on push to main).
 *
 * Env:
 *   DEVIN_API_KEY, DEVIN_SESSIONS_URL — POST body { prompt } (full sessions URL)
 *   API_DOCS_PATH — path to the API docs catalog module (shown in Devin prompt)
 *   DOCS_PAGE_URL — full URL to the deployed docs UI (e.g. https://app.example.com/docs)
 *
 * Local runs: if `.env` exists in the current working directory, KEY=value lines are loaded
 * into process.env (only for keys not already set). Node does not load `.env` by default.
 * CI should inject env vars via the workflow.
 */

const { execSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");
const process = require("node:process");

const MAX_BUFFER = 50 * 1024 * 1024;

function logStep(msg) {
  console.log(`[detect-drift] ${msg}`);
}

function logError(msg, err) {
  console.error(`[detect-drift] ERROR: ${msg}`);
  if (err != null) console.error(err);
}

/** Minimal .env loader (no dependency); does not override existing process.env. */
function loadDotEnvFromCwd() {
  try {
    const dotenvPath = path.join(process.cwd(), ".env");
    if (!fs.existsSync(dotenvPath)) return;
    const text = fs.readFileSync(dotenvPath, "utf8");
    for (const line of text.split(/\n/)) {
      const t = line.trim();
      if (!t || t.startsWith("#")) continue;
      const eq = t.indexOf("=");
      if (eq < 1) continue;
      const key = t.slice(0, eq).trim();
      if (!key || process.env[key] !== undefined) continue;
      let val = t.slice(eq + 1).trim();
      if (
        (val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))
      ) {
        val = val.slice(1, -1);
      }
      process.env[key] = val;
    }
  } catch (e) {
    logError("Could not read .env (optional)", e);
  }
}

function execGit(args, label) {
  try {
    return execSync(`git ${args}`, {
      encoding: "utf8",
      maxBuffer: MAX_BUFFER,
      stdio: ["pipe", "pipe", "pipe"],
    });
  } catch (e) {
    logError(`git ${label} failed`, e.stderr?.toString?.() || e.message || e);
    return null;
  }
}

function hasParentCommit() {
  const out = execGit("rev-parse --verify HEAD~1", "rev-parse HEAD~1");
  return out != null && out.trim().length > 0;
}

function getChangedFiles() {
  const out = execGit("diff --name-only HEAD~1 HEAD", "name-only");
  if (out == null) return null;
  return out
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
}

function getDiff() {
  return execGit("diff HEAD~1 HEAD", "diff");
}

/** Next-style API route trees (no app-specific segment names). */
function isApiRoutePath(filePath) {
  if (!filePath || typeof filePath !== "string") return false;
  const n = filePath.replace(/\\/g, "/");
  return (
    /(?:^|\/)app\/api\//.test(n) ||
    /(?:^|\/)src\/app\/api\//.test(n) ||
    /(?:^|\/)pages\/api\//.test(n) ||
    /(?:^|\/)src\/pages\/api\//.test(n)
  );
}

function isRouteHandlerFile(filePath) {
  const n = filePath.replace(/\\/g, "/");
  return /\/route\.(mjs|cjs|js|ts|tsx|jsx)$/.test(n);
}

function isUnderLib(filePath) {
  const n = filePath.replace(/\\/g, "/");
  return /(?:^|\/)lib\//.test(n) || /(?:^|\/)src\/lib\//.test(n);
}

function isUnderTypes(filePath) {
  const n = filePath.replace(/\\/g, "/");
  return /(?:^|\/)types\//.test(n) || /(?:^|\/)src\/types\//.test(n);
}

function isFeaturesComponentPath(filePath) {
  const n = filePath.replace(/\\/g, "/");
  return /(?:^|\/)components\/features\//.test(n) || /(?:^|\/)src\/components\/features\//.test(n);
}

function isNewFileInDiffChunk(chunkBody) {
  return /^new file mode/m.test(chunkBody);
}

function isTestPath(filePath) {
  const n = filePath.replace(/\\/g, "/");
  return (
    /\.(test|spec)\.(mjs|cjs|js|ts|tsx|jsx)$/.test(n) ||
    /\/__tests__\//.test(n)
  );
}

function isStylePath(filePath) {
  return /\.(css|scss|sass|less)$/.test(filePath.replace(/\\/g, "/"));
}

function diffBodyLines(diff) {
  if (!diff) return [];
  return diff.split("\n").filter((line) => {
    if (!line.startsWith("+") && !line.startsWith("-")) return false;
    if (line.startsWith("+++") || line.startsWith("---")) return false;
    return true;
  });
}

function isCommentOrWhitespaceOnlyLine(line) {
  const body = line.slice(1);
  const t = body.trim();
  if (t === "") return true;
  if (/^\/\//.test(t)) return true;
  if (/^\/\*/.test(t)) return true;
  if (/^\*/.test(t)) return true;
  return false;
}

function onlyTestsChanged(files) {
  return files.length > 0 && files.every(isTestPath);
}

function onlyStyleChanged(files) {
  return files.length > 0 && files.every(isStylePath);
}

function onlyCommentsOrWhitespaceDiff(diff) {
  const lines = diffBodyLines(diff);
  if (lines.length === 0) return true;
  return lines.every(isCommentOrWhitespaceOnlyLine);
}

/**
 * Heuristic: response shape / JSON payload keys (added or removed in diff).
 */
function diffSuggestsResponseFieldChange(diff) {
  const lines = diffBodyLines(diff);
  for (const line of lines) {
    const rest = line.slice(1).trim();
    if (!/^["']?[a-zA-Z_$][\w$]*["']?\s*:/.test(rest)) continue;
    if (/\b(Response|NextResponse)\.json\s*\(/.test(rest)) return true;
    if (/^\{/.test(rest) || /\}\s*$/.test(rest)) return true;
    if (/\breturn\s+/.test(rest) && /:/.test(rest)) return true;
  }
  return false;
}

function diffTouchesResponseJson(diff) {
  return /Response\.json|NextResponse\.json/.test(diff);
}

function diffTouchesRequestInputs(diff) {
  return (
    /\bsearchParams\b/.test(diff) ||
    /\brequest\.json\s*\(/.test(diff) ||
    /\breq\.(query|body)\b/.test(diff) ||
    /\bformData\s*\(/.test(diff) ||
    /\bcookies\s*\(/.test(diff) ||
    /\bheaders\s*\(/.test(diff) ||
    /\bparams\b/.test(diff)
  );
}

function diffShowsNewOrDeletedRouteFile(diff) {
  return /^new file mode/m.test(diff) || /^deleted file mode/m.test(diff);
}

function parseDiffGitPaths(diff) {
  const paths = [];
  const re = /^diff --git a\/(.+?) b\/(.+?)$/gm;
  let m;
  while ((m = re.exec(diff)) !== null) {
    paths.push(m[2]);
  }
  return paths;
}

/** Split a unified diff into { path, body } per file (b/ path). */
function splitDiffByFile(diff) {
  if (!diff) return [];
  const parts = diff.split(/^diff --git /m);
  const out = [];
  for (const part of parts) {
    if (!part.trim()) continue;
    const firstLine = part.split("\n")[0];
    const m = /^a\/(.+?) b\/(.+?)$/.exec(firstLine);
    if (!m) continue;
    const path = m[2].trim();
    out.push({ path, body: `diff --git ${part}` });
  }
  return out;
}

function highRiskFromDiffAndFiles(files, diff) {
  if (!diff) return false;
  const pathsInDiff = parseDiffGitPaths(diff);
  const apiTouched = files.some(isApiRoutePath) || pathsInDiff.some(isApiRoutePath);
  if (apiTouched) return true;

  if (diffTouchesResponseJson(diff)) return true;

  const chunks = splitDiffByFile(diff);
  for (const { path, body } of chunks) {
    if (!isApiRoutePath(path)) continue;
    if (diffSuggestsResponseFieldChange(body)) return true;
    if (diffTouchesRequestInputs(body)) return true;
  }

  if (diffShowsNewOrDeletedRouteFile(diff)) {
    const combined = [...files, ...pathsInDiff];
    if (combined.some((p) => isApiRoutePath(p) && isRouteHandlerFile(p))) return true;
  }
  return false;
}

function mediumRiskFromFiles(files, diff) {
  const chunks = diff ? splitDiffByFile(diff) : [];
  const newFeatureComponent = files.some((f) => {
    if (!isFeaturesComponentPath(f) || !/\.(tsx|jsx)$/.test(f)) return false;
    const norm = f.replace(/\\/g, "/");
    const chunk = chunks.find((c) => c.path.replace(/\\/g, "/") === norm);
    return chunk ? isNewFileInDiffChunk(chunk.body) : false;
  });
  return files.some(isUnderLib) || files.some(isUnderTypes) || newFeatureComponent;
}

async function postDevinSession(prompt) {
  const key = process.env.DEVIN_API_KEY?.trim();
  const url = process.env.DEVIN_SESSIONS_URL?.trim();
  if (!key || !url) {
    logStep(
      "DEVIN_API_KEY or DEVIN_SESSIONS_URL not set — skipping Devin POST. For local runs ensure .env is in the repo root (script loads it) or export both vars. In CI, add repository secrets.",
    );
    return "skipped";
  }
  const body = { prompt };
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  if (!res.ok) {
    logError(`Devin API HTTP ${res.status}`, text.slice(0, 2000));
    return false;
  }
  logStep(`Devin session created OK (${res.status}). Response snippet: ${text.slice(0, 400)}`);
  return true;
}

function buildRiskHeuristicSummary(files, diff) {
  const high = highRiskFromDiffAndFiles(files, diff);
  const medium = mediumRiskFromFiles(files, diff);
  if (high && medium) {
    return "Heuristic: strong API/route contract signals plus shared lib/types/features changes — prioritize route handlers and exported JSON shapes.";
  }
  if (high) {
    return "Heuristic: likely API route or HTTP contract change — align docs with handlers and request/response fields.";
  }
  if (medium) {
    return "Heuristic: shared lib, types, or new feature components — confirm whether public HTTP docs or /docs UI copy need updates.";
  }
  return "Heuristic: no strong route/API signal — still verify the deployed docs match any user-visible or HTTP contract impact.";
}

function buildDevinPrompt(files, diff, riskSummary) {
  const docsUrl = process.env.DOCS_PAGE_URL?.trim() || "(set DOCS_PAGE_URL to your deployed /docs URL)";
  const apiDocsPath =
    process.env.API_DOCS_PATH?.trim() ||
    "(set API_DOCS_PATH to your API docs source file, e.g. the module that feeds /docs)";

  return `You must review and update API documentation for this Next.js merge. This is mandatory for every run: do not skip verification.

Context:
${riskSummary}

Changed files (paths only):
${files.map((f) => `- ${f}`).join("\n")}

Full git diff (HEAD~1 vs HEAD):
\`\`\`diff
${diff}
\`\`\`

Required tasks:
1. Open ${docsUrl} in a browser, confirm what the live /docs (or equivalent) UI shows, and capture a screenshot for the record.
2. Compare that UI to the actual App Router (or Pages) API route implementations affected by the diff. Update the API documentation source file at ${apiDocsPath} so paths, HTTP methods, request fields, and response fields match the code.
3. If the docs page component (e.g. the route that renders /docs) needs copy or layout changes for accuracy, update it as well.
4. Open a pull request with all doc-related fixes and minimal supporting code changes only where required for accuracy.
5. If your workflow uses issue tracking, create a ticket summarizing what was out of date and what you changed.

Use the diff as the source of truth; do not invent endpoints or fields that are not implied by the repository.

If everything already matches, still document that in the PR description and show the screenshot proves parity.`;
}

async function main() {
  loadDotEnvFromCwd();
  logStep("Starting drift risk analysis (HEAD~1..HEAD)");

  if (!hasParentCommit()) {
    logStep("No parent commit (HEAD~1); nothing to diff. Exiting.");
    process.exit(0);
  }

  const files = getChangedFiles();
  const diff = getDiff();

  if (files == null || diff == null) {
    logError("Could not read git diff or file list; aborting.");
    process.exit(1);
  }

  logStep(`Changed files (${files.length}): ${files.join(", ") || "(none)"}`);

  if (files.length === 0) {
    logStep("No changed files; no drift risk.");
    process.exit(0);
  }

  if (onlyTestsChanged(files)) {
    logStep("LOW/NONE: only test files changed — no drift risk.");
    process.exit(0);
  }

  if (onlyStyleChanged(files)) {
    logStep("LOW/NONE: only style files changed — no drift risk.");
    process.exit(0);
  }

  if (onlyCommentsOrWhitespaceDiff(diff)) {
    logStep("LOW/NONE: diff is only comments and/or whitespace — no drift risk.");
    process.exit(0);
  }

  const riskSummary = buildRiskHeuristicSummary(files, diff);
  logStep(`Decision: Devin — docs review/update required for this merge. ${riskSummary}`);

  const prompt = buildDevinPrompt(files, diff, riskSummary);
  const result = await postDevinSession(prompt);
  if (result === "skipped") process.exit(0);
  process.exit(result ? 0 : 1);
}

main().catch((e) => {
  logError("Unhandled error", e);
  process.exit(1);
});
