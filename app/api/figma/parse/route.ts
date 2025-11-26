import { handleFigmaParse } from "@/lib/figmaParser/handler/handleFigmaParse";
import { NextResponse } from "next/server";

// Simple in-memory rate limiter (consider using Redis in production)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 10; // 10 requests per minute

function checkRateLimit(identifier: string): { allowed: boolean; retryAfter?: number } {
  const now = Date.now();
  const userLimit = rateLimitMap.get(identifier);

  if (!userLimit || now > userLimit.resetTime) {
    // Reset or initialize
    rateLimitMap.set(identifier, {
      count: 1,
      resetTime: now + RATE_LIMIT_WINDOW,
    });
    return { allowed: true };
  }

  if (userLimit.count >= MAX_REQUESTS_PER_WINDOW) {
    const retryAfter = Math.ceil((userLimit.resetTime - now) / 1000);
    return { allowed: false, retryAfter };
  }

  userLimit.count++;
  return { allowed: true };
}

export async function POST(req: Request) {
  try {
    const { url } = await req.json().catch(() => ({}));
    
    if (!url || typeof url !== "string") {
      return NextResponse.json(
        { error: "Invalid payload. URL is required." },
        { status: 400 }
      );
    }

    // Rate limiting by IP or user
    const forwarded = req.headers.get("x-forwarded-for");
    const ip = forwarded ? forwarded.split(",")[0] : "unknown";
    
    const rateLimit = checkRateLimit(ip);
    
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { 
          error: "Too many requests. Please try again later.",
          retryAfter: rateLimit.retryAfter 
        },
        { 
          status: 429,
          headers: {
            "Retry-After": String(rateLimit.retryAfter || 60),
          }
        }
      );
    }

    return await handleFigmaParse(url);
  } catch (error) {
    console.error("[parse] Error:", error);
    
    // Check if it's a Figma API rate limit error
    if (error instanceof Error && error.message.includes("429")) {
      return NextResponse.json(
        { 
          error: "Figma API rate limit exceeded. Please wait a moment and try again.",
          code: "FIGMA_RATE_LIMIT"
        },
        { status: 429 }
      );
    }
    
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const url = searchParams.get("url");
    
    if (!url) {
      return NextResponse.json(
        { error: "Missing url parameter" },
        { status: 400 }
      );
    }

    // Rate limiting
    const forwarded = req.headers.get("x-forwarded-for");
    const ip = forwarded ? forwarded.split(",")[0] : "unknown";
    
    const rateLimit = checkRateLimit(ip);
    
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { 
          error: "Too many requests. Please try again later.",
          retryAfter: rateLimit.retryAfter 
        },
        { 
          status: 429,
          headers: {
            "Retry-After": String(rateLimit.retryAfter || 60),
          }
        }
      );
    }

    return await handleFigmaParse(url);
  } catch (error) {
    console.error("[parse] Error:", error);
    
    if (error instanceof Error && error.message.includes("429")) {
      return NextResponse.json(
        { 
          error: "Figma API rate limit exceeded. Please wait a moment and try again.",
          code: "FIGMA_RATE_LIMIT"
        },
        { status: 429 }
      );
    }
    
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}