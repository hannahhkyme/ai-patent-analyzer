/**
 * Verifies lib/api-reference.ts matches App Router route handlers.
 * Run: npx tsx scripts/verify-api-docs.ts
 * Optional: LINEAR_API_KEY + LINEAR_TEAM_ID to open a ticket on failure (--linear).
 */
import * as fs from "node:fs";
import * as path from "node:path";
import { API_ENDPOINTS } from "../lib/api-reference";

const ROOT = path.join(__dirname, "..");
const API_ROOT = path.join(ROOT, "app", "api");

const METHOD_REGEX =
  /export\s+async\s+function\s+(GET|POST|PUT|PATCH|DELETE)\s*\(/g;

function specPathToDir(specPath: string): string {
  const withoutPrefix = specPath.replace(/^\/api\//, "");
  return path.join(API_ROOT, ...withoutPrefix.split("/"));
}

function readExportedMethods(routeFile: string): Set<string> {
  const src = fs.readFileSync(routeFile, "utf8");
  const methods = new Set<string>();
  let m: RegExpExecArray | null;
  const re = new RegExp(METHOD_REGEX.source, "g");
  while ((m = re.exec(src)) !== null) {
    methods.add(m[1] ?? "");
  }
  return methods;
}

function verify(): string[] {
  const errors: string[] = [];
  for (const spec of API_ENDPOINTS) {
    const dir = specPathToDir(spec.path);
    const routeFile = path.join(dir, "route.ts");
    if (!fs.existsSync(routeFile)) {
      errors.push(`Missing route file for ${spec.method} ${spec.path}: expected ${routeFile}`);
      continue;
    }
    const exported = readExportedMethods(routeFile);
    if (!exported.has(spec.method)) {
      errors.push(
        `${spec.path}: expected exported ${spec.method} in route.ts, found: ${[...exported].join(", ") || "none"}`,
      );
    }
  }

  if (fs.existsSync(API_ROOT)) {
    const walk = (dir: string): string[] => {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      const routes: string[] = [];
      for (const e of entries) {
        const full = path.join(dir, e.name);
        if (e.isDirectory()) routes.push(...walk(full));
        else if (e.name === "route.ts") routes.push(full);
      }
      return routes;
    };
    const onDisk = walk(API_ROOT);
    for (const file of onDisk) {
      const rel = path.relative(API_ROOT, file);
      const segments = rel.split(path.sep).slice(0, -1);
      const expectedPath = `/api/${segments.join("/")}`;
      const documented = API_ENDPOINTS.some((s) => {
        const normalized = s.path.replace(/\[([^\]]+)\]/g, "[$1]");
        return normalized === expectedPath;
      });
      if (!documented) {
        errors.push(`Undocumented route handler: ${expectedPath} (${file})`);
      }
    }
  }

  return errors;
}

async function createLinearIssue(title: string, description: string): Promise<void> {
  const key = process.env.LINEAR_API_KEY;
  const teamId = process.env.LINEAR_TEAM_ID;
  if (!key || !teamId) return;

  const query = `
    mutation CreateIssue($teamId: String!, $title: String!, $description: String!, $projectId: String) {
      issueCreate(input: { teamId: $teamId, title: $title, description: $description, projectId: $projectId }) {
        success
        issue { id url }
      }
    }
  `;
  const projectId = process.env.LINEAR_PROJECT_ID;
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
  if (!res.ok) {
    console.error("Linear API HTTP error:", res.status, await res.text());
  }
}

async function main() {
  const errors = verify();
  if (errors.length === 0) {
    console.log("API docs match route handlers.");
    process.exit(0);
  }
  const body = errors.join("\n");
  console.error("API doc / route drift:\n", body);
  if (process.argv.includes("--linear")) {
    await createLinearIssue(
      "[CI] API reference drift vs App Router",
      "```\n" + body + "\n```",
    );
  }
  process.exit(1);
}

void main();
