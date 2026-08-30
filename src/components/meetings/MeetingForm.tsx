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
import {
  getMeetingRoom,
  getRoomsForMeetingType,
  MEETING_ROOMS,
  ONLINE_PARTICIPANT_LIMIT,
} from "@/lib/meeting-rooms";
import { cn, formatDateTime, generateId } from "@/lib/utils";
import { uploadFileToStorage } from "@/lib/upload";
import type { Meeting, MeetingType, MeetingStatus, AppUser } from "@/types";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { CheckCircle2, MapPin, Monitor, Users, XCircle } from "lucide-react";

function toLocalInput(iso?: string) {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

const defaultStartAt = toLocalInput(
  new Date(Date.now() + 86400000).toISOString()
);
const defaultEndAt = toLocalInput(
  new Date(Date.now() + 90000000).toISOString()
);

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
  const [meetings, setMeetings] = useState<Meeting[]>([]);

  const [form, setForm] = useState({
    title: meeting?.title ?? "",
    description: meeting?.description ?? "",
    type: (meeting?.type ?? "online") as MeetingType,
    status: (meeting?.status ?? "scheduled") as MeetingStatus,
    startAt:
      toLocalInput(meeting?.startAt) ||
      defaultStartAt,
    endAt:
      toLocalInput(meeting?.endAt) ||
      defaultEndAt,
    roomId:
      getMeetingRoom(meeting?.roomId)?.id ??
      MEETING_ROOMS.find((room) => room.name === meeting?.location)?.id ??
      "",
    location: meeting?.location ?? "",
    onlineLink: meeting?.onlineLink ?? "",
    platform: meeting?.platform ?? "google-meet",
    participantIds: meeting?.participantIds ?? [],
    onlineParticipantIds:
      meeting?.onlineParticipantIds ??
      (meeting && meeting.type !== "onsite" ? meeting.participantIds : []),
    reminderMinutes: String(meeting?.reminderMinutes?.[0] ?? 15),
  });
  const [docs, setDocs] = useState<PendingDocument[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    store.getUsers().then(setUsers);
    store.getMeetings().then(setMeetings);
    if (meeting) {
      store.getDocumentsByMeeting(meeting.id).then(setDocs);
    }
  }, [meeting]);

  const set = (key: string, value: string | string[]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const visibleRooms = getRoomsForMeetingType(form.type);
  const selectedParticipants = users.filter((item) =>
    form.participantIds.includes(item.id)
  );
  const onlineParticipantIds =
    form.type === "online"
      ? form.participantIds
      : form.type === "onsite"
        ? []
        : form.onlineParticipantIds.filter((id) =>
            form.participantIds.includes(id)
          );
  const onsiteParticipantIds = form.participantIds.filter(
    (id) => !onlineParticipantIds.includes(id)
  );
  const selectedStart = new Date(form.startAt).getTime();
  const selectedEnd = new Date(form.endAt).getTime();
  const hasValidTime =
    Number.isFinite(selectedStart) &&
    Number.isFinite(selectedEnd) &&
    selectedStart < selectedEnd;

  const findRoomConflict = (roomId: string) =>
    meetings.find((item) => {
      const itemRoom = getMeetingRoom(item.roomId);
      const sameRoom =
        itemRoom?.id === roomId ||
        (!item.roomId && getMeetingRoom(roomId)?.name === item.location);
      const overlaps =
        hasValidTime &&
        selectedStart < new Date(item.endAt).getTime() &&
        selectedEnd > new Date(item.startAt).getTime();
      return (
        item.id !== meeting?.id &&
        item.status !== "cancelled" &&
        sameRoom &&
        overlaps
      );
    });

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
      const startAt = new Date(form.startAt);
      const endAt = new Date(form.endAt);

      if (Number.isNaN(startAt.getTime()) || Number.isNaN(endAt.getTime()) || startAt >= endAt) {
        throw new Error("กรุณาระบุวันและเวลาสิ้นสุดให้หลังเวลาเริ่ม");
      }

      if (onlineParticipantIds.length > ONLINE_PARTICIPANT_LIMIT) {
        throw new Error(
          `การประชุมออนไลน์รองรับผู้เข้าร่วมได้ไม่เกิน ${ONLINE_PARTICIPANT_LIMIT} คน`
        );
      }

      const room = getMeetingRoom(form.roomId);
      if (!room) {
        throw new Error("กรุณาเลือกห้องประชุม");
      }

      const attendeeCountInRoom =
        form.type === "hybrid"
          ? onsiteParticipantIds.length + 1
          : form.participantIds.length + 1;
      if (attendeeCountInRoom > room.capacity) {
        throw new Error(
          `ห้อง "${room.name}" รองรับได้ไม่เกิน ${room.capacity} คน`
        );
      }

      const latestMeetings = await store.getMeetings();
      const isRoomUnavailable = latestMeetings.some((item) => {
        const itemRoom = getMeetingRoom(item.roomId);
        const sameRoom =
          itemRoom?.id === room.id ||
          (!item.roomId && item.location === room.name);
        const overlaps =
          startAt.getTime() < new Date(item.endAt).getTime() &&
          endAt.getTime() > new Date(item.startAt).getTime();
        return (
          item.id !== meetingId &&
          item.status !== "cancelled" &&
          sameRoom &&
          overlaps
        );
      });
      if (isRoomUnavailable) {
        throw new Error(`ห้อง "${room.name}" ถูกจองในช่วงเวลานี้แล้ว`);
      }

      const payload: Meeting = {
        id: meetingId,
        title: form.title,
        description: form.description,
        type: form.type,
        status: form.status,
        startAt: startAt.toISOString(),
        endAt: endAt.toISOString(),
        roomId: room?.id,
        location: room?.name,
        onlineLink: form.type !== "onsite" ? form.onlineLink : undefined,
        platform:
          form.type !== "onsite"
            ? (form.platform as Meeting["platform"])
            : undefined,
        organizerId: meeting?.organizerId ?? user.id,
        organizerName: meeting?.organizerName ?? user.displayName,
        participantIds: form.participantIds,
        onlineParticipantIds,
        onsiteParticipantIds,
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
            createdBy: user.id,
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
              onChange={(e) =>
                setForm((current) => ({
                  ...current,
                  type: e.target.value as MeetingType,
                  roomId: "",
                  onlineParticipantIds:
                    e.target.value === "online"
                      ? current.participantIds
                      : [],
                }))
              }
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
          <div className="space-y-3">
            <div className="flex flex-wrap items-end justify-between gap-2">
              <div>
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  เลือกห้องประชุม *
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  {form.type === "onsite"
                    ? "ห้อง On-site 3 ห้อง"
                    : "ห้องที่รองรับการประชุมออนไลน์ 2 ห้อง"}
                </p>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <span className="flex items-center gap-1 text-emerald-600">
                  <CheckCircle2 className="h-3.5 w-3.5" /> ว่าง
                </span>
                <span className="flex items-center gap-1 text-red-600">
                  <XCircle className="h-3.5 w-3.5" /> ไม่ว่าง
                </span>
              </div>
            </div>

            {!hasValidTime && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-300">
                กรุณาเลือกวันและเวลาเริ่ม–สิ้นสุด เพื่อดูสถานะห้องว่าง
              </div>
            )}

            <div className="grid gap-3 md:grid-cols-2">
              {visibleRooms.map((room) => {
                const conflict = findRoomConflict(room.id);
                const unavailable = Boolean(conflict);
                const selected = form.roomId === room.id;

                return (
                  <button
                    key={room.id}
                    type="button"
                    disabled={unavailable}
                    aria-pressed={selected}
                    onClick={() => set("roomId", room.id)}
                    className={cn(
                      "rounded-xl border p-4 text-left transition-all",
                      selected
                        ? "border-brand-500 bg-brand-50 ring-2 ring-brand-500/20 dark:bg-brand-950/30"
                        : "border-slate-200 bg-white hover:border-brand-300 dark:border-slate-700 dark:bg-slate-900",
                      unavailable &&
                        "cursor-not-allowed border-red-200 bg-red-50/60 opacity-80 dark:border-red-900 dark:bg-red-950/20"
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-900 dark:text-white">
                          {room.name}
                        </p>
                        <p className="mt-0.5 text-xs text-slate-500">
                          {room.description}
                        </p>
                      </div>
                      {unavailable ? (
                        <span className="shrink-0 rounded-full bg-red-100 px-2 py-1 text-[11px] font-semibold text-red-700 dark:bg-red-900/40 dark:text-red-300">
                          ไม่ว่าง
                        </span>
                      ) : (
                        <span className="shrink-0 rounded-full bg-emerald-100 px-2 py-1 text-[11px] font-semibold text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                          ว่าง
                        </span>
                      )}
                    </div>

                    <div className="mt-3 flex flex-wrap gap-3 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <Users className="h-3.5 w-3.5" /> รองรับ {room.capacity} คน
                      </span>
                      <span className="flex items-center gap-1">
                        {room.category === "online" ? (
                          <Monitor className="h-3.5 w-3.5" />
                        ) : (
                          <MapPin className="h-3.5 w-3.5" />
                        )}
                        {room.category === "online" ? "Online" : "On-site"}
                      </span>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {room.equipment.map((item) => (
                        <span
                          key={item}
                          className="rounded-md bg-slate-100 px-2 py-1 text-[11px] text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                        >
                          {item}
                        </span>
                      ))}
                    </div>

                    {conflict && (
                      <div className="mt-3 rounded-lg bg-white/80 p-2.5 text-xs text-red-700 dark:bg-slate-900/70 dark:text-red-300">
                        <p className="font-semibold">จองโดย {conflict.organizerName}</p>
                        <p className="mt-1">{conflict.title}</p>
                        <p className="mt-1">
                          {formatDateTime(conflict.startAt)} – {new Date(conflict.endAt).toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" })} น.
                        </p>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            <p className="text-xs text-slate-500">
              ระบบแสดงผู้จอง วันเวลา และตรวจสอบห้องซ้ำอีกครั้งก่อนบันทึก
            </p>
          </div>
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
          {form.type !== "onsite" && (
            <p className="text-xs text-slate-500">
              ผู้เข้าร่วมออนไลน์ต้องมีไม่เกิน {ONLINE_PARTICIPANT_LIMIT} คน
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-6">
          <ParticipantPicker
            users={users}
            selectedIds={form.participantIds}
            excludeIds={user ? [user.id] : []}
            onChange={(ids) => {
              if (
                form.type === "online" &&
                ids.length > ONLINE_PARTICIPANT_LIMIT
              ) {
                toast.error(
                  `ผู้เข้าร่วมออนไลน์ต้องมีไม่เกิน ${ONLINE_PARTICIPANT_LIMIT} คน`
                );
                return;
              }
              setForm((current) => ({
                ...current,
                participantIds: ids,
                onlineParticipantIds:
                  current.type === "online"
                    ? ids
                    : current.type === "onsite"
                      ? []
                      : current.onlineParticipantIds.filter((id) =>
                          ids.includes(id)
                        ),
              }));
            }}
          />

          {selectedParticipants.length > 0 && (
            <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-700 dark:bg-slate-900/50">
              {form.type === "hybrid" ? (
                <>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">
                        รูปแบบการเข้าร่วม
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        ระบุว่าแต่ละคนเข้าร่วม Online หรือ On-site
                      </p>
                    </div>
                    <span
                      className={cn(
                        "rounded-full px-2.5 py-1 text-xs font-semibold",
                        onlineParticipantIds.length >= ONLINE_PARTICIPANT_LIMIT
                          ? "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300"
                          : "bg-brand-100 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300"
                      )}
                    >
                      Online {onlineParticipantIds.length}/{ONLINE_PARTICIPANT_LIMIT} คน
                    </span>
                  </div>

                  <div className="mt-3 space-y-2">
                    {selectedParticipants.map((participant, index) => {
                      const isOnline = onlineParticipantIds.includes(
                        participant.id
                      );
                      return (
                        <div
                          key={participant.id}
                          className="flex flex-col gap-2 rounded-lg border border-slate-200 bg-white p-3 sm:flex-row sm:items-center dark:border-slate-700 dark:bg-slate-900"
                        >
                          <div className="flex min-w-0 flex-1 items-center gap-2">
                            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                              {index + 1}
                            </span>
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium text-slate-900 dark:text-white">
                                {participant.displayName}
                              </p>
                              <p className="truncate text-xs text-slate-500">
                                {participant.email}
                              </p>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-1 rounded-lg bg-slate-100 p-1 dark:bg-slate-800">
                            <button
                              type="button"
                              disabled={
                                !isOnline &&
                                onlineParticipantIds.length >=
                                  ONLINE_PARTICIPANT_LIMIT
                              }
                              onClick={() =>
                                setForm((current) => ({
                                  ...current,
                                  onlineParticipantIds: Array.from(
                                    new Set([
                                      ...current.onlineParticipantIds,
                                      participant.id,
                                    ])
                                  ),
                                }))
                              }
                              className={cn(
                                "rounded-md px-3 py-1.5 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40",
                                isOnline
                                  ? "bg-brand-600 text-white"
                                  : "text-slate-600 hover:bg-white dark:text-slate-300 dark:hover:bg-slate-700"
                              )}
                            >
                              Online
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                setForm((current) => ({
                                  ...current,
                                  onlineParticipantIds:
                                    current.onlineParticipantIds.filter(
                                      (id) => id !== participant.id
                                    ),
                                }))
                              }
                              className={cn(
                                "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                                !isOnline
                                  ? "bg-emerald-600 text-white"
                                  : "text-slate-600 hover:bg-white dark:text-slate-300 dark:hover:bg-slate-700"
                              )}
                            >
                              On-site
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              ) : (
                <>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">
                      {form.type === "online"
                        ? "รายชื่อผู้เข้าร่วมออนไลน์"
                        : "รายชื่อผู้เข้าร่วม On-site"}
                    </p>
                    <span className="rounded-full bg-brand-100 px-2.5 py-1 text-xs font-semibold text-brand-700 dark:bg-brand-900/40 dark:text-brand-300">
                      {form.type === "online"
                        ? `${onlineParticipantIds.length}/${ONLINE_PARTICIPANT_LIMIT}`
                        : onsiteParticipantIds.length} คน
                    </span>
                  </div>
                  <ol className="mt-3 grid gap-2 sm:grid-cols-2">
                    {selectedParticipants.map((participant, index) => (
                      <li
                        key={participant.id}
                        className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white p-2.5 dark:border-slate-700 dark:bg-slate-900"
                      >
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-100 text-xs font-semibold text-brand-700 dark:bg-brand-900/40 dark:text-brand-300">
                          {index + 1}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-slate-900 dark:text-white">
                            {participant.displayName}
                          </p>
                          <p className="truncate text-xs text-slate-500">
                            {participant.email}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ol>
                </>
              )}
            </div>
          )}
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
