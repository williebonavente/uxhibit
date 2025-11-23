import { NextResponse } from "next/server";
import { verifyCaptcha } from "@/lib/captcha/verify-captcha";

export async function POST(req: Request) {
  try {
    const { token } = await req.json();
    const ok = await verifyCaptcha(token);
    return NextResponse.json({ success: ok });
  } catch {
    return NextResponse.json({ success: false }, { status: 400 });
  }
}