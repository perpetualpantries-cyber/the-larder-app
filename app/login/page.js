"use client";
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  const params = useSearchParams();

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Wrong password.");
        setBusy(false);
        return;
      }
      router.push(params.get("next") || "/");
      router.refresh();
    } catch {
      setError("Something went wrong — try again.");
      setBusy(false);
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#faf7f1",
        fontFamily: "'Public Sans', -apple-system, sans-serif",
        padding: 16,
      }}
    >
      <form
        onSubmit={submit}
        style={{
          width: "100%",
          maxWidth: 360,
          background: "#fff",
          border: "1px solid #e4dfd2",
          borderRadius: 16,
          padding: 28,
          boxShadow: "0 6px 20px -8px rgba(22,50,79,.18)",
        }}
      >
        <h1
          style={{
            fontFamily: "'Fraunces', Georgia, serif",
            fontSize: 22,
            fontWeight: 600,
            color: "#16324F",
            margin: "0 0 6px",
          }}
        >
          The Larder
        </h1>
        <p style={{ color: "#4a6178", fontSize: 13.5, margin: "0 0 20px" }}>
          Private. Enter the password to open it.
        </p>
        <input
          type="password"
          autoFocus
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          style={{
            width: "100%",
            border: "1px solid #e4dfd2",
            borderRadius: 10,
            padding: "10px 12px",
            fontSize: 15,
            marginBottom: 12,
            boxSizing: "border-box",
          }}
        />
        {error ? (
          <div style={{ color: "#b3492f", fontSize: 13, marginBottom: 12 }}>{error}</div>
        ) : null}
        <button
          type="submit"
          disabled={busy || !password}
          style={{
            width: "100%",
            background: "#0f9a85",
            color: "#fff",
            border: "none",
            borderRadius: 10,
            padding: "10px 12px",
            fontSize: 15,
            fontWeight: 600,
            cursor: busy || !password ? "default" : "pointer",
            opacity: busy || !password ? 0.6 : 1,
          }}
        >
          {busy ? "Opening…" : "Open"}
        </button>
      </form>
    </div>
  );
}
