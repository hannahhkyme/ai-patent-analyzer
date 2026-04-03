import { NextResponse } from "next/server";

export async function parseJsonBody(request: Request): Promise<unknown> {
  try {
    return await request.json() as unknown;
  } catch {
    return null;
  }
}

export function jsonError(status: number, message: string) {
  return NextResponse.json({ message }, { status });
}

export function jsonOk<T>(data: T, status = 200) {
  return NextResponse.json(data, { status });
}
