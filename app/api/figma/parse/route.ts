import { handleFigmaParse } from "@/lib/figmaParser/handler/handleFigmaParse";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { url } = await req.json().catch(() => ({}));
  if (!url || typeof url !== "string") return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  return handleFigmaParse(url);
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const url = searchParams.get("url");
  if (!url) return NextResponse.json({ error: "Missing url param" }, { status: 400 });
  return handleFigmaParse(url);
}