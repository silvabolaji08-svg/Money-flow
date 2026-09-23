"use client";

import { useEffect } from "react";

/**
 * Last-resort boundary. It replaces the root layout, so it ships its own html
 * and body, and deliberately uses inline styles rather than depending on the
 * stylesheet having loaded.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[moneyflow] fatal error:", error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100dvh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "system-ui, sans-serif",
          background: "#fbfbfc",
          color: "#1a1a1f",
        }}
      >
        <main style={{ maxWidth: "26rem", padding: "2rem", textAlign: "center" }}>
          <h1 style={{ fontSize: "1.25rem", fontWeight: 600, margin: "0 0 0.5rem" }}>
            MoneyFlow could not start
          </h1>
          <p style={{ fontSize: "0.875rem", lineHeight: 1.6, color: "#5a5a66", margin: 0 }}>
            An unexpected error stopped the app from loading. Your data has not been affected.
          </p>
          <button
            type="button"
            onClick={reset}
            style={{
              marginTop: "1.5rem",
              padding: "0.6rem 1.1rem",
              borderRadius: "0.6rem",
              border: "none",
              background: "#1a1a1f",
              color: "#fff",
              fontSize: "0.875rem",
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            Reload the app
          </button>
        </main>
      </body>
    </html>
  );
}
