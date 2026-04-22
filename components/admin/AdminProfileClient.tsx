 "use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabaseBrowser";

export function AdminProfileClient() {
  const router = useRouter();
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState(false);

  async function logout() {
    setError("");
    setLoading(true);
    try {
      const supabase = getSupabaseBrowserClient();
      await supabase.auth.signOut();
      router.replace("/admin/login");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Logout fehlgeschlagen.";
      setError(msg);
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      {error ? (
        <p className="rounded-xl border border-rose-400/30 bg-rose-500/10 px-4 py-2 text-sm text-rose-100" role="alert">
          {error}
        </p>
      ) : null}

      <button
        type="button"
        onClick={logout}
        disabled={loading}
        className="glass-button w-full rounded-2xl px-5 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-white disabled:opacity-60"
      >
        {loading ? "…" : "Logout"}
      </button>
    </div>
  );
}

