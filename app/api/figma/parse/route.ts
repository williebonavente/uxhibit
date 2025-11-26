import { handleFigmaParse } from "@/lib/figmaParser/handler/handleFigmaParse";
import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

// Cache parsed results (5 minutes)
const CACHE_DURATION = 5 * 60 * 1000;
const parseCache = new Map<string, { data: any; timestamp: number }>();

// Simple in-memory rate limiter
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 30;

function checkRateLimit(identifier: string): {
  allowed: boolean;
  retryAfter?: number;
} {
  const now = Date.now();
  const userLimit = rateLimitMap.get(identifier);

  if (!userLimit || now > userLimit.resetTime) {
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

function getCacheKey(url: string, userId?: string): string {
  // Include userId in cache key to separate cache per user
  const normalizedUrl = url.trim().toLowerCase();
  return userId ? `${userId}-${normalizedUrl}` : normalizedUrl;
}

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    let userAccessToken: string | undefined;

    if (user) {
      const { data: details } = await supabase
        .from("profile_details")
        .select("figma_access_token")
        .eq("profile_id", user.id)
        .single();
      userAccessToken = details?.figma_access_token;
    }

    const { url, force } = await req.json().catch(() => ({}));
    if (!url || typeof url !== "string") {
      return NextResponse.json({ error: "Invalid payload. URL is required." }, { status: 400 });
    }

    const cacheKey = getCacheKey(url, user?.id);
    const cached = !force ? parseCache.get(cacheKey) : undefined;
    if (!force && cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return NextResponse.json({
        ...cached.data,
        cached: true,
        cacheAge: Math.floor((Date.now() - cached.timestamp) / 1000),
      });
    }

    const identifier = user?.id || req.headers.get("x-forwarded-for")?.split(",")[0] || "unknown";
    const rateLimit = checkRateLimit(identifier);
    if (!rateLimit.allowed) {
      if (cached) {
        return NextResponse.json({
          ...cached.data,
          cached: true,
          stale: true,
          cacheAge: Math.floor((Date.now() - cached.timestamp) / 1000),
          warning: "Using cached data due to rate limit",
        });
      }
      return NextResponse.json(
        { error: "Too many requests. Please try again later.", retryAfter: rateLimit.retryAfter },
        { status: 429, headers: { "Retry-After": String(rateLimit.retryAfter || 60) } }
      );
    }

    console.log("[parse POST] user:", user?.id, "hasToken:", !!userAccessToken);

    // Pass force down to the parser to bypass its internal cache
    const response = await handleFigmaParse(url, userAccessToken ?? "", { force: !!force });

    if (response.status === 429) {
      const errorData = await response.json();
      if (cached) {
        return NextResponse.json({
          ...cached.data,
          cached: true,
          stale: true,
          cacheAge: Math.floor((Date.now() - cached.timestamp) / 1000),
          warning: "Using cached data due to Figma rate limit",
        });
      }
      return NextResponse.json(
        {
          error: errorData.error || "Figma API rate limit exceeded",
          code: "FIGMA_RATE_LIMIT",
          retryAfter: errorData.retryAfter || 60,
          message: errorData.message || "Too many requests to Figma API",
          suggestion: errorData.suggestion,
        },
        { status: 429, headers: { "Retry-After": String(errorData.retryAfter || 60) } }
      );
    }

    const data = await response.json();

    const frameCount = Object.keys(data.frameImages || {}).length;
    if (response.ok && frameCount > 0) {
      parseCache.set(cacheKey, { data, timestamp: Date.now() });
    } else {
      console.log("[parse POST] Skipped caching (frameCount:", frameCount, ")");
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("[parse] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}


export async function GET(req: Request) {
  try {
    const supabase = await createClient();
    
    // Get authenticated user
    const { data: { user } } = await supabase.auth.getUser();

    
    // Retrieve Figma access token from profile_details
    let userAccessToken: string | undefined;
    if (user) {
      const { data: details, error: detailsError } = await supabase
        .from("profile_details")
        .select("figma_access_token")
        .eq("profile_id", user.id)
        .single();

              console.log(`[route] User ID: ${user.id}`);
      console.log(`[route] Token retrieved:`, !!details?.figma_access_token);
      console.log(`[route] Details error:`, detailsError);
      
      userAccessToken = details?.figma_access_token;
    } else {
      console.log(`[route] No authenticated user`);
    }

    const { searchParams } = new URL(req.url);
    const url = searchParams.get("url");

    if (!url) {
      return NextResponse.json(
        { error: "Missing url parameter" },
        { status: 400 }
      );
    }

    // Check cache first
    const cacheKey = getCacheKey(url, user?.id);
    const cached = parseCache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      console.log(`[route GET] Returning cached response for ${url}`);
      return NextResponse.json({
        ...cached.data,
        cached: true,
        cacheAge: Math.floor((Date.now() - cached.timestamp) / 1000),
      });
    }

    // Rate limiting
    const identifier = user?.id || req.headers.get("x-forwarded-for")?.split(",")[0] || "unknown";
    const rateLimit = checkRateLimit(identifier);

    if (!rateLimit.allowed) {
      if (cached) {
        console.log(
          `[route GET] Rate limited, returning stale cache for ${url}`
        );
        return NextResponse.json({
          ...cached.data,
          cached: true,
          stale: true,
          cacheAge: Math.floor((Date.now() - cached.timestamp) / 1000),
          warning: "Using cached data due to rate limit",
        });
      }

      return NextResponse.json(
        {
          error: "Too many requests. Please try again later.",
          retryAfter: rateLimit.retryAfter,
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(rateLimit.retryAfter || 60),
          },
        }
      );
    }


    // No explicit force on GET; ensure internal cache is not bypassed here
    const response = await handleFigmaParse(url, userAccessToken ?? "", { force: false });

    if (response.status === 429) {
      const errorData = await response.json();

      if (cached) {
        console.log(
          `[route GET] Figma rate limited, returning stale cache for ${url}`
        );
        return NextResponse.json({
          ...cached.data,
          cached: true,
          stale: true,
          cacheAge: Math.floor((Date.now() - cached.timestamp) / 1000),
          warning: "Using cached data due to Figma rate limit",
        });
      }

      return NextResponse.json(
        {
          error: errorData.error || "Figma API rate limit exceeded",
          code: "FIGMA_RATE_LIMIT",
          retryAfter: errorData.retryAfter || 60,
          message: errorData.message || "Too many requests to Figma API",
          suggestion: errorData.suggestion,
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(errorData.retryAfter || 60),
          },
        }
      );
    }

    const data = await response.json();
        // Avoid caching empty frame sets and remove duplicate cache writes
    const frameCount = Object.keys(data.frameImages || {}).length;
    if (response.ok && frameCount > 0) {
      parseCache.set(cacheKey, { data, timestamp: Date.now() });
      console.log(`[route GET] Cached successful parse for ${url} (frames:${frameCount})`);
    } else {
      console.log(`[route GET] Skipped caching (frames:${frameCount}) for ${url}`);
    }


    if (response.ok) {
      parseCache.set(cacheKey, {
        data,
        timestamp: Date.now(),
      });
      console.log(`[route GET] Cached successful parse for ${url}`);
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("[parse GET] Error:", error);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}