import { EvalResponse, EvaluateInput } from "../types/evalResponse";

export async function evaluateDesign(input: EvaluateInput): Promise<EvalResponse[]> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  console.log("Calling evaluate with:", input);

  const res = await fetch(`${baseUrl}/api/ai/evaluate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });

  const data = await res.json();
  console.log("Evaluate response:", data);

  if (!res.ok) {
    console.error("Evaluate failed:", data);
    throw new Error(data?.error || "Failed to evaluate");
  }
  console.log("Existing data: ", data);
  return data as EvalResponse[];
}