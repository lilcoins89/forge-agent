import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const variants = {
  default: "bg-primary text-primary-fg hover:opacity-90",
  secondary:
    "bg-raised text-fg shadow-[var(--shadow-border)] hover:shadow-[var(--shadow-border-hover)]",
  ghost: "bg-transparent text-muted hover:bg-raised hover:text-fg",
  outline: "bg-transparent text-fg shadow-[var(--shadow-border)] hover:bg-raised",
  danger: "bg-danger/15 text-danger hover:bg-danger/25",
} as const;

const sizes = {
  default: "h-11 rounded-md px-4 text-sm",
  sm: "h-9 rounded-sm px-3 text-sm",
  icon: "size-11 rounded-md",
  "icon-sm": "size-9 rounded-sm",
} as const;

export function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
}) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium transition-[opacity,transform] duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 disabled:pointer-events-none disabled:opacity-40 active:not-disabled:scale-[0.96] [&_svg]:size-4",
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    />
  );
}
