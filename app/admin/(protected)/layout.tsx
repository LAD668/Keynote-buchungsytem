import { redirect } from "next/navigation";
import { AdminShell } from "@/components/admin/AdminShell";
import { getSupabaseServerClient } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";

export default async function AdminProtectedLayout({ children }: { children: React.ReactNode }) {
  const supabase = getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const email = user?.email?.trim();
  if (!user || !email) {
    redirect("/admin/login");
  }

  const { data: isAdmin, error } = await supabase.rpc("is_admin", { p_email: email });
  if (error || !isAdmin) {
    redirect("/admin/login?denied=1");
  }

  return (
    <div className="relative left-1/2 w-screen -translate-x-1/2 -my-6 min-h-[100dvh] max-w-none overflow-x-hidden">
      <AdminShell>{children}</AdminShell>
    </div>
  );
}

