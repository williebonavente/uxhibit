type CacheEntry<T> = { value: T; expires: number };
const cache = new Map<string, CacheEntry<any>>();
const pending = new Map<string, Promise<any>>();

const TTL_MS_FILE = 30_000; // 30s for file metadata
const TTL_MS_IMAGES = 60_000; // 60s for images response
const MAX_RETRIES = 4;
const MAX_IMAGE_IDS_PER_CALL = 50;

function now() { return Date.now(); }

function getCached<T>(key: string): T | null {
  const c = cache.get(key);
  if (!c) return null;
  if (c.expires < now()) {
    cache.delete(key);
    return null;
  }
  return c.value as T;
}

function setCached<T>(key: string, value: T, ttl: number) {
  cache.set(key, { value, expires: now() + ttl });
}

async function fetchWithRetry(url: string, init: RequestInit, retries = MAX_RETRIES): Promise<Response> {
  let attempt = 0;
  while (true) {
    const res = await fetch(url, init);
    // debug headers if 429
    if (res.status === 429) {
      console.warn("Figma 429", {
        remaining: res.headers.get("X-RateLimit-Remaining"),
        reset: res.headers.get("X-RateLimit-Reset"),
        attempt
      });
    }
    if (res.status !== 429 && res.status < 500) return res;
    attempt++;
    if (attempt > retries) return res;
    const backoff = Math.min(2500, 200 * 2 ** attempt) + Math.random() * 150;
    await new Promise(r => setTimeout(r, backoff));
  }
}

export async function getFigmaFile(fileKey: string, token: string) {
  const cacheKey = `file:${fileKey}`;
  const cached = getCached<any>(cacheKey);
  if (cached) return cached;
  if (pending.has(cacheKey)) return pending.get(cacheKey)!;
  const p = (async () => {
    const res = await fetchWithRetry(`https://api.figma.com/v1/files/${fileKey}`, {
      headers: { "X-Figma-Token": token },
      cache: "no-store"
    });
    if (!res.ok) throw new Error(`File fetch failed ${res.status}`);
    const json = await res.json();
    setCached(cacheKey, json, TTL_MS_FILE);
    pending.delete(cacheKey);
    return json;
  })();
  pending.set(cacheKey, p);
  return p;
}

export async function getFigmaImages(fileKey: string, ids: string[], token: string, scale = 0.75) {
  if (!ids.length) return {};
  const sortedIds = [...new Set(ids)].sort();
  const idsParam = sortedIds.map(encodeURIComponent).join(",");
  const cacheKey = `images:${fileKey}:${idsParam}:${scale}`;
  const cached = getCached<Record<string, string>>(cacheKey);
  if (cached) return cached;
  if (pending.has(cacheKey)) return pending.get(cacheKey)!;

  const p = (async () => {
    const url = `https://api.figma.com/v1/images/${fileKey}?ids=${idsParam}&format=png&scale=${scale}`;
    const res = await fetchWithRetry(url, { headers: { "X-Figma-Token": token } });
    if (!res.ok) throw new Error(`Images fetch failed ${res.status}`);
    const json = await res.json();
    const images = json.images || {};
    setCached(cacheKey, images, TTL_MS_IMAGES);
    pending.delete(cacheKey);
    return images;
  })();
  pending.set(cacheKey, p);
  return p;
}

export async function getFigmaImagesChunked(fileKey: string, ids: string[], token: string, scale = 0.75) {
  const unique = [...new Set(ids)];
  const chunks: string[][] = [];
  for (let i = 0; i < unique.length; i += MAX_IMAGE_IDS_PER_CALL) {
    chunks.push(unique.slice(i, i + MAX_IMAGE_IDS_PER_CALL));
  }
  const aggregate: Record<string, string> = {};
  for (const group of chunks) {
    const part = await getFigmaImages(fileKey, group, token, scale);
    Object.assign(aggregate, part);
    await new Promise(r => setTimeout(r, 120)); // spacer to avoid 429
  }
  return aggregate;
}

export async function getFigmaSingleImage(fileKey: string, nodeId: string, token: string, scale = 0.75) {
  const imgs = await getFigmaImages(fileKey, [nodeId], token, scale);
  return imgs[nodeId] || null;
}

