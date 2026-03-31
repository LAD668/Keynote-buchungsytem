import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type BadgeVariant = "default" | "success" | "warning" | "muted" | "danger";

type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  variant?: BadgeVariant;
};

const variantStyles: Record<BadgeVariant, string> = {
  default: "bg-brand/10 text-brand",
  success: "bg-success/10 text-success",
  warning: "bg-amber-100 text-amber-700",
  muted: "bg-slate-100 text-slate-600",
  danger: "bg-rose-100 text-rose-700",
};

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium",
        variantStyles[variant],
        className
      )}
      {...props}
    />
  );
}
