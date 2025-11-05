import { Worker } from "worker_threads";
import path from "path";
import { FigmaNode } from "@/lib/declaration/figmaInfo";
import { DetectedButton } from "@/lib/declaration/componentAlias";

export async function detectButtonsParallel(nodes: FigmaNode[]): Promise<DetectedButton[]> {
  const frames = nodes.filter((n) => n.type === "FRAME");

  // Path to the worker script
  const workerScript = path.resolve(__dirname, "./buttonWorker.ts");

  const promises = frames.map(
    (frame) =>
      new Promise<DetectedButton[]>((resolve, reject) => {
        const worker = new Worker(workerScript, {
          workerData: frame,
        });

        worker.on("message", (data) => {
          if (Array.isArray(data)) resolve(data);
          else reject(new Error(data?.error || "Unknown worker error"));
        });

        worker.on("error", reject);
      })
  );

  const results = await Promise.all(promises);
  return results.flat();
}
