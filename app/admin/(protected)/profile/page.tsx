import { redirect } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { getSupabaseServerClient } from "@/lib/supabaseServer";
import { AdminProfileClient } from "@/components/admin/AdminProfileClient";

export default async function AdminProfilePage() {
  const supabase = getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const email = user?.email?.trim() ?? "";
  if (!email) {
    redirect("/admin/login");
  }

  const name = (user?.user_metadata as { name?: string | null } | null)?.name?.toString().trim() ?? "";

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-left text-3xl font-bold tracking-tight text-white sm:text-4xl">Einstellungen</h1>
        <p className="text-sm text-white/60">Besucher-Verwaltung & Profil</p>
      </header>

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

          <AdminProfileClient />
        </div>
      </Card>
    </div>
  );
}

