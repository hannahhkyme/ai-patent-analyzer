import { jsonError, jsonOk } from "@/lib/http/json-route";
import { ocrPatentPagesWithVision } from "@/lib/openai/vision-ocr";
import { renderPdfPagesToPngWithFallback } from "@/lib/pdf/render-pdf-pages-with-fallback";
import pdfParse from "pdf-parse";

export const runtime = "nodejs";

const MIN_EXTRACTED_CHARS = 500;
const MAX_PAGES_FOR_VISION = 3;

const UNREADABLE_PDF_MESSAGE =
  "This PDF could not be read (it may be corrupted, encrypted, or non-standard). Re-export from the original app or try another file.";

function pdfErrorStrings(e: unknown, depth = 0): string[] {
  if (depth > 4 || e == null) return [];
  const parts: string[] = [];
  if (e instanceof Error) parts.push(e.message);
  if (typeof e === "object") {
    const o = e as Record<string, unknown>;
    if (typeof o.details === "string") parts.push(o.details);
    if (typeof o.message === "string" && !(e instanceof Error)) parts.push(String(o.message));
    if (o.cause !== undefined) parts.push(...pdfErrorStrings(o.cause, depth + 1));
  }
  return parts;
}

function isUnreadablePdfError(e: unknown): boolean {
  const s = pdfErrorStrings(e).join(" ").toLowerCase();
  return (
    s.includes("bad xref") ||
    s.includes("formaterror") ||
    s.includes("invalid pdf") ||
    s.includes("malformed") ||
    s.includes("password")
  );
}

function rasterizeFailureMessage(): string {
  if (process.env.VERCEL === "1") {
    return "This host can't process scanned PDFs; try a text-based PDF or paste text";
  }
  return (
    "Could not rasterize PDF. Install Poppler so `pdftoppm` is on PATH (macOS: brew install poppler), " +
    "or use a libvips build with PDF support."
  );
}

export async function POST(request: Request) {
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return jsonError(400, "Expected multipart form data");
  }

  const file = formData.get("file");
  if (!file || !(file instanceof Blob)) {
    return jsonError(400, "No file uploaded");
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const data = await pdfParse(buffer);
    const extracted = (data.text ?? "").trim();
    if (extracted.length >= MIN_EXTRACTED_CHARS) {
      return jsonOk({ text: extracted });
    }

    let images: Buffer[];
    try {
      images = await renderPdfPagesToPngWithFallback(buffer, MAX_PAGES_FOR_VISION);
    } catch (fallbackErr) {
      if (isUnreadablePdfError(fallbackErr)) {
        console.warn("Upload: unreadable PDF during rasterize:", pdfErrorStrings(fallbackErr).join(" | "));
        return jsonError(422, UNREADABLE_PDF_MESSAGE);
      }
      console.error("PDF rasterize:", fallbackErr);
      return jsonError(422, rasterizeFailureMessage());
    }
    if (images.length === 0) {
      return jsonError(422, rasterizeFailureMessage());
    }

    const visionText = (await ocrPatentPagesWithVision(images)).trim();
    if (!visionText) {
      return jsonError(422, "Could not extract text from PDF (vision OCR returned empty).");
    }

    return jsonOk({ text: visionText });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (isUnreadablePdfError(e)) {
      console.warn("Upload: unreadable PDF:", pdfErrorStrings(e).join(" | "));
      return jsonError(422, UNREADABLE_PDF_MESSAGE);
    }
    console.error("Upload error:", e);
    if (msg.includes("OPENAI_API_KEY")) {
      return jsonError(503, msg);
    }
    return jsonError(500, "Error processing PDF");
  }
}
