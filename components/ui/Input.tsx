import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  helperText?: string;
  error?: string;
};

export function Input({ className = "", label, helperText, error, id, ...props }: InputProps) {
  return (
    <div className="space-y-1.5">
      {label ? (
        <label htmlFor={id} className="block text-sm font-medium text-text-primary">
          {label}
        </label>
      ) : null}
      <input
        id={id}
        className={cn(
          "w-full rounded-md border bg-card px-3 py-2 text-sm text-text-primary shadow-sm outline-none transition-colors placeholder:text-text-secondary/70 focus:ring-2 focus:ring-brand/20",
          error ? "border-error focus:border-error" : "border-border focus:border-brand",
          className
        )}
        {...props}
      />
      {error ? (
        <p className="text-sm text-error">{error}</p>
      ) : helperText ? (
        <p className="text-sm text-text-secondary">{helperText}</p>
      ) : null}
    </div>
  );
}
