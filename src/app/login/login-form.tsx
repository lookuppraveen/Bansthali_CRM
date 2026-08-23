"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";

export function LoginForm({ from, error }: { from?: string; error?: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("meenakshi@banasthali.edu.in");
  const [password, setPassword] = useState("banasthali123");
  const [errMsg, setErrMsg] = useState<string | null>(error === "CredentialsSignin" ? "Wrong email or password" : null);
  const [pending, start] = useTransition();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrMsg(null);
    start(async () => {
      const res = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });
      if (res?.error) {
        setErrMsg("Wrong email or password");
        return;
      }
      router.push(from || "/app");
      router.refresh();
    });
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-3">
      <div>
        <label style={{ fontSize: 12, color: "var(--color-muted)" }}>Email</label>
        <input
          type="email"
          className="input"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoFocus
        />
      </div>
      <div>
        <label style={{ fontSize: 12, color: "var(--color-muted)" }}>Password</label>
        <input
          type="password"
          className="input"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>
      {errMsg && (
        <div style={{ fontSize: 12, color: "#b4442e" }}>{errMsg}</div>
      )}
      <button type="submit" className="btn btn-primary btn-block" disabled={pending}>
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
