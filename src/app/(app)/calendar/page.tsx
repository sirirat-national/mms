"use client";

import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { store } from "@/lib/store";
import { syncAllMeetingStatuses } from "@/lib/meeting-status";
import { cn, formatDateTime, statusLabels } from "@/lib/utils";
import type { Meeting } from "@/types";
import {
  addDays,
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  startOfMonth,
  startOfWeek,
  subMonths,
  parseISO,
} from "date-fns";
import { th } from "date-fns/locale";
import {
  ChevronLeft,
  ChevronRight,
  Bell,
  MapPin,
  Video,
  Clock,
  ExternalLink,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type ViewMode = "month" | "week" | "day";

export default function CalendarPage() {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [current, setCurrent] = useState(new Date());
  const [view, setView] = useState<ViewMode>("month");
  const [selected, setSelected] = useState(new Date());
  const [modalMeeting, setModalMeeting] = useState<Meeting | null>(null);

  useEffect(() => {
    (async () => {
      await syncAllMeetingStatuses();
      const list = await store.getMeetings();
      setMeetings(list.filter((m) => m.status !== "cancelled"));
    })();
  }, []);

  const days = useMemo(() => {
    if (view === "day") return [selected];
    if (view === "week") {
      const start = startOfWeek(selected, { weekStartsOn: 1 });
      return eachDayOfInterval({
        start,
        end: endOfWeek(selected, { weekStartsOn: 1 }),
      });
    }
    const start = startOfWeek(startOfMonth(current), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(current), { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, [current, selected, view]);

  const meetingsOn = (day: Date) =>
    meetings.filter((m) => isSameDay(parseISO(m.startAt), day));

  const selectedMeetings = meetingsOn(selected);

  const navigate = (dir: -1 | 1) => {
    if (view === "month")
      setCurrent(dir === 1 ? addMonths(current, 1) : subMonths(current, 1));
    else if (view === "week") {
      const next = addDays(selected, dir * 7);
      setSelected(next);
      setCurrent(next);
    } else {
      const next = addDays(selected, dir);
      setSelected(next);
      setCurrent(next);
    }
  };

  const title =
    view === "day"
      ? format(selected, "d MMMM yyyy", { locale: th })
      : view === "week"
        ? `สัปดาห์ ${format(days[0], "d MMM", { locale: th })} – ${format(days[6], "d MMM yyyy", { locale: th })}`
        : format(current, "MMMM yyyy", { locale: th });

  const openMeeting = (m: Meeting, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setModalMeeting(m);
  };

  return (
    <div>
      <PageHeader
        title="ปฏิทินนัดหมาย"
        description="ดูตารางประชุมรายวัน รายสัปดาห์ และรายเดือน — คลิกการประชุมเพื่อดูรายละเอียด"
      />

      <Card className="mb-4">
        <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => navigate(-1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <h2 className="min-w-[180px] text-center text-base font-semibold capitalize text-slate-900 dark:text-white">
              {title}
            </h2>
            <Button variant="outline" size="sm" onClick={() => navigate(1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                const today = new Date();
                setCurrent(today);
                setSelected(today);
              }}
            >
              วันนี้
            </Button>
          </div>
          <div className="flex rounded-lg border border-slate-200 p-1 dark:border-slate-700">
            {(["month", "week", "day"] as ViewMode[]).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={cn(
                  "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                  view === v
                    ? "bg-brand-600 text-white"
                    : "text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"
                )}
              >
                {v === "month" ? "เดือน" : v === "week" ? "สัปดาห์" : "วัน"}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardContent className="!p-2 sm:!p-4">
            {view !== "day" && (
              <div className="mb-2 grid grid-cols-7 gap-1">
                {["จ", "อ", "พ", "พฤ", "ศ", "ส", "อา"].map((d) => (
                  <div
                    key={d}
                    className="py-2 text-center text-xs font-semibold text-slate-400"
                  >
                    {d}
                  </div>
                ))}
              </div>
            )}
            <div
              className={cn(
                "grid gap-1",
                view === "day" ? "grid-cols-1" : "grid-cols-7"
              )}
            >
              {days.map((day) => {
                const mtgs = meetingsOn(day);
                const isSelected = isSameDay(day, selected);
                const inMonth = isSameMonth(day, current);
                return (
                  <button
                    key={day.toISOString()}
                    type="button"
                    onClick={() => setSelected(day)}
                    className={cn(
                      "min-h-[80px] rounded-lg border p-2 text-left transition-colors sm:min-h-[100px]",
                      isSelected
                        ? "border-brand-500 bg-brand-50 dark:bg-brand-900/30"
                        : "border-transparent hover:bg-slate-50 dark:hover:bg-slate-800/50",
                      view === "month" && !inMonth && "opacity-40",
                      view === "day" && "min-h-[200px]"
                    )}
                  >
                    <span
                      className={cn(
                        "inline-flex h-7 w-7 items-center justify-center rounded-full text-sm font-medium",
                        isSameDay(day, new Date()) && "bg-brand-600 text-white",
                        isSelected &&
                          !isSameDay(day, new Date()) &&
                          "bg-brand-100 text-brand-700 dark:bg-brand-800 dark:text-brand-200"
                      )}
                    >
                      {format(day, "d")}
                    </span>
                    <div className="mt-1 space-y-0.5">
                      {mtgs.slice(0, view === "day" ? 10 : 2).map((m) => (
                        <div
                          key={m.id}
                          role="button"
                          tabIndex={0}
                          onClick={(e) => openMeeting(m, e)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") openMeeting(m);
                          }}
                          className="cursor-pointer truncate rounded bg-brand-100 px-1.5 py-0.5 text-[10px] font-medium text-brand-800 hover:bg-brand-200 dark:bg-brand-900/60 dark:text-brand-200 dark:hover:bg-brand-800"
                        >
                          {format(parseISO(m.startAt), "HH:mm")} {m.title}
                        </div>
                      ))}
                      {mtgs.length > (view === "day" ? 10 : 2) && (
                        <p className="text-[10px] text-slate-400">
                          +{mtgs.length - 2} อื่นๆ
                        </p>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>
                {format(selected, "d MMMM yyyy", { locale: th })}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 !pt-0">
              {selectedMeetings.length === 0 ? (
                <p className="py-8 text-center text-sm text-slate-400">
                  ไม่มีการประชุมในวันนี้
                </p>
              ) : (
                selectedMeetings.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => openMeeting(m)}
                    className="block w-full rounded-xl border border-slate-100 p-3 text-left hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/50"
                  >
                    <p className="font-medium text-slate-900 dark:text-white">
                      {m.title}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {formatDateTime(m.startAt)}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1">
                      <Badge variant="blue">
                        {m.type === "online"
                          ? "ออนไลน์"
                          : m.type === "hybrid"
                            ? "ไฮบริด"
                            : "สถานที่"}
                      </Badge>
                      <Badge
                        variant={
                          m.status === "ongoing"
                            ? "green"
                            : m.status === "completed"
                              ? "gray"
                              : "yellow"
                        }
                      >
                        {statusLabels[m.status]}
                      </Badge>
                    </div>
                  </button>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-900/40">
                <Bell className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">
                  การแจ้งเตือนก่อนประชุม
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  เลือกได้ 5 / 10 / 15 / 20 / 30 นาทีก่อนเริ่มประชุม
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Modal
        open={!!modalMeeting}
        onClose={() => setModalMeeting(null)}
        title={modalMeeting?.title ?? ""}
        size="lg"
      >
        {modalMeeting && (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Badge
                variant={
                  modalMeeting.status === "ongoing"
                    ? "green"
                    : modalMeeting.status === "completed"
                      ? "gray"
                      : "blue"
                }
              >
                {statusLabels[modalMeeting.status]}
              </Badge>
              <Badge variant="purple">
                {modalMeeting.type === "online"
                  ? "ออนไลน์"
                  : modalMeeting.type === "hybrid"
                    ? "ไฮบริด"
                    : "สถานที่"}
              </Badge>
            </div>

            <p className="text-sm text-slate-600 dark:text-slate-300">
              {modalMeeting.description || "ไม่มีรายละเอียด"}
            </p>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="flex gap-2 rounded-lg bg-slate-50 p-3 dark:bg-slate-800/50">
                <Clock className="h-4 w-4 shrink-0 text-brand-600" />
                <div className="text-sm">
                  <p className="text-xs text-slate-500">เวลา</p>
                  <p>{formatDateTime(modalMeeting.startAt)}</p>
                  <p className="text-slate-500">
                    ถึง {formatDateTime(modalMeeting.endAt)}
                  </p>
                </div>
              </div>
              {modalMeeting.location && (
                <div className="flex gap-2 rounded-lg bg-slate-50 p-3 dark:bg-slate-800/50">
                  <MapPin className="h-4 w-4 shrink-0 text-brand-600" />
                  <div className="text-sm">
                    <p className="text-xs text-slate-500">สถานที่</p>
                    <p>{modalMeeting.location}</p>
                  </div>
                </div>
              )}
              {modalMeeting.onlineLink && (
                <div className="flex gap-2 rounded-lg bg-slate-50 p-3 dark:bg-slate-800/50 sm:col-span-2">
                  <Video className="h-4 w-4 shrink-0 text-brand-600" />
                  <div className="min-w-0 text-sm">
                    <p className="text-xs text-slate-500">ลิงก์ออนไลน์</p>
                    <a
                      href={modalMeeting.onlineLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 truncate text-brand-600 hover:underline"
                    >
                      {modalMeeting.onlineLink}
                      <ExternalLink className="h-3 w-3 shrink-0" />
                    </a>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Users className="h-4 w-4" />
              ผู้เข้าร่วม {modalMeeting.participantIds.length} คน · จัดโดย{" "}
              {modalMeeting.organizerName}
            </div>

            <div className="flex flex-wrap justify-end gap-2 border-t border-slate-100 pt-4 dark:border-slate-800">
              <Button variant="outline" onClick={() => setModalMeeting(null)}>
                ปิด
              </Button>
              <Link href={`/meetings/${modalMeeting.id}`}>
                <Button>ดูรายละเอียดเต็ม</Button>
              </Link>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
