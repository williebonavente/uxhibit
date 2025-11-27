"use client";

import Link from "next/link";

export default function NotFound() {
  return (
    <div style={styles.container}>
      <h1 style={styles.code}>404</h1>
      <h2 style={styles.title}>Page not found</h2>
      <p style={styles.message}>
        We couldn’t find that page. It may have been moved or deleted.
      </p>
      <div style={styles.actions}>
        <Link href="/" style={{ ...styles.btn, ...styles.primary }}>
          Go to homepage
        </Link>
        <Link href="/search" style={{ ...styles.btn, ...styles.ghost }}>
          Search the site
        </Link>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: { minHeight: "100dvh", display: "grid", placeItems: "center", textAlign: "center", padding: 32, background: "linear-gradient(180deg,#0b1020,#060913)", color: "#e5e7eb" },
  code: { fontSize: 80, margin: 0, letterSpacing: 2, color: "#818cf8" },
  title: { fontSize: 22, margin: "12px 0 8px" },
  message: { opacity: 0.85, maxWidth: 560, margin: "0 auto 18px" },
  actions: { display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" },
  btn: { display: "inline-block", padding: "10px 16px", borderRadius: 10, textDecoration: "none", fontWeight: 600, border: "1px solid rgba(229,231,235,0.18)", color: "#e5e7eb" },
  primary: { background: "linear-gradient(180deg, #4f46e5, #4338ca)", borderColor: "transparent" },
  ghost: { background: "transparent" },
};