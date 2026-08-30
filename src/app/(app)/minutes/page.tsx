"use client";

import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card, CardContent } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Pagination, usePagedItems } from "@/components/ui/Pagination";
import { exportMinuteToPdf } from "@/lib/export";
import { store } from "@/lib/store";
import { formatDateTime } from "@/lib/utils";
import type { MeetingMinute } from "@/types";
import { ClipboardList, Plus, FileDown, Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

const PAGE_SIZE = 5;

export default function MinutesPage() {
  const [minutes, setMinutes] = useState<MeetingMinute[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    setMinutes(await store.getMinutes());
  };

  useEffect(() => {
    refresh().finally(() => setLoading(false));
  }, []);

  const { paged, totalPages, safePage, total } = usePagedItems(
    minutes,
    page,
    PAGE_SIZE
  );

  const handleExport = async (m: MeetingMinute) => {
    try {
      await exportMinuteToPdf(m);
      toast.success("ส่งออก PDF สำเร็จ");
    } catch {
      toast.error("ส่งออกไม่สำเร็จ");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("ลบรายงานนี้หรือไม่?")) return;
    await store.deleteMinute(id);
    await refresh();
    toast.success("ลบแล้ว");
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-200 border-t-brand-600" />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="รายงานการประชุม"
        description="บันทึกรายละเอียด มติ ผู้เข้าร่วม อัปโหลดเอกสาร และส่งออก PDF"
        action={
          <Link href="/minutes/new">
            <Button>
              <Plus className="h-4 w-4" />
              บันทึกรายงานใหม่
            </Button>
          </Link>
        }
      />

      {minutes.length === 0 ? (
        <Card>
          <EmptyState
            icon={ClipboardList}
            title="ยังไม่มีรายงานการประชุม"
            action={
              <Link href="/minutes/new">
                <Button>
                  <Plus className="h-4 w-4" />
                  สร้างรายงาน
                </Button>
              </Link>
            }
          />
        </Card>
      ) : (
        <>
          <div className="space-y-4">
            {paged.map((m) => (
              <Card key={m.id}>
                <CardContent>
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                          {m.meetingTitle}
                        </h3>
                        <Badge variant="blue">{m.resolutions.length} มติ</Badge>
                      </div>
                      <p className="mt-2 line-clamp-2 text-sm text-slate-500">
                        {m.content}
                      </p>
                      <div className="mt-3 flex flex-wrap gap-3 text-xs text-slate-400">
                        <span>ผู้เข้าร่วม {m.attendees.length} คน</span>
                        <span>บันทึกโดย {m.recordedByName}</span>
                        <span>{formatDateTime(m.createdAt)}</span>
                      </div>
                      {m.resolutions.length > 0 && (
                        <ul className="mt-3 space-y-1">
                          {m.resolutions.slice(0, 3).map((r, i) => (
                            <li
                              key={i}
                              className="text-sm text-slate-600 dark:text-slate-300"
                            >
                              <span className="mr-2 font-medium text-brand-600">
                                {i + 1}.
                              </span>
                              {r}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                    <div className="flex shrink-0 gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleExport(m)}
                      >
                        <FileDown className="h-3.5 w-3.5" />
                        PDF
                      </Button>
                      <Link href={`/minutes/${m.id}/edit`}>
                        <Button variant="ghost" size="sm">
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600"
                        onClick={() => handleDelete(m.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          <Pagination
            page={safePage}
            totalPages={totalPages}
            total={total}
            pageSize={PAGE_SIZE}
            onChange={setPage}
          />
        </>
      )}
    </div>
  );
}
