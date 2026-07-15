"use client";

import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { store } from "@/lib/store";
import {
  markMeetingOngoing,
  resolveMeetingStatus,
} from "@/lib/meeting-status";
import {
  formatDateTime,
  formatFileSize,
  statusLabels,
  roleLabels,
} from "@/lib/utils";
import type { Meeting, AppUser, CloudDocument } from "@/types";
import {
  Pencil,
  Trash2,
  MapPin,
  Video,
  Users,
  Clock,
  ExternalLink,
  ClipboardList,
  FileText,
  Download,
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";

export default function MeetingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [participants, setParticipants] = useState<AppUser[]>([]);
  const [docs, setDocs] = useState<CloudDocument[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const m = await store.getMeeting(params.id as string);
    if (!m) {
      router.replace("/meetings");
      return;
    }
    const syncedStatus = resolveMeetingStatus(m);
    const synced =
      syncedStatus !== m.status
        ? { ...m, status: syncedStatus, updatedAt: new Date().toISOString() }
        : m;
    if (syncedStatus !== m.status) await store.upsertMeeting(synced);
    setMeeting(synced);
    const allUsers = await store.getUsers();
    setParticipants(
      allUsers.filter((u) => synced.participantIds.includes(u.id))
    );
    setDocs(await store.getDocumentsByMeeting(synced.id));
  }, [params.id, router]);

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, [load]);

  if (loading || !meeting) {
    return (
      <div className="flex justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-200 border-t-brand-600" />
      </div>
    );
  }

  const handleDelete = async () => {
    if (!confirm(`ลบการประชุม "${meeting.title}" หรือไม่?`)) return;
    await store.deleteMeeting(meeting.id);
    toast.success("ลบแล้ว");
    router.push("/meetings");
  };

  const handleJoinLink = async () => {
    if (!meeting.onlineLink) return;
    const updated = await markMeetingOngoing(meeting.id);
    if (updated) setMeeting(updated);
    toast.success("เปลี่ยนสถานะเป็นกำลังประชุม");
    window.open(meeting.onlineLink, "_blank", "noopener,noreferrer");
  };

  return (
    <div>
      <PageHeader
        title={meeting.title}
        description={meeting.description}
        backHref="/meetings"
        showBack
        action={
          <div className="flex flex-wrap gap-2">
            <Link href={`/minutes/new?meetingId=${meeting.id}`}>
              <Button variant="outline">
                <ClipboardList className="h-4 w-4" />
                บันทึกรายงาน / เสร็จสิ้น
              </Button>
            </Link>
            <Link href={`/meetings/${meeting.id}/edit`}>
              <Button variant="secondary">
                <Pencil className="h-4 w-4" />
                แก้ไข
              </Button>
            </Link>
            <Button variant="danger" onClick={handleDelete}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>รายละเอียด</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <Badge
                  variant={
                    meeting.status === "cancelled"
                      ? "red"
                      : meeting.status === "completed"
                        ? "gray"
                        : meeting.status === "ongoing"
                          ? "green"
                          : "blue"
                  }
                >
                  {statusLabels[meeting.status]}
                </Badge>
                <Badge variant="purple">
                  {meeting.type === "online"
                    ? "ออนไลน์"
                    : meeting.type === "hybrid"
                      ? "ไฮบริด"
                      : "สถานที่"}
                </Badge>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex gap-3 rounded-xl bg-slate-50 p-4 dark:bg-slate-800/50">
                  <Clock className="h-5 w-5 text-brand-600" />
                  <div>
                    <p className="text-xs text-slate-500">เริ่ม</p>
                    <p className="text-sm font-medium">
                      {formatDateTime(meeting.startAt)}
                    </p>
                    <p className="mt-2 text-xs text-slate-500">สิ้นสุด</p>
                    <p className="text-sm font-medium">
                      {formatDateTime(meeting.endAt)}
                    </p>
                  </div>
                </div>

                {meeting.location && (
                  <div className="flex gap-3 rounded-xl bg-slate-50 p-4 dark:bg-slate-800/50">
                    <MapPin className="h-5 w-5 text-brand-600" />
                    <div>
                      <p className="text-xs text-slate-500">สถานที่</p>
                      <p className="text-sm font-medium">{meeting.location}</p>
                    </div>
                  </div>
                )}

                {meeting.onlineLink && (
                  <div className="flex gap-3 rounded-xl bg-slate-50 p-4 dark:bg-slate-800/50 sm:col-span-2">
                    <Video className="h-5 w-5 text-brand-600" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-slate-500">
                        ลิงก์ออนไลน์ ({meeting.platform})
                      </p>
                      <button
                        type="button"
                        onClick={handleJoinLink}
                        className="mt-1 flex items-center gap-1 truncate text-sm font-medium text-brand-600 hover:underline"
                      >
                        {meeting.onlineLink}
                        <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <p className="text-xs text-slate-500">ผู้จัดประชุม</p>
                <p className="text-sm font-medium">{meeting.organizerName}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">แจ้งเตือนก่อนประชุม</p>
                <p className="text-sm font-medium">
                  {meeting.reminderMinutes[0] ?? 15} นาที
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                เอกสารการประชุม ({docs.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 !pt-0">
              {docs.length === 0 ? (
                <p className="py-4 text-center text-sm text-slate-400">
                  ยังไม่มีเอกสาร
                </p>
              ) : (
                docs.map((d) => (
                  <div
                    key={d.id}
                    className="flex items-center gap-3 rounded-lg border border-slate-100 p-3 dark:border-slate-800"
                  >
                    <FileText className="h-4 w-4 text-brand-600" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{d.name}</p>
                      <p className="text-xs text-slate-400">
                        {formatFileSize(d.size)}
                      </p>
                    </div>
                    {d.downloadUrl && (
                      <a href={d.downloadUrl} target="_blank" rel="noreferrer">
                        <Button variant="ghost" size="sm">
                          <Download className="h-3.5 w-3.5" />
                        </Button>
                      </a>
                    )}
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              ผู้เข้าร่วม ({participants.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 !pt-0">
            {participants.map((p) => (
              <div
                key={p.id}
                className="flex items-center gap-3 rounded-lg border border-slate-100 p-2.5 dark:border-slate-800"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-100 text-sm font-bold text-brand-700">
                  {p.displayName.charAt(0)}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{p.displayName}</p>
                  <p className="truncate text-xs text-slate-500">
                    {roleLabels[p.role]}
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
