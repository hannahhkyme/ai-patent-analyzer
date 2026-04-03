#!/usr/bin/env node
/**
 * Documentation / API drift risk detector for Next.js-style repos.
 * Intended for CI (e.g. GitHub Actions on push to main).
 *
 * Env (optional unless noted):
 *   DEVIN_API_KEY, DEVIN_SESSIONS_URL — HIGH tier Devin session POST (full sessions URL)
 *   LINEAR_API_KEY, LINEAR_TEAM_ID — MEDIUM tier Linear issue
 *   API_DOCS_PATH — path to the API docs source module (shown in Devin prompt)
 *   DOCS_PAGE_URL — full URL to the docs UI (e.g. https://app.example.com/docs)
 */

const { execSync } = require("node:child_process");
const process = require("node:process");

const MAX_BUFFER = 50 * 1024 * 1024;

function logStep(msg) {
  console.log(`[detect-drift] ${msg}`);
}

function logError(msg, err) {
  console.error(`[detect-drift] ERROR: ${msg}`);
  if (err != null) console.error(err);
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
      "HIGH risk: DEVIN_API_KEY or DEVIN_SESSIONS_URL not set — skipping Devin POST (configure secrets to enable).",
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

async function createLinearIssue(title, description) {
  const key = process.env.LINEAR_API_KEY?.trim();
  const teamId = process.env.LINEAR_TEAM_ID?.trim();
  if (!key || !teamId) {
    logStep(
      "MEDIUM risk: LINEAR_API_KEY or LINEAR_TEAM_ID not set — skipping Linear POST (configure secrets to enable).",
    );
    return "skipped";
  }
  const query = `
    mutation CreateIssue($teamId: String!, $title: String!, $description: String!, $projectId: String) {
      issueCreate(input: { teamId: $teamId, title: $title, description: $description, projectId: $projectId }) {
        success
        issue { id url }
      }
    }
  `;
  const projectId = process.env.LINEAR_PROJECT_ID?.trim();
  const res = await fetch("https://api.linear.app/graphql", {
    method: "POST",
    headers: {
      Authorization: key,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query,
      variables: {
        teamId,
        title,
        description,
        projectId: projectId || null,
      },
    }),
  });
  const text = await res.text();
  if (!res.ok) {
    logError(`Linear API HTTP ${res.status}`, text.slice(0, 2000));
    return false;
  }
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch (e) {
    logError("Linear response not JSON", text.slice(0, 2000));
    return false;
  }
  if (parsed.errors?.length) {
    logError("Linear GraphQL errors", JSON.stringify(parsed.errors, null, 2));
    return false;
  }
  logStep(`Linear issue created. Raw: ${text.slice(0, 500)}`);
  return true;
}

function buildDevinPrompt(files, diff) {
  const docsUrl = process.env.DOCS_PAGE_URL?.trim() || "(set DOCS_PAGE_URL to your deployed /docs URL)";
  const apiDocsPath =
    process.env.API_DOCS_PATH?.trim() ||
    "(set API_DOCS_PATH to your API docs source file, e.g. the module that feeds /docs)";

  return `You are helping fix documentation drift in a Next.js app.

Changed files (paths only):
${files.map((f) => `- ${f}`).join("\n")}

Full git diff (HEAD~1 vs HEAD):
\`\`\`diff
${diff}
\`\`\`

Tasks:
1. Open ${docsUrl} in a browser and capture a screenshot of the current docs UI.
2. Update the API documentation source at: ${apiDocsPath} so it matches the actual route handlers and response/request shapes implied by the diff.
3. Open a pull request with the doc updates (and any minimal supporting changes).
4. Create a Linear ticket summarizing what drift was found and what you changed.

Use the diff as the source of truth for what changed; do not assume undocumented behavior.`;
}

async function main() {
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

  const high = highRiskFromDiffAndFiles(files, diff);
  const medium = mediumRiskFromFiles(files, diff);

  if (high) {
    logStep("Decision: HIGH — API/docs-relevant drift risk; Devin session path.");
    const prompt = buildDevinPrompt(files, diff);
    const result = await postDevinSession(prompt);
    if (result === "skipped") process.exit(0);
    process.exit(result ? 0 : 1);
  }

  if (medium) {
    logStep("Decision: MEDIUM — lib/types/features drift risk; Linear ticket path.");
    const title = "[detect-drift] Possible documentation / contract drift (medium)";
    const description = [
      "Automated drift heuristics flagged this merge as medium risk.",
      "",
      "**Changed files:**",
      ...files.map((f) => `- \`${f}\``),
      "",
      "**Diff (truncated to 12000 chars):**",
      "```diff",
      diff.slice(0, 12000),
      diff.length > 12000 ? "\n... (truncated)\n" : "",
      "```",
    ].join("\n");
    const result = await createLinearIssue(title, description);
    if (result === "skipped") process.exit(0);
    process.exit(result ? 0 : 1);
  }

  logStep("LOW/NONE: no high/medium heuristics matched — no drift risk.");
  process.exit(0);
}

main().catch((e) => {
  logError("Unhandled error", e);
  process.exit(1);
});
