"use client";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { Card, CardContent } from "@/components/ui/Card";
import { ParticipantPicker } from "@/components/ui/ParticipantPicker";
import {
  DocumentUploader,
  type PendingDocument,
} from "@/components/ui/DocumentUploader";
import { useAuth } from "@/contexts/AuthContext";
import { store } from "@/lib/store";
import { REMINDER_OPTIONS } from "@/lib/meeting-status";
import { generateId } from "@/lib/utils";
import { uploadFileToStorage } from "@/lib/upload";
import type { Meeting, MeetingType, MeetingStatus, AppUser } from "@/types";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

function toLocalInput(iso?: string) {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function MeetingForm({
  meeting,
  mode,
}: {
  meeting?: Meeting;
  mode: "create" | "edit";
}) {
  const { user } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<AppUser[]>([]);

  const [form, setForm] = useState({
    title: meeting?.title ?? "",
    description: meeting?.description ?? "",
    type: (meeting?.type ?? "online") as MeetingType,
    status: (meeting?.status ?? "scheduled") as MeetingStatus,
    startAt:
      toLocalInput(meeting?.startAt) ||
      toLocalInput(new Date(Date.now() + 86400000).toISOString()),
    endAt:
      toLocalInput(meeting?.endAt) ||
      toLocalInput(new Date(Date.now() + 90000000).toISOString()),
    location: meeting?.location ?? "",
    onlineLink: meeting?.onlineLink ?? "",
    platform: meeting?.platform ?? "google-meet",
    participantIds: meeting?.participantIds ?? [],
    reminderMinutes: String(meeting?.reminderMinutes?.[0] ?? 15),
  });
  const [docs, setDocs] = useState<PendingDocument[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    store.getUsers().then(setUsers);
    if (meeting) {
      store.getDocumentsByMeeting(meeting.id).then(setDocs);
    }
  }, [meeting]);

  const set = (key: string, value: string | string[]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSubmitting(true);
    try {
      const participants = users.filter((u) =>
        form.participantIds.includes(u.id)
      );
      const reminder = parseInt(form.reminderMinutes, 10) || 15;
      const meetingId = meeting?.id ?? generateId("mtg");

      const payload: Meeting = {
        id: meetingId,
        title: form.title,
        description: form.description,
        type: form.type,
        status: form.status,
        startAt: new Date(form.startAt).toISOString(),
        endAt: new Date(form.endAt).toISOString(),
        location: form.type !== "online" ? form.location : undefined,
        onlineLink: form.type !== "onsite" ? form.onlineLink : undefined,
        platform:
          form.type !== "onsite"
            ? (form.platform as Meeting["platform"])
            : undefined,
        organizerId: meeting?.organizerId ?? user.id,
        organizerName: meeting?.organizerName ?? user.displayName,
        participantIds: form.participantIds,
        participantEmails: participants.map((p) => p.email),
        reminderMinutes: [reminder],
        createdAt: meeting?.createdAt ?? new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await store.upsertMeeting(payload);

      for (const d of docs) {
        let downloadUrl = d.downloadUrl;
        let storagePath = d.storagePath;
        if (d.file) {
          storagePath = `meetings/${meetingId}/${d.id}_${d.file.name}`;
          downloadUrl = await uploadFileToStorage(d.file, storagePath);
        }
        await store.upsertDocument({
          id: d.id,
          name: d.name,
          category: d.category,
          mimeType: d.mimeType,
          size: d.size,
          meetingId,
          uploadedBy: d.uploadedBy,
          uploadedByName: d.uploadedByName,
          downloadUrl,
          createdAt: d.createdAt,
          updatedAt: new Date().toISOString(),
        });
      }

      await Promise.all(
        participants.map((p) =>
          store.upsertNotification({
            id: generateId("ntf"),
            userId: p.id,
            type: mode === "create" ? "meeting_invite" : "schedule_change",
            title: mode === "create" ? "คำเชิญประชุม" : "แก้ไขกำหนดการ",
            message:
              mode === "create"
                ? `คุณได้รับเชิญเข้าร่วม: ${payload.title}`
                : `กำหนดการ "${payload.title}" มีการเปลี่ยนแปลง`,
            link: `/meetings/${payload.id}`,
            read: false,
            createdAt: new Date().toISOString(),
          })
        )
      );

      toast.success(
        mode === "create" ? "สร้างการประชุมสำเร็จ" : "บันทึกการเปลี่ยนแปลงแล้ว"
      );
      router.push(`/meetings/${payload.id}`);
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardContent className="space-y-4">
          <Input
            id="title"
            label="หัวข้อการประชุม *"
            value={form.title}
            onChange={(e) => set("title", e.target.value)}
            required
          />
          <Textarea
            id="description"
            label="รายละเอียด"
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Select
              id="type"
              label="ประเภท"
              value={form.type}
              onChange={(e) => set("type", e.target.value)}
              options={[
                { value: "online", label: "ออนไลน์" },
                { value: "onsite", label: "สถานที่" },
                { value: "hybrid", label: "ไฮบริด" },
              ]}
            />
            <Select
              id="status"
              label="สถานะ"
              value={form.status}
              onChange={(e) => set("status", e.target.value)}
              options={[
                { value: "scheduled", label: "กำหนดการ" },
                { value: "ongoing", label: "กำลังประชุม" },
                { value: "completed", label: "เสร็จสิ้น" },
                { value: "cancelled", label: "ยกเลิก" },
              ]}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              id="startAt"
              label="วัน-เวลาเริ่ม *"
              type="datetime-local"
              value={form.startAt}
              onChange={(e) => set("startAt", e.target.value)}
              required
            />
            <Input
              id="endAt"
              label="วัน-เวลาสิ้นสุด *"
              type="datetime-local"
              value={form.endAt}
              onChange={(e) => set("endAt", e.target.value)}
              required
            />
          </div>
          {form.type !== "online" && (
            <Input
              id="location"
              label="สถานที่"
              value={form.location}
              onChange={(e) => set("location", e.target.value)}
              placeholder="ห้องประชุม A ชั้น 5"
            />
          )}
          {form.type !== "onsite" && (
            <div className="grid gap-4 sm:grid-cols-2">
              <Select
                id="platform"
                label="แพลตฟอร์ม"
                value={form.platform}
                onChange={(e) => set("platform", e.target.value)}
                options={[
                  { value: "google-meet", label: "Google Meet" },
                  { value: "zoom", label: "Zoom" },
                  { value: "microsoft-teams", label: "Microsoft Teams" },
                  { value: "other", label: "อื่นๆ" },
                ]}
              />
              <Input
                id="onlineLink"
                label="ลิงก์ประชุมออนไลน์"
                value={form.onlineLink}
                onChange={(e) => set("onlineLink", e.target.value)}
                placeholder="https://meet.google.com/..."
              />
            </div>
          )}
          <Select
            id="reminders"
            label="แจ้งเตือนก่อนประชุม"
            value={form.reminderMinutes}
            onChange={(e) => set("reminderMinutes", e.target.value)}
            options={REMINDER_OPTIONS}
          />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-6">
          <ParticipantPicker
            users={users}
            selectedIds={form.participantIds}
            excludeIds={user ? [user.id] : []}
            onChange={(ids) => set("participantIds", ids)}
          />
          {user && (
            <DocumentUploader
              files={docs}
              onChange={setDocs}
              uploadedBy={user.id}
              uploadedByName={user.displayName}
              meetingId={meeting?.id}
            />
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          ยกเลิก
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting
            ? "กำลังบันทึก..."
            : mode === "create"
              ? "สร้างการประชุม"
              : "บันทึกการแก้ไข"}
        </Button>
      </div>
    </form>
  );
}
