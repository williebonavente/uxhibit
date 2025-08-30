import { NextResponse } from "next/server";
import { Mistral } from "@mistralai/mistralai";

export const runtime = "nodejs";

const MISTRAL_API_KEY = process.env.MISTRAL_API_KEY;

export async function POST(req: Request) {
  try {
    if (!MISTRAL_API_KEY) {
      return NextResponse.json({ error: "Missing MISTRAL_API_KEY" }, { status: 500 });
    }
    const { prompt, model = "mistral-tiny" } = await req.json();
    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json({ error: "Invalid prompt" }, { status: 400 });
    }

    const client = new Mistral({ apiKey: MISTRAL_API_KEY });
    const resp = await client.chat.complete({
      model,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
    });

    const output = resp?.choices?.[0]?.message?.content ?? "";
    return NextResponse.json({ output });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Server error" }, { status: 500 });
  }
}