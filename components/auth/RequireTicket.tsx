"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export function RequireTicket({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    const id = window.localStorage.getItem("ticket_id");
    if (!id) {
      router.replace("/login");
      return;
    }
    setAllowed(true);
  }, [router]);

  if (!allowed) {
    return (
      <div
        className="flex min-h-[100dvh] items-center justify-center bg-[#0f172a] px-6 text-sm text-white/70"
        role="status"
      >
        …
      </div>
    );
  }

  return <>{children}</>;
}
