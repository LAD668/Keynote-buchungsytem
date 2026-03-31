"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AlignEndHorizontal, Brain, CalendarFold, Cog } from "lucide-react";
import { HeroBackground } from "@/components/booking/HeroBackground";
import { cn } from "@/lib/utils";

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="relative min-h-[100dvh] overflow-hidden bg-[#0f172a]">
      <HeroBackground />

      <div className="pointer-events-none absolute right-4 top-4 z-20 sm:right-6 sm:top-6">
        <div className="pointer-events-auto">
          <Image
            src="/dank-symposium-logo.png"
            alt="Dänk Symposium"
            width={800}
            height={266}
            className="h-9 w-auto max-w-[120px] select-none brightness-0 invert opacity-95 sm:h-10 sm:max-w-[140px]"
            priority
          />
        </div>
      </div>

      <div className="relative z-10 min-h-[100dvh] px-4 pb-[calc(7rem+env(safe-area-inset-bottom))] pt-14 sm:px-6 sm:pb-[calc(8rem+env(safe-area-inset-bottom))] sm:pt-16">
        {children}
      </div>

      <nav
        className="fixed inset-x-0 bottom-0 z-30 border-t border-white/10 bg-[#152a45]/95 shadow-[0_-12px_40px_rgba(0,0,0,0.35)] backdrop-blur-md pb-[env(safe-area-inset-bottom)]"
        aria-label="Admin Navigation"
      >
        <div className="mx-auto flex h-[72px] max-w-xl items-stretch justify-around gap-2 px-3 py-3">
          <NavItem
            href="/admin/dashboard"
            label="Dashboard"
            active={isActive(pathname, "/admin/dashboard")}
            icon={<IconDashboard active={isActive(pathname, "/admin/dashboard")} />}
          />
          <NavItem
            href="/admin/workshops"
            label="Workshops"
            active={isActive(pathname, "/admin/workshops")}
            icon={<IconWorkshops active={isActive(pathname, "/admin/workshops")} />}
          />
          <NavItem
            href="/admin/program"
            label="Program"
            active={isActive(pathname, "/admin/program")}
            icon={<IconProgram active={isActive(pathname, "/admin/program")} />}
          />
          <NavItem
            href="/admin/profile"
            label="Einstellungen"
            active={isActive(pathname, "/admin/profile")}
            icon={<IconProfile active={isActive(pathname, "/admin/profile")} />}
          />
        </div>
      </nav>
    </div>
  );
}

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

function NavItem({
  href,
  label,
  active,
  icon,
}: {
  href: string;
  label: string;
  active: boolean;
  icon: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex min-w-[70px] flex-1 flex-col items-center gap-1 rounded-xl py-2 transition-colors",
        active ? "bg-white/12 text-white" : "text-white/65 hover:bg-white/5 hover:text-white/90"
      )}
    >
      <span className="flex h-8 w-8 items-center justify-center" aria-hidden>
        {icon}
      </span>
      <span className="text-[10px] font-semibold uppercase tracking-[0.12em]">{label}</span>
    </Link>
  );
}

function IconDashboard({ active }: { active: boolean }) {
  return <AlignEndHorizontal className={cn("h-6 w-6", active ? "text-sky-300" : "text-white/80")} aria-hidden="true" />;
}

function IconWorkshops({ active }: { active: boolean }) {
  return <Brain className={cn("h-6 w-6", active ? "text-sky-300" : "text-white/80")} aria-hidden="true" />;
}

function IconProgram({ active }: { active: boolean }) {
  return <CalendarFold className={cn("h-6 w-6", active ? "text-sky-300" : "text-white/80")} aria-hidden="true" />;
}

function IconProfile({ active }: { active: boolean }) {
  return <Cog className={cn("h-6 w-6", active ? "text-sky-300" : "text-white/80")} aria-hidden="true" />;
}

