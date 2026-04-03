/**
 * Smoke-test USPTO similar-patent search (same logic as analyze).
 *
 * Usage:
 *   npm run test:uspto -- "artificial intelligence"
 *   npm run test:uspto -- "applicationMetaData.applicationTypeLabelName:Utility"
 *
 * Loads `.env` from the project root if present. Requires USPTO_API_KEY.
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

function loadDotEnv() {
  const envPath = resolve(process.cwd(), ".env");
  if (!existsSync(envPath)) return;
  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (process.env[key] === undefined) process.env[key] = val;
  }
}

loadDotEnv();

async function main() {
  const { searchSimilarPatents } = await import("../lib/uspto/patent-search");
  const query =
    process.argv.slice(2).join(" ").trim() ||
    "applicationMetaData.applicationTypeLabelName:Utility";

  console.log("Query:", query);
  const results = await searchSimilarPatents(query);
  console.log(JSON.stringify(results, null, 2));
}

void main().catch((e) => {
  console.error(e);
  process.exit(1);
});
