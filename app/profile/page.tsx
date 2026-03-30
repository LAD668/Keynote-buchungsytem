"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { getSupabaseClient } from "@/lib/supabase";

export default function ProfilePage() {
  const router = useRouter();
  const [ticketId, setTicketId] = useState("");
  const [guestName, setGuestName] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const storedTicketId = window.localStorage.getItem("ticket_id") ?? "";
    setTicketId(storedTicketId);

    const client = getSupabaseClient();
    if (!client || !storedTicketId) {
      return;
    }
    const supabase = client;

    async function load() {
      const { data, error: qError } = await supabase
        .from("tickets")
        .select("guest_name")
        .eq("ticket_id", storedTicketId)
        .maybeSingle();

      if (qError) {
        setError("Profil konnte nicht geladen werden.");
        return;
      }

      const gn = (data as { guest_name?: string | null } | null)?.guest_name?.trim();
      setGuestName(gn || null);
    }

    load();
  }, []);

  function logout() {
    window.localStorage.removeItem("ticket_id");
    router.replace("/login");
  }

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-left text-3xl font-bold tracking-tight text-white sm:text-4xl">Profil</h1>
        <p className="text-sm text-white/60">Ticket & persönliche Angaben</p>
      </header>

      {error ? (
        <p className="rounded-xl border border-rose-400/30 bg-rose-500/10 px-4 py-2 text-sm text-rose-100">
          {error}
        </p>
      ) : null}

      <Card className="border-white/15 bg-white/10 text-white backdrop-blur-md">
        <div className="space-y-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-white/45">Name</p>
            <p className="mt-1 text-lg font-semibold text-white">{guestName ?? "—"}</p>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-white/45">Ticket</p>
            <p className="mt-1 font-mono text-sm text-white/80">{maskTicketId(ticketId)}</p>
          </div>
          <button
            type="button"
            onClick={logout}
            className="glass-button w-full rounded-2xl px-5 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-white"
          >
            Logout
          </button>
        </div>
      </Card>
    </div>
  );
}

function maskTicketId(ticketId: string) {
  if (!ticketId) return "---";
  if (ticketId.length < 6) return `${ticketId.slice(0, 1)}***`;
  return `${ticketId.slice(0, 3)}***${ticketId.slice(-2)}`;
}

