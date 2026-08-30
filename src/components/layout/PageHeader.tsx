import { BackButton } from "@/components/ui/BackButton";
import type { ReactNode } from "react";

export function PageHeader({
  title,
  description,
  action,
  backHref,
  showBack = false,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  backHref?: string;
  showBack?: boolean;
}) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div>
        {(showBack || backHref) && <BackButton href={backHref} />}
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          {title}
        </h1>
        {description && (
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {description}
          </p>
        )}
      </div>
      {action && <div className="flex shrink-0 items-center gap-2">{action}</div>}
    </div>
  );
}
