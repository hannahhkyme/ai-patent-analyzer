import { execFile } from "node:child_process";
import * as fs from "node:fs/promises";
import * as os from "node:os";
import * as path from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

const PDFTOPPM_DPI = "200";

/**
 * Rasterize PDF pages using Poppler's `pdftoppm` (install: `brew install poppler` on macOS).
 * Used when sharp/libvips has no PDF support.
 */
export async function renderPdfPagesWithPdftoppm(
  buffer: Buffer,
  maxPages: number,
): Promise<Buffer[]> {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "patent-pdf-"));
  const pdfPath = path.join(dir, "input.pdf");
  const outPrefix = path.join(dir, "page");

  try {
    await fs.writeFile(pdfPath, buffer);
    await execFileAsync("pdftoppm", [
      "-png",
      "-r",
      PDFTOPPM_DPI,
      "-f",
      "1",
      "-l",
      String(Math.max(1, maxPages)),
      pdfPath,
      outPrefix,
    ]);

    const names = (await fs.readdir(dir))
      .filter((f) => f.startsWith("page-") && f.endsWith(".png"))
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

    const outputs: Buffer[] = [];
    for (const name of names.slice(0, maxPages)) {
      outputs.push(await fs.readFile(path.join(dir, name)));
    }
    return outputs;
  } finally {
    await fs.rm(dir, { recursive: true, force: true });
  }
}
