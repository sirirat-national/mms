export type UserRole = "admin" | "organizer" | "participant";

export interface AppUser {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
  department?: string;
  phone?: string;
  avatarUrl?: string;
  createdAt: string;
  lastLoginAt?: string;
  isActive: boolean;
}

export type MeetingType = "online" | "onsite" | "hybrid";
export type MeetingStatus = "scheduled" | "ongoing" | "completed" | "cancelled";

export interface Meeting {
  id: string;
  title: string;
  description: string;
  type: MeetingType;
  status: MeetingStatus;
  startAt: string;
  endAt: string;
  roomId?: string;
  location?: string;
  onlineLink?: string;
  platform?: "zoom" | "google-meet" | "microsoft-teams" | "other";
  organizerId: string;
  organizerName: string;
  participantIds: string[];
  onlineParticipantIds?: string[];
  onsiteParticipantIds?: string[];
  participantEmails: string[];
  reminderMinutes: number[];
  createdAt: string;
  updatedAt: string;
}

export type DocumentCategory =
  | "agenda"
  | "minutes"
  | "presentation"
  | "report"
  | "image"
  | "other";

export interface CloudDocument {
  id: string;
  name: string;
  category: DocumentCategory;
  mimeType: string;
  size: number;
  meetingId?: string;
  uploadedBy: string;
  uploadedByName: string;
  downloadUrl: string;
  createdAt: string;
  updatedAt: string;
}

export interface MeetingMinute {
  id: string;
  meetingId: string;
  meetingTitle: string;
  content: string;
  resolutions: string[];
  attendees: string[];
  absentees: string[];
  recordedBy: string;
  recordedByName: string;
  createdAt: string;
  updatedAt: string;
}

export type NotificationType =
  | "meeting_reminder"
  | "new_document"
  | "schedule_change"
  | "meeting_invite"
  | "system";

export interface AppNotification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
  read: boolean;
  createdAt: string;
  /** UID ของผู้สร้างการแจ้งเตือน ใช้สำหรับตรวจสอบสิทธิ์ใน Firestore */
  createdBy?: string;
}

export interface DashboardStats {
  totalMeetings: number;
  totalUsers: number;
  upcomingMeetings: number;
  pastMeetings: number;
  totalDocuments: number;
  meetingsThisMonth: number;
  attendanceRate: number;
}
