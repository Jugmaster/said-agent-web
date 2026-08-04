"use client"; // Error boundaries must be Client Components

// Replaces the root layout when it errors, so it must render its own
// <html>/<body> and carry its own styles (globals.css is not applied).
export default function GlobalError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100dvh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0a0a0a",
          color: "#fafafa",
          fontFamily:
            "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
          textAlign: "center",
          padding: "0 1.5rem",
        }}
      >
        <div style={{ maxWidth: "28rem" }}>
          <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>⚠️</div>
          <h1 style={{ fontSize: "1.25rem", margin: "0 0 0.5rem" }}>
            Something went wrong
          </h1>
          <p style={{ fontSize: "0.875rem", color: "#a1a1aa", margin: "0 0 2rem" }}>
            Your agent and funds are fine — the app hit an error.
            {error.digest ? ` (Reference: ${error.digest})` : ""}
          </p>
          <button
            onClick={() => unstable_retry()}
            style={{
              padding: "0.65rem 1.25rem",
              background: "#fafafa",
              color: "#0a0a0a",
              border: "none",
              borderRadius: "0.5rem",
              fontSize: "0.875rem",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
