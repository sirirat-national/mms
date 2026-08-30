"use client";

import { Button } from "@/components/ui/Button";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

export function BackButton({
  href,
  label = "กลับ",
}: {
  href?: string;
  label?: string;
}) {
  const router = useRouter();

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className="-ml-2 mb-1 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
      onClick={() => (href ? router.push(href) : router.back())}
    >
      <ArrowLeft className="h-4 w-4" />
      {label}
    </Button>
  );
}
