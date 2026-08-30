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
import { markMeetingCompleted } from "@/lib/meeting-status";
import { generateId } from "@/lib/utils";
import { uploadFileToStorage } from "@/lib/upload";
import type { Meeting, MeetingMinute, AppUser } from "@/types";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import toast from "react-hot-toast";

function MinuteFormInner() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState({
    meetingId: searchParams.get("meetingId") ?? "",
    content: "",
    resolutions: "",
    attendeeIds: [] as string[],
    absenteeIds: [] as string[],
  });
  const [docs, setDocs] = useState<PendingDocument[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    (async () => {
      const [mList, uList] = await Promise.all([
        store.getMeetings(),
        store.getUsers(),
      ]);
      setMeetings(mList);
      setUsers(uList);
      const initialId = searchParams.get("meetingId") ?? mList[0]?.id ?? "";
      setForm((f) => ({
        ...f,
        meetingId: f.meetingId || initialId,
        attendeeIds: (() => {
          const m = mList.find((x) => x.id === (f.meetingId || initialId));
          if (!m) return uList.map((u) => u.id);
          return [m.organizerId, ...m.participantIds].filter(
            (id, i, arr) => arr.indexOf(id) === i
          );
        })(),
      }));
      setLoading(false);
    })();
  }, [searchParams]);

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

      const payload: MeetingMinute = {
        id: generateId("min"),
        meetingId: form.meetingId,
        meetingTitle: meeting?.title ?? "ไม่ระบุ",
        content: form.content,
        resolutions: form.resolutions
          .split("\n")
          .map((s) => s.trim())
          .filter(Boolean),
        attendees,
        absentees,
        recordedBy: user.id,
        recordedByName: user.displayName,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await store.upsertMinute(payload);

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

      await markMeetingCompleted(form.meetingId);
      toast.success("บันทึกรายงานสำเร็จ — สถานะประชุมเป็นเสร็จสิ้น");
      router.push("/minutes");
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : "บันทึกไม่สำเร็จ");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-200 border-t-brand-600" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardContent className="space-y-4">
          <Select
            label="การประชุม *"
            value={form.meetingId}
            onChange={(e) => setForm({ ...form, meetingId: e.target.value })}
            options={
              meetings.length
                ? meetings.map((m) => ({ value: m.id, label: m.title }))
                : [{ value: "", label: "ยังไม่มีการประชุม" }]
            }
            required
          />
          <Textarea
            label="รายละเอียดการประชุม *"
            value={form.content}
            onChange={(e) => setForm({ ...form, content: e.target.value })}
            required
            className="min-h-[120px]"
          />
          <Textarea
            label="มติที่ประชุม (บรรทัดละ 1 มติ)"
            value={form.resolutions}
            onChange={(e) => setForm({ ...form, resolutions: e.target.value })}
            placeholder={"อนุมัติงบประมาณ...\nมอบหมายงาน..."}
          />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-6">
          <ParticipantPicker
            label="ผู้เข้าร่วม (ค้นหา + Checkbox)"
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
              label="อัปโหลดเอกสารประกอบรายงาน"
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
        <Button type="submit" disabled={submitting || !form.meetingId}>
          {submitting ? "กำลังบันทึก..." : "บันทึก"}
        </Button>
      </div>
    </form>
  );
}

export default function NewMinutePage() {
  return (
    <div>
      <PageHeader
        title="บันทึกรายงานการประชุม"
        description="บันทึกรายละเอียด มติ ผู้เข้าร่วม และอัปโหลดเอกสาร — เมื่อบันทึกจะถือว่าประชุมเสร็จสิ้น"
        backHref="/minutes"
        showBack
      />
      <Suspense
        fallback={<div className="text-sm text-slate-400">กำลังโหลด...</div>}
      >
        <MinuteFormInner />
      </Suspense>
    </div>
  );
}
