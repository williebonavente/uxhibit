"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [show, setShow] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    console.error("[App Error Boundary]", error);
  }, [error]);

  const timestamp = useMemo(() => new Date().toISOString(), []);
  const details = useMemo(
    () =>
      JSON.stringify(
        { message: error?.message, name: error?.name, digest: (error as any)?.digest, timestamp },
        null,
        2
      ),
    [error, timestamp]
  );

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(details);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {}
  };

  return (
    <div style={styles.wrapper}>
      <div style={styles.card} role="alert" aria-live="assertive">
        <div style={styles.badge}>Unexpected Error</div>
        <h1 style={styles.title}>Something went wrong</h1>
        <p style={styles.subtitle}>
          You can retry, go back home, or reveal technical details for support.
        </p>

        <div style={styles.actions}>
          <button style={{ ...styles.btn, ...styles.primary }} onClick={reset}>
            Try again
          </button>
          <Link href="/" style={{ ...styles.btn, ...styles.ghost }}>
            Go to Homepage
          </Link>
          <button
            style={{ ...styles.btn, ...styles.secondary }}
            onClick={() => setShow((s) => !s)}
            aria-expanded={show}
            aria-controls="error-details"
          >
            {show ? "Hide details" : "Show details"}
          </button>
        </div>

        {show && (
          <div id="error-details" style={styles.details}>
            {(error as any)?.digest && (
              <div style={styles.kv}>
                <span style={styles.k}>Error ID</span>
                <span style={styles.v}>{(error as any).digest}</span>
              </div>
            )}
            <div style={styles.kv}>
              <span style={styles.k}>Time</span>
              <span style={styles.v}>{timestamp}</span>
            </div>
            <pre style={styles.pre}>{details}</pre>
            <div style={{ display: "flex", gap: 12 }}>
              <button style={{ ...styles.btn, ...styles.small }} onClick={copy}>
                {copied ? "Copied!" : "Copy details"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  wrapper: { minHeight: "100dvh", display: "grid", placeItems: "center", padding: "48px 16px", background: "radial-gradient(1200px 600px at 20% -10%, #1f2937 0%, transparent 60%), radial-gradient(1000px 500px at 110% 10%, #0f172a 0%, #030712 60%)", color: "#e5e7eb" },
  card: { width: "100%", maxWidth: 720, borderRadius: 16, padding: 28, border: "1px solid rgba(255,255,255,0.08)", background: "linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02))", boxShadow: "0 10px 30px rgba(0,0,0,0.35)" },
  badge: { display: "inline-block", padding: "6px 10px", borderRadius: 999, background: "rgba(244,63,94,0.12)", color: "rgb(244,63,94)", fontSize: 12, fontWeight: 600, marginBottom: 12 },
  title: { fontSize: 36, lineHeight: 1.2, margin: "4px 0 8px", fontWeight: 700 },
  subtitle: { opacity: 0.85, margin: "0 0 20px" },
  actions: { display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 14 },
  btn: { appearance: "none", border: "1px solid transparent", borderRadius: 10, padding: "10px 14px", fontSize: 14, fontWeight: 600, cursor: "pointer", color: "#e5e7eb", textDecoration: "none", transition: "all .15s ease" },
  primary: { background: "linear-gradient(180deg, #4f46e5, #4338ca)", boxShadow: "0 6px 18px rgba(79,70,229,0.35)" },
  secondary: { background: "rgba(99,102,241,0.12)", border: "1px solid rgba(99,102,241,0.35)" },
  ghost: { background: "transparent", border: "1px solid rgba(229,231,235,0.18)" },
  details: { marginTop: 10, padding: 14, borderRadius: 12, background: "rgba(2,6,23,0.6)", border: "1px solid rgba(148,163,184,0.18)" },
  kv: { display: "flex", gap: 10, fontSize: 13, marginBottom: 6, alignItems: "baseline" },
  k: { opacity: 0.7, minWidth: 72 },
  v: { fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace" },
  pre: { margin: "10px 0 12px", padding: 12, borderRadius: 8, background: "rgba(255,255,255,0.03)", maxHeight: 280, overflow: "auto", fontSize: 12, lineHeight: 1.4, border: "1px solid rgba(255,255,255,0.06)" },
  small: { padding: "8px 10px", fontSize: 12 },
};