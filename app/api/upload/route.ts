import { jsonError, jsonOk } from "@/lib/http/json-route";
import { ocrPatentPagesWithVision } from "@/lib/openai/vision-ocr";
import { renderPdfPagesToPngWithFallback } from "@/lib/pdf/render-pdf-pages-with-fallback";
import pdfParse from "pdf-parse";

export const runtime = "nodejs";

const MIN_EXTRACTED_CHARS = 500;
const MAX_PAGES_FOR_VISION = 3;

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
      const hint =
        "Install Poppler so `pdftoppm` is on PATH (macOS: brew install poppler), or use a libvips build with PDF support.";
      console.error("PDF rasterize:", fallbackErr);
      return jsonError(422, `Could not rasterize PDF. ${hint}`);
    }
    if (images.length === 0) {
      return jsonError(422, "Could not rasterize PDF pages.");
    }

    const visionText = (await ocrPatentPagesWithVision(images)).trim();
    if (!visionText) {
      return jsonError(422, "Could not extract text from PDF (vision OCR returned empty).");
    }

    return jsonOk({ text: visionText });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("Upload error:", e);
    if (msg.includes("OPENAI_API_KEY")) {
      return jsonError(503, msg);
    }
    return jsonError(500, "Error processing PDF");
  }
}
