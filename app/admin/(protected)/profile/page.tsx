"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { getSupabaseBrowserClient } from "@/lib/supabaseBrowser";

export default function AdminProfilePage() {
  const router = useRouter();
  const [name, setName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [error, setError] = useState("");

  async function logout() {
    setError("");
    try {
      const supabase = getSupabaseBrowserClient();
      await supabase.auth.signOut();
    } catch {
      // ignore
    }
    router.replace("/admin/login");
  }

  useEffect(() => {
    let alive = true;
    async function load() {
      setError("");
      try {
        const supabase = getSupabaseBrowserClient();
        const { data, error: uError } = await supabase.auth.getUser();
        if (!alive) return;
        if (uError) {
          setError("Profil konnte nicht geladen werden.");
          return;
        }
        const u = data.user;
        setEmail(u?.email?.trim() ?? "");
        const n = (u?.user_metadata as { name?: string | null } | null)?.name?.toString().trim() ?? "";
        setName(n);
      } catch {
        if (!alive) return;
        setError("Profil konnte nicht geladen werden.");
      }
    }
    load();
    return () => {
      alive = false;
    };
  }, []);

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-left text-3xl font-bold tracking-tight text-white sm:text-4xl">Einstellungen</h1>
        <p className="text-sm text-white/60">Besucher-Verwaltung & Profil</p>
      </header>

      {error ? (
        <p className="rounded-xl border border-rose-400/30 bg-rose-500/10 px-4 py-2 text-sm text-rose-100" role="alert">
          {error}
        </p>
      ) : null}

      <Card className="border-white/15 bg-white/10 text-white backdrop-blur-md">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-white/45">Besucher Verwaltung</p>
          <p className="text-sm text-white/70">Kommt als Nächstes.</p>
        </div>
      </Card>

      <Card className="border-white/15 bg-white/10 text-white backdrop-blur-md">
        <div className="space-y-4">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-white/45">Profil</p>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-white/45">Name</p>
              <p className="mt-1 text-lg font-semibold text-white">{name || "—"}</p>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-white/45">Email</p>
              <p className="mt-1 text-sm text-white/80">{email || "—"}</p>
            </div>
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

