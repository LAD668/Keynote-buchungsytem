"use client";

import { ReactNode, useEffect } from "react";
import { cn } from "@/lib/utils";

export function Dialog({
  open,
  onOpenChange,
  children,
}: {
  open: boolean;
  onOpenChange: (next: boolean) => void;
  children: ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onOpenChange(false);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onOpenChange]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true">
      <button
        type="button"
        className="absolute inset-0 cursor-default bg-black/60 backdrop-blur-sm"
        onClick={() => onOpenChange(false)}
        aria-label="Close dialog"
      />
      <div className="absolute inset-0 flex items-end justify-center p-4 sm:items-center">
        {children}
      </div>
    </div>
  );
}

export function DialogContent({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div
      className={cn(
        "w-full max-w-lg overflow-hidden rounded-2xl border border-white/15 bg-[#0f172a]/90 shadow-[0_20px_80px_rgba(0,0,0,0.55)] backdrop-blur-md",
        className
      )}
    >
      {children}
    </div>
  );
}

export function DialogHeader({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn("border-b border-white/10 px-5 py-4", className)}>{children}</div>;
}

export function DialogTitle({ className, children }: { className?: string; children: ReactNode }) {
  return <h2 className={cn("text-base font-semibold text-white", className)}>{children}</h2>;
}

export function DialogBody({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn("p-5", className)}>{children}</div>;
}

export function DialogFooter({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn("border-t border-white/10 px-5 py-4", className)}>{children}</div>;
}

