import { OPENAI_MODEL } from "../invention/constants";
import { getOpenAIClient } from "./client";

const MAX_IMAGE_BYTES = 1_500_000;

function toBase64Png(data: Buffer) {
  return `data:image/png;base64,${data.toString("base64")}`;
}

export async function ocrPatentPagesWithVision(images: Buffer[]): Promise<string> {
  const client = getOpenAIClient();
  if (!client) {
    throw new Error("OPENAI_API_KEY is required to OCR scanned PDFs");
  }

  const content: Array<
    | { type: "text"; text: string }
    | { type: "image_url"; image_url: { url: string } }
  > = [
    {
      type: "text",
      text:
        "Extract all readable text from these patent PDF page images. Return plain text only (no markdown). Preserve paragraph breaks where obvious.",
    },
  ];

  for (const img of images) {
    if (img.byteLength > MAX_IMAGE_BYTES) continue;
    content.push({ type: "image_url", image_url: { url: toBase64Png(img) } });
  }

  const completion = await client.chat.completions.create({
    model: OPENAI_MODEL,
    messages: [{ role: "user", content }],
  });

  return completion.choices[0]?.message?.content?.trim() ?? "";
}
