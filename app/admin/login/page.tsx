"use client";

import { FormEvent, useMemo, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { HeroBackground } from "@/components/booking/HeroBackground";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const canSubmit = useMemo(() => email.trim().length > 0 && password.length > 0, [email, password]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    const response = await fetch("/api/admin/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const payload = (await response.json().catch(() => ({}))) as { error?: string };
      setError(payload.error ?? "Anmeldung fehlgeschlagen");
      setLoading(false);
      return;
    }

    setLoading(false);
    router.replace("/admin");
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
            <label
              htmlFor="admin-email"
              className="text-[11px] font-medium uppercase tracking-[0.35em] text-white/75"
            >
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
            <label
              htmlFor="admin-password"
              className="text-[11px] font-medium uppercase tracking-[0.35em] text-white/75"
            >
              Passwort
            </label>
            <input
              id="admin-password"
              name="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              placeholder="••••••••••"
              className="w-full rounded-xl border border-white/20 bg-white/5 px-4 py-3 text-left text-sm font-medium tracking-wide text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] outline-none backdrop-blur-md transition placeholder:text-white/25 focus:border-white/40 focus:bg-white/10 focus:ring-2 focus:ring-white/15"
              required
            />
          </div>

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
          {loading ? "…" : "Login"}
        </button>

        <a
          href="/login"
          className="text-[11px] font-medium uppercase tracking-[0.28em] text-white/55 hover:text-white/85"
        >
          Besucher Login
        </a>
      </form>
    </div>
  );
}

