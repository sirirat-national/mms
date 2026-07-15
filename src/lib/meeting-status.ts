import { store } from "@/lib/store";
import type { Meeting, MeetingStatus } from "@/types";
import { parseISO } from "date-fns";

/** Sync meeting status from schedule times (skip cancelled). */
export function resolveMeetingStatus(
  meeting: Meeting,
  now = new Date()
): MeetingStatus {
  if (meeting.status === "cancelled") return "cancelled";
  if (meeting.status === "completed") return "completed";

  const start = parseISO(meeting.startAt);
  const end = parseISO(meeting.endAt);

  if (now >= end) return "completed";
  if (now >= start) return "ongoing";
  return meeting.status === "ongoing" ? "scheduled" : meeting.status;
}

export async function syncAllMeetingStatuses(): Promise<Meeting[]> {
  const now = new Date();
  const meetings = await store.getMeetings();

  await Promise.all(
    meetings.map(async (m) => {
      const next = resolveMeetingStatus(m, now);
      if (next !== m.status) {
        await store.upsertMeeting({
          ...m,
          status: next,
          updatedAt: now.toISOString(),
        });
      }
    })
  );

  return store.getMeetings();
}

export async function markMeetingOngoing(meetingId: string) {
  const m = await store.getMeeting(meetingId);
  if (!m || m.status === "cancelled" || m.status === "completed") return m;
  const updated = {
    ...m,
    status: "ongoing" as const,
    updatedAt: new Date().toISOString(),
  };
  await store.upsertMeeting(updated);
  return updated;
}

export async function markMeetingCompleted(meetingId: string) {
  const m = await store.getMeeting(meetingId);
  if (!m || m.status === "cancelled") return m;
  const updated = {
    ...m,
    status: "completed" as const,
    updatedAt: new Date().toISOString(),
  };
  await store.upsertMeeting(updated);
  return updated;
}

export const REMINDER_OPTIONS = [
  { value: "5", label: "แจ้งเตือนก่อน 5 นาที" },
  { value: "10", label: "แจ้งเตือนก่อน 10 นาที" },
  { value: "15", label: "แจ้งเตือนก่อน 15 นาที" },
  { value: "20", label: "แจ้งเตือนก่อน 20 นาที" },
  { value: "30", label: "แจ้งเตือนก่อน 30 นาที" },
];
