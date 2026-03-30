"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
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
            href="/admin"
            label="Dashboard"
            active={isActive(pathname, "/admin")}
            icon={<IconDashboard active={isActive(pathname, "/admin")} />}
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
            href="/admin/feedback"
            label="Feedback"
            active={isActive(pathname, "/admin/feedback")}
            icon={<IconFeedback active={isActive(pathname, "/admin/feedback")} />}
          />
          <NavItem
            href="/admin/profile"
            label="Profil"
            active={isActive(pathname, "/admin/profile")}
            icon={<IconProfile active={isActive(pathname, "/admin/profile")} />}
          />
        </div>
      </nav>
    </div>
  );
}

function isActive(pathname: string, href: string) {
  if (href === "/admin") {
    return pathname === "/admin" || pathname === "/admin/";
  }
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
  return (
    <svg viewBox="0 0 24 24" fill="none" className={cn("h-7 w-7", active ? "text-sky-300" : "text-white/80")} aria-hidden>
      <path
        d="M4.5 12.5V6.8A2.3 2.3 0 016.8 4.5h3.7v8H4.5zM13.5 4.5h3.7a2.3 2.3 0 012.3 2.3v4.2h-6V4.5zM4.5 14h6v5.5H6.8A2.3 2.3 0 014.5 17.2V14zM13.5 12.5h6v4.7a2.3 2.3 0 01-2.3 2.3h-3.7v-7z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconWorkshops({ active }: { active: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={cn("h-7 w-7", active ? "text-sky-300" : "text-white/80")} aria-hidden>
      <path
        d="M4 5.5h6v6H4v-6zm10 0h6v6h-6v-6zM4 14.5h6v6H4v-6zm10 0h6v6h-6v-6z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconProgram({ active }: { active: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={cn("h-7 w-7", active ? "text-sky-300" : "text-white/80")} aria-hidden>
      <path
        d="M7.5 4.5v2M16.5 4.5v2M4.5 9h15M6.5 6.5h11a2 2 0 012 2v11a2 2 0 01-2 2h-11a2 2 0 01-2-2v-11a2 2 0 012-2z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconFeedback({ active }: { active: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={cn("h-7 w-7", active ? "text-sky-300" : "text-white/80")} aria-hidden>
      <path
        d="M6.5 18.5h8.8l2.7 2V7.8A2.3 2.3 0 0015.7 5.5H6.5A2.3 2.3 0 004.2 7.8v8.4a2.3 2.3 0 002.3 2.3z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
      <path d="M7.5 9h7M7.5 12h6" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  );
}

function IconProfile({ active }: { active: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={cn("h-7 w-7", active ? "text-sky-300" : "text-white/80")} aria-hidden>
      <path d="M12 12a4 4 0 100-8 4 4 0 000 8z" stroke="currentColor" strokeWidth="1.75" />
      <path
        d="M4.5 20.2c1.8-4 5.1-6.2 7.5-6.2s5.7 2.2 7.5 6.2"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  );
}

