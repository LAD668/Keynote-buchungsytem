import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type CardProps = HTMLAttributes<HTMLDivElement> & {
  selected?: boolean;
};

export function Card({ className = "", selected = false, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-xl border bg-card p-6 shadow-sm transition-shadow hover:shadow-md",
        selected ? "border-brand" : "border-border",
        className
      )}
      {...props}
    />
  );
}
