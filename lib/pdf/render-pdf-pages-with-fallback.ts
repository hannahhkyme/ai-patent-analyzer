import { renderPdfPagesWithPdftoppm } from "./render-pdf-pages-pdftoppm";
import { renderPdfPagesToPng } from "./render-pdf-pages";

function isSharpPdfUnsupported(err: unknown): boolean {
  if (!(err instanceof Error)) return false;
  return /unsupported image format|pdf|PDF|load_buffer/i.test(err.message);
}

/**
 * Prefer sharp (libvips + Poppler). If this Node build cannot read PDFs, fall back to `pdftoppm`.
 */
export async function renderPdfPagesToPngWithFallback(
  buffer: Buffer,
  maxPages: number,
): Promise<Buffer[]> {
  try {
    return await renderPdfPagesToPng(buffer, maxPages);
  } catch (e) {
    if (!isSharpPdfUnsupported(e)) throw e;
    return renderPdfPagesWithPdftoppm(buffer, maxPages);
  }
}
