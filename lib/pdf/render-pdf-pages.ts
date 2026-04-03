import sharp from "sharp";

/** DPI for vector PDF rasterization (libvips + Poppler). */
export const PDF_RENDER_DENSITY = 200;

/** Cap width to keep vision payloads reasonable. */
export const PDF_MAX_WIDTH_PX = 2000;

/**
 * Rasterize the first `maxPages` of a PDF to PNG buffers.
 * Requires a libvips build with PDF/Poppler support (typical on macOS/Linux dev; verify in Docker).
 */
export async function renderPdfPagesToPng(
  buffer: Buffer,
  maxPages: number,
): Promise<Buffer[]> {
  const meta = await sharp(buffer, { density: PDF_RENDER_DENSITY }).metadata();
  const totalPages = meta.pages ?? 1;
  const count = Math.min(Math.max(1, maxPages), totalPages);
  const outputs: Buffer[] = [];

  for (let page = 0; page < count; page++) {
    const png = await sharp(buffer, { density: PDF_RENDER_DENSITY, page })
      .resize({ width: PDF_MAX_WIDTH_PX, withoutEnlargement: true })
      .png({ compressionLevel: 6 })
      .toBuffer();
    outputs.push(png);
  }

  return outputs;
}
