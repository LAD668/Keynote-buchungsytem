# UI component template (recommended shape)

Use as a reference when adding `components/ui/*`.

## Component goals
- Single responsibility
- Variant-driven styling (props), not copy/pasted class strings
- Accessible by default
- Exported prop types

## Skeleton (example)

```tsx
import * as React from "react";

import { cn } from "@/lib/utils";

export type ExampleProps = React.ComponentPropsWithoutRef<"button"> & {
  intent?: "primary" | "secondary" | "danger";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
};

export function Example({
  className,
  intent = "primary",
  size = "md",
  isLoading = false,
  disabled,
  children,
  ...props
}: ExampleProps) {
  const isDisabled = disabled || isLoading;

  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-md font-medium transition",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
        intent === "primary" && "bg-black text-white hover:bg-black/90",
        intent === "secondary" && "bg-white text-black ring-1 ring-black/10 hover:bg-black/5",
        intent === "danger" && "bg-red-600 text-white hover:bg-red-700",
        size === "sm" && "h-9 px-3 text-sm",
        size === "md" && "h-10 px-4 text-sm",
        size === "lg" && "h-11 px-5 text-base",
        isDisabled && "opacity-60 pointer-events-none",
        className,
      )}
      disabled={isDisabled}
      aria-busy={isLoading || undefined}
      {...props}
    >
      {children}
    </button>
  );
}
```
