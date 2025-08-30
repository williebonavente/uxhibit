"use client";

import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";

export default function TestMistralPage() {
  const [prompt, setPrompt] = useState("");
  const [model, setModel] = useState("mistral-tiny");
  const [loading, setLoading] = useState(false);
  const [answer, setAnswer] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setAnswer(null);
    setError(null);
    try {
      const res = await fetch("/api/test-mistral", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, model }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Request failed");
      setAnswer(data.output);
    } catch (err: any) {
      setError(err.message || "Error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-4">
      <h1 className="text-xl font-semibold">Test Mistral Chat</h1>
      <form onSubmit={onSubmit} className="space-y-3">
        <Textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Ask something…"
          className="w-full border rounded-md p-3 min-h-[120px]"
          required
        />
        <div className="flex items-center gap-3">
          <label className="text-sm">Model</label>
          <select
            value={model}
            onChange={(e) => setModel(e.target.value)}
            className="border rounded-md p-2 text-sm"
          >
            <option value="mistral-tiny">mistral-tiny</option>
            <option value="mistral-small">mistral-small</option>
            <option value="mistral-medium">mistral-medium</option>
            <option value="mistral-large-latest">mistral-large-latest</option>
          </select>
        </div>
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 rounded-md bg-black text-white disabled:opacity-50"
        >
          {loading ? "Asking…" : "Ask"}
        </button>
      </form>

      {error && <p className="text-red-600 text-sm">{error}</p>}
      {answer && (
        <div className="mt-3 p-3 border rounded-md bg-white">
          <pre className="whitespace-pre-wrap text-sm">{answer}</pre>
        </div>
      )}
    </div>
  );
}