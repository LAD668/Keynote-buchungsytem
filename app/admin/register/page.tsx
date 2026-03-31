"use client";

import Link from "next/link";
import Image from "next/image";
import { FormEvent, useMemo, useState } from "react";
import { HeroBackground } from "@/components/booking/HeroBackground";

export default function AdminRegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [adminCode, setAdminCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const canSubmit = useMemo(() => {
    const trimmedEmail = email.trim();
    const pwOk = password.length >= 8 && password === confirmPassword;
    return name.trim().length > 0 && trimmedEmail.length > 0 && pwOk && adminCode.trim().length > 0;
  }, [name, email, password, confirmPassword, adminCode]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess(false);

    setLoading(true);
    try {
      const trimmedEmail = email.trim();
      if (password.length < 8) {
        setError("Password must be at least 8 characters");
        setLoading(false);
        return;
      }
      if (password !== confirmPassword) {
        setError("Passwords do not match");
        setLoading(false);
        return;
      }

      const res = await fetch("/api/admin/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: trimmedEmail,
          password,
          admin_code: adminCode.trim(),
        }),
      });

      const json = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(json.error ?? "Registration failed");
        setLoading(false);
        return;
      }

      setLoading(false);
      setSuccess(true);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Registration failed";
      setError(msg);
      setLoading(false);
    }
  }

  return (
    <div className="relative flex min-h-[100dvh] flex-col overflow-hidden">
      <HeroBackground priority />

      <form
        onSubmit={handleSubmit}
        noValidate
        className="relative z-10 flex min-h-[100dvh] flex-1 flex-col items-center justify-center gap-10 px-6 py-12 sm:gap-12"
      >
        <Image
          src="/dank-symposium-logo.png"
          alt="Dänk Symposium"
          width={800}
          height={266}
          priority
          className="h-auto w-full max-w-[180px] select-none brightness-0 invert sm:max-w-[220px]"
        />

        <div className="flex w-full max-w-[18rem] flex-col gap-4 sm:max-w-[22rem]">
          <div className="space-y-2">
            <label htmlFor="admin-name" className="text-[11px] font-medium uppercase tracking-[0.35em] text-white/75">
              Name
            </label>
            <input
              id="admin-name"
              name="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="name"
              placeholder="Max Muster"
              className="w-full rounded-xl border border-white/20 bg-white/5 px-4 py-3 text-left text-sm font-medium tracking-wide text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] outline-none backdrop-blur-md transition placeholder:text-white/25 focus:border-white/40 focus:bg-white/10 focus:ring-2 focus:ring-white/15"
              required
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="admin-email" className="text-[11px] font-medium uppercase tracking-[0.35em] text-white/75">
              Email
            </label>
            <input
              id="admin-email"
              name="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              placeholder="admin@beispiel.de"
              className="w-full rounded-xl border border-white/20 bg-white/5 px-4 py-3 text-left text-sm font-medium tracking-wide text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] outline-none backdrop-blur-md transition placeholder:text-white/25 focus:border-white/40 focus:bg-white/10 focus:ring-2 focus:ring-white/15"
              required
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="admin-password" className="text-[11px] font-medium uppercase tracking-[0.35em] text-white/75">
              Password
            </label>
            <input
              id="admin-password"
              name="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              placeholder="••••••••••"
              className="w-full rounded-xl border border-white/20 bg-white/5 px-4 py-3 text-left text-sm font-medium tracking-wide text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] outline-none backdrop-blur-md transition placeholder:text-white/25 focus:border-white/40 focus:bg-white/10 focus:ring-2 focus:ring-white/15"
              required
              minLength={8}
            />
          </div>

          <div className="space-y-2">
            <label
              htmlFor="admin-password-confirm"
              className="text-[11px] font-medium uppercase tracking-[0.35em] text-white/75"
            >
              Confirm Password
            </label>
            <input
              id="admin-password-confirm"
              name="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
              placeholder="••••••••••"
              className="w-full rounded-xl border border-white/20 bg-white/5 px-4 py-3 text-left text-sm font-medium tracking-wide text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] outline-none backdrop-blur-md transition placeholder:text-white/25 focus:border-white/40 focus:bg-white/10 focus:ring-2 focus:ring-white/15"
              required
              minLength={8}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="admin-code" className="text-[11px] font-medium uppercase tracking-[0.35em] text-white/75">
              Admin one-time code
            </label>
            <input
              id="admin-code"
              name="adminCode"
              type="text"
              value={adminCode}
              onChange={(e) => setAdminCode(e.target.value)}
              autoComplete="one-time-code"
              placeholder="ADMIN-K7P2M9"
              className="w-full rounded-xl border border-white/20 bg-white/5 px-4 py-3 text-left text-sm font-medium tracking-wide text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] outline-none backdrop-blur-md transition placeholder:text-white/25 focus:border-white/40 focus:bg-white/10 focus:ring-2 focus:ring-white/15"
              required
            />
          </div>

          {success ? (
            <div className="rounded-2xl border border-emerald-300/20 bg-emerald-500/10 p-4 text-sm text-emerald-100">
              Check your email to verify your account.
            </div>
          ) : null}

          {error ? (
            <p className="text-center text-[11px] leading-relaxed text-rose-300/95" role="alert">
              {error}
            </p>
          ) : null}
        </div>

        <button
          type="submit"
          disabled={!canSubmit || loading}
          className="glass-button rounded-2xl px-10 py-3.5 text-sm font-semibold uppercase tracking-[0.2em] text-white transition active:scale-[0.99]"
        >
          {loading ? "…" : "Sign up"}
        </button>

        <Link href="/admin/login" className="text-[11px] font-medium uppercase tracking-[0.28em] text-white/55 hover:text-white/85">
          Already have an account? Login
        </Link>
      </form>
    </div>
  );
}

