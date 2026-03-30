"use client";

import { useRouter } from "next/navigation";

export default function AdminProfilePage() {
  const router = useRouter();

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.replace("/admin/login");
  }

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-left text-3xl font-bold tracking-tight text-white sm:text-4xl">Profil</h1>
        <p className="text-sm text-white/60">Admin Session</p>
      </header>

      <button
        type="button"
        onClick={logout}
        className="glass-button w-full rounded-2xl px-5 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-white"
      >
        Logout
      </button>
    </div>
  );
}

