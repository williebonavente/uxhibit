import { NextRequest } from "next/server";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { writeFile, readFile, unlink, stat } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import odiffBin from "odiff-bin";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const execFileAsync = promisify(execFile);

function resolveOdiffPath(): string {
  const anyBin = odiffBin as any;
  const bin =
    (typeof odiffBin === "string" && (odiffBin as unknown as string)) ||
    anyBin?.path ||
    anyBin?.default;
  if (!bin || typeof bin !== "string") {
    throw new Error("[odiff] Could not resolve odiff-bin path");
  }
  return bin;
}

export async function POST(req: NextRequest) {
  const t0 = Date.now();
  try {
    const { prev, curr, threshold = 0.4 } = (await req.json()) as {
      prev: string;
      curr: string;
      threshold?: number;
    };

    if (!prev || !curr) {
      return new Response(JSON.stringify({ error: "Missing URLs", dataUrl: null }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Download both inputs
    const [prevBuf, currBuf] = await Promise.all([
      fetch(prev).then((r) => {
        if (!r.ok) throw new Error("Prev fetch " + r.status);
        return r.arrayBuffer();
      }).then((b) => Buffer.from(b)),
      fetch(curr).then((r) => {
        if (!r.ok) throw new Error("Curr fetch " + r.status);
        return r.arrayBuffer();
      }).then((b) => Buffer.from(b)),
    ]);

    const id = randomUUID();
    const dir = tmpdir();
    const prevPath = join(dir, `odiff-prev-${id}.png`);
    const currPath = join(dir, `odiff-curr-${id}.png`);
    const diffPath = join(dir, `odiff-diff-${id}.png`);

    await Promise.all([writeFile(prevPath, prevBuf), writeFile(currPath, currBuf)]);

    const binPath = resolveOdiffPath();
    const thr = Math.max(0, Math.min(1, threshold));

    let stdout = "";
    let stderr = "";
    try {
      const res = await execFileAsync(binPath, [
        prevPath,
        currPath,
        diffPath, // positional output path
        "--threshold",
        String(thr),
        "--antialiasing",
      ]);
      stdout = res.stdout;
      stderr = res.stderr;
    } catch (e: any) {
      console.error("[odiff] exec error", e?.message, e?.stderr);
      await safeCleanup([prevPath, currPath, diffPath]);
      return new Response(JSON.stringify({ error: "odiff failed", dataUrl: null }), {
        headers: { "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Some cases (equal images / threshold high) produce no diff file
    let base64: string | null = null;
    try {
      await stat(diffPath); // throws if not exists
      const out = await readFile(diffPath);
      base64 = out.toString("base64");
    } catch {
      // No diff produced
      base64 = null;
    }

    await safeCleanup([prevPath, currPath, diffPath]);

    const elapsed = Date.now() - t0;
    return new Response(
      JSON.stringify({
        dataUrl: base64 ? `data:image/png;base64,${base64}` : null,
        meta: { threshold: thr, ms: elapsed, hasDiff: !!base64, stdoutLen: stdout?.length || 0 },
      }),
      {
        headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
        status: 200,
      }
    );
  } catch (e: any) {
    console.error("[odiff] route catch", e?.message);
    return new Response(JSON.stringify({ error: e?.message || "Unknown", dataUrl: null }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  }
}

async function safeCleanup(paths: string[]) {
  await Promise.all(
    paths.map((p) =>
      unlink(p).catch(() => {
        /* ignore */
      })
    )
  );
}