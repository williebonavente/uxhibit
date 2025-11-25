import { handleFigmaParse } from "@/lib/figmaParser/handler/handleFigmaParse";
import { NextResponse } from "next/server";

const ipRequests = new Map<string, { count: number; reset: number }>();
const WINDOW_MS = 15_000;
const MAX_REQ = 8;

function rateGuard(req: Request): NextResponse | null {
  const ip = req.headers.get("x-forwarded-for") || "local";
  const now = Date.now();
  const slot = ipRequests.get(ip);
  if (!slot || slot.reset < now) {
    ipRequests.set(ip, { count: 1, reset: now + WINDOW_MS });
    return null;
  }
  slot.count++;
  if (slot.count > MAX_REQ) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }
  return null;
}

export async function POST(req: Request) {
  const guard = rateGuard(req);
  if (guard) return guard;
  const { url } = await req.json().catch(() => ({}));
  if (!url || typeof url !== "string") return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  return handleFigmaParse(url);
}

export async function GET(req: Request) {
  const guard = rateGuard(req);
  if (guard) return guard;
  const { searchParams } = new URL(req.url);
  const url = searchParams.get("url");
  if (!url) return NextResponse.json({ error: "Missing url param" }, { status: 400 });
  return handleFigmaParse(url);
}