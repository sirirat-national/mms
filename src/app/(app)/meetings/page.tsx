"use client";

import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card, CardContent } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Pagination, usePagedItems } from "@/components/ui/Pagination";
import { store } from "@/lib/store";
import { syncAllMeetingStatuses } from "@/lib/meeting-status";
import {
  formatDateTime,
  statusLabels,
  getMeetingTimeState,
} from "@/lib/utils";
import type { Meeting, MeetingStatus } from "@/types";
import {
  Calendar,
  Plus,
  MapPin,
  Video,
  Users,
  Search,
  Trash2,
  Pencil,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";

const PAGE_SIZE = 5;

const statusVariant: Record<MeetingStatus, "blue" | "green" | "gray" | "red"> =
  {
    scheduled: "blue",
    ongoing: "green",
    completed: "gray",
    cancelled: "red",
  };

export default function MeetingsPage() {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    const list = await syncAllMeetingStatuses();
    setMeetings(list);
  };

  useEffect(() => {
    refresh().finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    return meetings.filter((m) => {
      const matchQ =
        !q ||
        m.title.toLowerCase().includes(q.toLowerCase()) ||
        m.description.toLowerCase().includes(q.toLowerCase());
      const matchStatus = statusFilter === "all" || m.status === statusFilter;
      const matchType = typeFilter === "all" || m.type === typeFilter;
      return matchQ && matchStatus && matchType;
    });
  }, [meetings, q, statusFilter, typeFilter]);

  const { paged, totalPages, safePage, total } = usePagedItems(
    filtered,
    page,
    PAGE_SIZE
  );

  useEffect(() => {
    setPage(1);
  }, [q, statusFilter, typeFilter]);

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`ต้องการลบการประชุม "${title}" หรือไม่?`)) return;
    await store.deleteMeeting(id);
    await refresh();
    toast.success("ลบการประชุมแล้ว");
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
        title="จัดการการประชุม"
        description="สร้าง แก้ไข และจัดการนัดหมายประชุมทั้งหมด"
        action={
          <Link href="/meetings/new">
            <Button>
              <Plus className="h-4 w-4" />
              สร้างการประชุม
            </Button>
          </Link>
        }
      />

      <Card className="mb-4">
        <CardContent className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              className="pl-10"
              placeholder="ค้นหาการประชุม..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            options={[
              { value: "all", label: "ทุกสถานะ" },
              { value: "scheduled", label: "กำหนดการ" },
              { value: "ongoing", label: "กำลังประชุม" },
              { value: "completed", label: "เสร็จสิ้น" },
              { value: "cancelled", label: "ยกเลิก" },
            ]}
            className="sm:w-40"
          />
          <Select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            options={[
              { value: "all", label: "ทุกประเภท" },
              { value: "online", label: "ออนไลน์" },
              { value: "onsite", label: "สถานที่" },
              { value: "hybrid", label: "ไฮบริด" },
            ]}
            className="sm:w-40"
          />
        </CardContent>
      </Card>

      {filtered.length === 0 ? (
        <Card>
          <EmptyState
            icon={Calendar}
            title="ไม่พบการประชุม"
            description="ลองเปลี่ยนเงื่อนไขค้นหา หรือสร้างการประชุมใหม่"
            action={
              <Link href="/meetings/new">
                <Button>
                  <Plus className="h-4 w-4" />
                  สร้างการประชุม
                </Button>
              </Link>
            }
          />
        </Card>
      ) : (
        <>
          <div className="grid gap-4">
            {paged.map((m) => {
              const timeState = getMeetingTimeState(m.startAt, m.endAt);
              return (
                <Card key={m.id} className="overflow-hidden">
                  <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-900/40 dark:text-brand-300">
                      {m.type === "online" ? (
                        <Video className="h-6 w-6" />
                      ) : (
                        <MapPin className="h-6 w-6" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Link
                          href={`/meetings/${m.id}`}
                          className="truncate text-base font-semibold text-slate-900 hover:text-brand-600 dark:text-white"
                        >
                          {m.title}
                        </Link>
                        <Badge variant={statusVariant[m.status]}>
                          {statusLabels[m.status]}
                        </Badge>
                        {timeState === "upcoming" &&
                          m.status === "scheduled" && (
                            <Badge variant="yellow">กำลังจะถึง</Badge>
                          )}
                      </div>
                      <p className="mt-1 line-clamp-1 text-sm text-slate-500">
                        {m.description}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-3 text-xs text-slate-500">
                        <span>{formatDateTime(m.startAt)}</span>
                        {m.location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" /> {m.location}
                          </span>
                        )}
                        {m.onlineLink && (
                          <span className="flex items-center gap-1">
                            <Video className="h-3 w-3" /> ออนไลน์
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" /> {m.participantIds.length}{" "}
                          คน
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Link href={`/meetings/${m.id}/edit`}>
                        <Button variant="outline" size="sm">
                          <Pencil className="h-3.5 w-3.5" />
                          แก้ไข
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600"
                        onClick={() => handleDelete(m.id, m.title)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
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
