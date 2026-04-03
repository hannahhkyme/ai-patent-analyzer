# Provisional Patent Filing Assistant

Next.js App Router app that helps first-time inventors work through a provisional disclosure: guided follow-ups (OpenAI **gpt-4o** when configured), analysis with **USPTO** similar-patent hints (required in production), and a draft scaffold.

## Routes

| Path   | Purpose                                      |
|--------|----------------------------------------------|
| `/`    | Landing + orientation tabs                   |
| `/app` | AI filing assistant (chat-style flow)        |
| `/docs`| API reference (data-driven from `lib/api-reference.ts`) |

## Scripts

```bash
npm run dev          # local dev
npm run build
npm run verify:api   # ensure api-reference matches app/api/**/route.ts
```

Use `npm run verify:api -- --linear` in CI with `LINEAR_API_KEY` and `LINEAR_TEAM_ID` to open a Linear issue when verification fails.

## Environment

Validated in `lib/env.ts`. **Production** enforces `OPENAI_API_KEY` and `USPTO_API_KEY` at startup (via `instrumentation.ts`).

| Variable | Required | Notes |
|----------|----------|--------|
| `OPENAI_API_KEY` | Production | Enforced at startup. AI follow-ups, draft, PDF vision OCR. |
| `USPTO_API_KEY` | Production | Enforced at startup. Live similar-patent search (`POST /api/v1/patent/applications/search`). |
| `USPTO_API_BASE_URL` | No | Defaults to `https://api.uspto.gov` |
| `LINEAR_API_KEY` | No | Doc-drift tickets (`verify:api --linear`) |
| `LINEAR_TEAM_ID` | No | With Linear key |
| `LINEAR_PROJECT_ID` | No | Optional |

## PDF upload (scanned / image PDFs)

`/api/upload` tries **text extraction** first (`pdf-parse`). If the PDF has little or no embedded text, it **rasterizes the first 3 pages** and sends PNGs to OpenAI vision for OCR (`OPENAI_API_KEY` required for that path).

Rasterization uses **sharp** when your libvips build supports PDF. If sharp cannot read PDFs (common on some installs), the server falls back to Poppler’s **`pdftoppm`** — install Poppler so it is on `PATH` (macOS: `brew install poppler`).

**Vercel:** Serverless does not ship Poppler or a PDF-capable libvips for this path. Scanned or image-only PDFs return a clear `422` asking for a text-based PDF or pasted text instead of a `brew` hint.

## Sessions

Invention sessions are stored **in memory** (`lib/invention/session-store.ts`). That is fine for local demo and single-node deploys; **multiple serverless instances will not share sessions**. For production scale, implement a shared store (see `lib/invention/redis-session-store.stub.ts`).

## API catalog

The HTTP contract is defined once in `lib/api-reference.ts` and rendered on `/docs`. Route handlers live under `app/api/`.
