import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// In-memory rate limiter — resets on restart, fine for single-instance / dev.
// Replace with Upstash Redis for multi-instance production deployments.
const WINDOW_MS = 60_000; // 1 minute
const MAX_REQUESTS: Record<string, number> = {
  "/api/upload": 10,
  default: 60,
};

type BucketEntry = { count: number; windowStart: number };
const buckets = new Map<string, BucketEntry>();

function isRateLimited(ip: string, pathname: string): boolean {
  const limit =
    MAX_REQUESTS[pathname as keyof typeof MAX_REQUESTS] ?? MAX_REQUESTS.default;
  const key = `${ip}:${pathname}`;
  const now = Date.now();
  const entry = buckets.get(key);

  if (!entry || now - entry.windowStart > WINDOW_MS) {
    buckets.set(key, { count: 1, windowStart: now });
    return false;
  }

  entry.count += 1;
  return entry.count > limit;
}

const SECURITY_HEADERS: Record<string, string> = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Referrer-Policy": "strict-origin-when-cross-origin",
};

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/api/")) {
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      "unknown";

    if (isRateLimited(ip, pathname)) {
      return new NextResponse(JSON.stringify({ message: "Too many requests" }), {
        status: 429,
        headers: { "Content-Type": "application/json" },
      });
    }
  }

  const response = NextResponse.next();
  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    response.headers.set(key, value);
  }
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
