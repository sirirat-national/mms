import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

const variants = {
  blue: "bg-brand-50 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300",
  green: "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  yellow: "bg-amber-50 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  red: "bg-red-50 text-red-700 dark:bg-red-900/40 dark:text-red-300",
  gray: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
  purple: "bg-violet-50 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300",
};

export function Badge({
  children,
  variant = "blue",
  className,
}: {
  children: ReactNode;
  variant?: keyof typeof variants;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium",
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
