"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { HeroBackground } from "@/components/booking/HeroBackground";

type State = "loading" | "success" | "error";

export default function AdminVerifyPage() {
  const router = useRouter();
  const token = useMemo(() => {
    if (typeof window === "undefined") return "";
    return new URLSearchParams(window.location.search).get("token") ?? "";
  }, []);
  const [state, setState] = useState<State>("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    let alive = true;
    async function run() {
      if (!token) {
        setState("error");
        setMessage("Missing token");
        return;
      }

      try {
        const res = await fetch("/api/admin/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });
        const json = (await res.json().catch(() => ({}))) as { error?: string };
        if (!alive) return;

        if (!res.ok) {
          setState("error");
          setMessage(json.error ?? "Verification failed");
          return;
        }

        setState("success");
        setMessage("Email verified. Redirecting to login…");
        window.setTimeout(() => router.replace("/admin/login"), 3000);
      } catch (e) {
        if (!alive) return;
        const msg = e instanceof Error ? e.message : "Verification failed";
        setState("error");
        setMessage(msg);
      }
    }
    run();
    return () => {
      alive = false;
    };
  }, [router, token]);

  return (
    <div className="relative flex min-h-[100dvh] flex-col overflow-hidden">
      <HeroBackground priority />

      <div className="relative z-10 flex min-h-[100dvh] flex-1 flex-col items-center justify-center gap-8 px-6 py-12">
        <Image
          src="/dank-symposium-logo.png"
          alt="Dänk Symposium"
          width={800}
          height={266}
          priority
          className="h-auto w-full max-w-[180px] select-none brightness-0 invert sm:max-w-[220px]"
        />

        <div className="w-full max-w-md rounded-2xl border border-white/15 bg-white/5 p-5 text-center text-sm text-white/80 backdrop-blur-md">
          {state === "loading" ? "Verifying…" : message}
          {state === "error" ? (
            <div className="mt-4">
              <Link href="/admin/register" className="text-[11px] font-medium uppercase tracking-[0.28em] text-white/70 hover:text-white/90">
                Zur Registrierung
              </Link>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

