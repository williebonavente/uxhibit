import { parentPort, workerData } from "worker_threads";
import { detectButtonsInFrame } from "./detectButtons";

try {
  const result = detectButtonsInFrame(workerData);
  parentPort?.postMessage(result);
} catch (err) {
  parentPort?.postMessage({ error: (err as Error).message });
}
