"use client";

import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { ParticipantPicker } from "@/components/ui/ParticipantPicker";
import {
  DocumentUploader,
  type PendingDocument,
} from "@/components/ui/DocumentUploader";
import { useAuth } from "@/contexts/AuthContext";
import { store } from "@/lib/store";
import { uploadFileToStorage } from "@/lib/upload";
import type { Meeting, MeetingMinute, AppUser } from "@/types";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

export default function EditMinutePage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [users, setUsers] = useState<AppUser[]>([]);
  const [existing, setExisting] = useState<MeetingMinute | null>(null);
  const [form, setForm] = useState({
    meetingId: "",
    content: "",
    resolutions: "",
    attendeeIds: [] as string[],
    absenteeIds: [] as string[],
  });
  const [docs, setDocs] = useState<PendingDocument[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    (async () => {
      const [mList, uList, minute] = await Promise.all([
        store.getMeetings(),
        store.getUsers(),
        store.getMinute(params.id as string),
      ]);
      if (!minute) {
        router.replace("/minutes");
        return;
      }
      setMeetings(mList);
      setUsers(uList);
      setExisting(minute);
      const nameToId = (names: string[]) =>
        names
          .map((n) => uList.find((u) => u.displayName === n)?.id)
          .filter(Boolean) as string[];
      setForm({
        meetingId: minute.meetingId,
        content: minute.content,
        resolutions: minute.resolutions.join("\n"),
        attendeeIds: nameToId(minute.attendees),
        absenteeIds: nameToId(minute.absentees),
      });
      const existingDocs = await store.getDocumentsByMeeting(minute.meetingId);
      setDocs(existingDocs.filter((d) => d.category === "minutes"));
    })();
  }, [params.id, router]);

  if (!existing) {
    return (
      <div className="flex justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-200 border-t-brand-600" />
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSubmitting(true);
    try {
      const meeting = await store.getMeeting(form.meetingId);
      const attendees = users
        .filter((u) => form.attendeeIds.includes(u.id))
        .map((u) => u.displayName);
      const absentees = users
        .filter((u) => form.absenteeIds.includes(u.id))
        .map((u) => u.displayName);

      await store.upsertMinute({
        ...existing,
        meetingId: form.meetingId,
        meetingTitle: meeting?.title ?? existing.meetingTitle,
        content: form.content,
        resolutions: form.resolutions
          .split("\n")
          .map((s) => s.trim())
          .filter(Boolean),
        attendees,
        absentees,
        updatedAt: new Date().toISOString(),
      });

      for (const d of docs) {
        let downloadUrl = d.downloadUrl;
        if (d.file) {
          const path = `meetings/${form.meetingId}/${d.id}_${d.file.name}`;
          downloadUrl = await uploadFileToStorage(d.file, path);
        }
        await store.upsertDocument({
          id: d.id,
          name: d.name,
          category: "minutes",
          mimeType: d.mimeType,
          size: d.size,
          meetingId: form.meetingId,
          uploadedBy: d.uploadedBy,
          uploadedByName: d.uploadedByName,
          downloadUrl,
          createdAt: d.createdAt,
          updatedAt: new Date().toISOString(),
        });
      }

      toast.success("อัปเดตรายงานแล้ว");
      router.push("/minutes");
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : "บันทึกไม่สำเร็จ");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="แก้ไขรายงานการประชุม"
        description={existing.meetingTitle}
        backHref="/minutes"
        showBack
      />
      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardContent className="space-y-4">
            <Select
              label="การประชุม *"
              value={form.meetingId}
              onChange={(e) => setForm({ ...form, meetingId: e.target.value })}
              options={meetings.map((m) => ({ value: m.id, label: m.title }))}
            />
            <Textarea
              label="รายละเอียด *"
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
              required
            />
            <Textarea
              label="มติที่ประชุม"
              value={form.resolutions}
              onChange={(e) =>
                setForm({ ...form, resolutions: e.target.value })
              }
            />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-6">
            <ParticipantPicker
              label="ผู้เข้าร่วม"
              users={users}
              selectedIds={form.attendeeIds}
              onChange={(ids) =>
                setForm({
                  ...form,
                  attendeeIds: ids,
                  absenteeIds: form.absenteeIds.filter((id) => !ids.includes(id)),
                })
              }
            />
            <ParticipantPicker
              label="ผู้ขาดประชุม"
              users={users.filter((u) => !form.attendeeIds.includes(u.id))}
              selectedIds={form.absenteeIds}
              onChange={(ids) => setForm({ ...form, absenteeIds: ids })}
            />
            {user && (
              <DocumentUploader
                label="เอกสารประกอบรายงาน"
                files={docs}
                onChange={setDocs}
                uploadedBy={user.id}
                uploadedByName={user.displayName}
                meetingId={form.meetingId}
                category="minutes"
              />
            )}
          </CardContent>
        </Card>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            ยกเลิก
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting ? "กำลังบันทึก..." : "บันทึก"}
          </Button>
        </div>
      </form>
    </div>
  );
}
