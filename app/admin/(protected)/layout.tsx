import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AdminShell } from "@/components/admin/AdminShell";

export default function AdminProtectedLayout({ children }: { children: React.ReactNode }) {
  const isAuthenticated = cookies().get("admin_auth")?.value === "1";

  if (!isAuthenticated) {
    redirect("/admin/login");
  }

  return (
    <div className="relative left-1/2 w-screen -translate-x-1/2 -my-6 min-h-[100dvh] max-w-none overflow-x-hidden">
      <AdminShell>{children}</AdminShell>
    </div>
  );
}

