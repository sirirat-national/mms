import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, parseISO, isPast, isFuture, isToday } from "date-fns";
import { th } from "date-fns/locale";
import type { UserRole, MeetingStatus, DocumentCategory } from "@/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date, pattern = "d MMM yyyy") {
  const d = typeof date === "string" ? parseISO(date) : date;
  return format(d, pattern, { locale: th });
}

export function formatDateTime(date: string | Date) {
  return formatDate(date, "d MMM yyyy HH:mm");
}

export function formatFileSize(bytes: number) {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export function generateId(prefix = "id") {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export const roleLabels: Record<UserRole, string> = {
  admin: "ผู้ดูแลระบบ",
  organizer: "ผู้จัดประชุม",
  participant: "ผู้เข้าร่วม",
};

export const statusLabels: Record<MeetingStatus, string> = {
  scheduled: "กำหนดการ",
  ongoing: "กำลังประชุม",
  completed: "เสร็จสิ้น",
  cancelled: "ยกเลิก",
};

export const categoryLabels: Record<DocumentCategory, string> = {
  agenda: "วาระการประชุม",
  minutes: "รายงานการประชุม",
  presentation: "สไลด์นำเสนอ",
  report: "รายงาน",
  image: "รูปภาพ",
  other: "อื่นๆ",
};

export function getMeetingTimeState(startAt: string, endAt: string) {
  const start = parseISO(startAt);
  const end = parseISO(endAt);
  if (isPast(end)) return "past";
  if (isFuture(start)) return "upcoming";
  return "ongoing";
}

export function isMeetingToday(startAt: string) {
  return isToday(parseISO(startAt));
}
