"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Cloud documents menu removed — uploads live in meetings / minutes. */
export default function DocumentsRedirectPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/minutes");
  }, [router]);

  return (
    <div className="flex justify-center py-20 text-sm text-slate-500">
      กำลังเปลี่ยนไปหน้ารายงานการประชุม...
    </div>
  );
}
