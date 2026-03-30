"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { HeroBackground } from "@/components/booking/HeroBackground";
import { verifyTicket } from "@/lib/supabase";
import {
  filterTicketInput,
  isValidTicketId,
  normalizeTicketId,
} from "@/lib/utils";

export default function LoginPage() {
  const router = useRouter();
  const [ticketId, setTicketId] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const normalizedPreview = useMemo(() => normalizeTicketId(ticketId), [ticketId]);
  const isValidFormat = useMemo(
    () => isValidTicketId(normalizedPreview),
    [normalizedPreview]
  );

  useEffect(() => {
    if (window.localStorage.getItem("ticket_id")) {
      router.replace("/workshops");
    }
  }, [router]);

  function handleTicketChange(value: string) {
    const next = filterTicketInput(value);
    setTicketId(next);

    const n = normalizeTicketId(next);
    if (!n || n.length < 4) {
      setError("");
      return;
    }

    setError(isValidTicketId(n) ? "" : "Ungültiges Format");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const normalized = normalizeTicketId(ticketId);
    if (!isValidTicketId(normalized)) {
      setError("Bitte gültige Ticket-ID eingeben.");
      return;
    }

    setError("");
    setIsSubmitting(true);

    const result = await verifyTicket(normalized);

    if (!result.ok) {
      if (result.reason === "not_configured") {
        setError("Supabase ist nicht konfiguriert. Prüfe .env.local (URL + Anon Key).");
      } else if (result.reason === "not_found") {
        setError("Ticket nicht gefunden. ID exakt wie in Supabase (Groß/Klein, Bindestriche)?");
      } else {
        const hint =
          result.message?.toLowerCase().includes("permission") ||
          result.message?.toLowerCase().includes("policy")
            ? " In Supabase: SQL aus supabase/migrations/20250324120000_fix_tickets_and_registrations_rls.sql ausführen."
            : "";
        setError(`Datenbank: ${result.message ?? "Unbekannter Fehler"}.${hint}`);
      }
      setIsSubmitting(false);
      return;
    }

    window.localStorage.setItem("ticket_id", normalized);
    setIsSubmitting(false);
    router.push("/workshops");
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
          className="h-auto w-full max-w-[200px] select-none brightness-0 invert sm:max-w-[240px]"
        />

        <div className="flex w-full max-w-[16rem] flex-col items-center gap-3 sm:max-w-[20rem]">
          <label
            htmlFor="ticketId"
            className="text-[11px] font-medium uppercase tracking-[0.35em] text-white/75"
          >
            Ticket ID
          </label>
          <input
            id="ticketId"
            name="ticketId"
            value={ticketId}
            onChange={(e) => handleTicketChange(e.target.value)}
            maxLength={64}
            autoComplete="off"
            inputMode="text"
            placeholder="••••••••••"
            aria-invalid={!!error}
            className="w-full rounded-xl border border-white/20 bg-white/5 px-4 py-3 text-center text-lg font-light tracking-[0.35em] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] outline-none backdrop-blur-md transition placeholder:text-white/25 focus:border-white/40 focus:bg-white/10 focus:ring-2 focus:ring-white/15"
          />
          {error ? (
            <p className="max-w-[20rem] text-center text-[11px] leading-relaxed text-rose-300/95" role="alert">
              {error}
            </p>
          ) : null}
        </div>

        <button
          type="submit"
          disabled={!isValidFormat || isSubmitting}
          className="glass-button rounded-2xl px-10 py-3.5 text-sm font-semibold uppercase tracking-[0.2em] text-white transition active:scale-[0.99]"
        >
          {isSubmitting ? "…" : "Enter Code"}
        </button>

        <a
          href="/admin/login"
          className="text-[11px] font-medium uppercase tracking-[0.28em] text-white/55 hover:text-white/85"
        >
          Login als Admin
        </a>
      </form>
    </div>
  );
}
