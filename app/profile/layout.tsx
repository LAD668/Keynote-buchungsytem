import { RequireTicket } from "@/components/auth/RequireTicket";
import { BookingShell } from "@/components/booking/BookingShell";

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequireTicket>
      <div className="relative left-1/2 w-screen -translate-x-1/2 -my-6 min-h-[100dvh] max-w-none overflow-x-hidden">
        <BookingShell>{children}</BookingShell>
      </div>
    </RequireTicket>
  );
}

