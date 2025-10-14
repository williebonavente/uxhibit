"use client";
import { useState } from "react";
import type { Testimonial } from "../types";
export default function TestimonialsForm({
  profileId,
  initialData,
  onSaved,
  onCancel,
  show
}: {
  profileId: string;
  initialData?: Testimonial;
  onSaved?: (testimonial: Testimonial) => void;
  onCancel?: () => void;
  show?: boolean;
}) {
  const [quote, setQuote] = useState(initialData?.quote || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const method = initialData?.id ? "PUT" : "POST";
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "";
      const url = `${baseUrl}/api/testimonials`;
      const payload = initialData?.id
        ? { id: initialData.id, quote, profile_id: profileId }
        : { quote, profile_id: profileId };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save testimonial");
      onSaved?.(data);
      setQuote("");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }
  if (show === false) return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 backdrop-blur-sm cursor-pointer"
      onClick={onCancel}
    >
      <div
        className="relative z-10 flex flex-col w-full max-w-sm sm:max-w-md md:max-w-lg p-6 sm:p-8 bg-white dark:bg-[#1A1A1A] rounded-2xl shadow-xl border border-white/20 cursor-default"
        onClick={e => e.stopPropagation()}
      >
        <div className="mb-4">
          <h3 className="text-2xl sm:text-3xl font-bold text-center gradient-text mb-6">
            Testimonial
          </h3>
        </div>
        <form id="testimonial-form" onSubmit={handleSubmit} className="space-y-4">
          <textarea
            placeholder="Type your testimony here..."
            className="border rounded px-2 py-1 w-full min-h-24 resize-none bg-neutral-50 dark:bg-neutral-900 focus:outline-none focus:ring-2 focus:ring-[#ED5E20] transition placeholder:italic"
            value={quote}
            onChange={e => setQuote(e.target.value)}
            required
          />
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <div className="flex gap-2 justify-end">
            {/* Cancel Button */}
            <button
              type="button"
              onClick={onCancel}
              disabled={loading}
              className="inline-flex items-center justify-center px-5 py-2 rounded-xl text-sm font-medium
                border border-neutral-300/70 dark:border-neutral-600/60 
                bg-white/60 dark:bg-neutral-800/50
                text-neutral-700 dark:text-neutral-200
                shadow-sm backdrop-blur
                hover:bg-white/80 dark:hover:bg-neutral-800/70
                transition-colors cursor-pointer"
            >
              Cancel
            </button>
            {/* Save Button */}
            <button
              type="submit"
              disabled={loading || !quote}
              className="group relative inline-flex items-center justify-center
                px-6 py-2.5 rounded-xl text-sm text-white font-semibold tracking-wide
                transition-all duration-300 cursor-pointer
                focus:outline-none focus-visible:ring-4 focus-visible:ring-[#ED5E20]/40
                disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span
                aria-hidden
                className="absolute inset-0 rounded-xl bg-gradient-to-r from-[#ED5E20] via-[#f97316] to-[#f59e0b]"
              />
              <span
                aria-hidden
                className="absolute inset-[2px] rounded-[10px] bg-[linear-gradient(145deg,rgba(255,255,255,0.28),rgba(255,255,255,0.07))] backdrop-blur-[2px]"
              />
              <span
                aria-hidden
                className="absolute -left-1 -right-1 top-0 h-full overflow-hidden rounded-xl"
              >
                <span className="absolute inset-y-0 -left-full w-1/2 translate-x-0 
                  bg-gradient-to-r from-transparent via-white/50 to-transparent opacity-0 
                  transition-all duration-700 group-hover:translate-x-[220%] group-hover:opacity-70" />
              </span>
              <span
                aria-hidden
                className="absolute inset-0 rounded-xl ring-1 ring-white/30 group-hover:ring-white/50"
              />
              <span className="relative z-10 flex items-center gap-1">
                {loading ? "Saving..." : initialData?.id ? "Update" : "Add"}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}