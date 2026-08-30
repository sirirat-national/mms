/**
 * Firebase-backed data access — replaces localStorage mock store.
 * All methods are async.
 */
import * as api from "@/services/firestore";
import type {
  AppUser,
  Meeting,
  MeetingMinute,
  CloudDocument,
  AppNotification,
} from "@/types";

export const store = {
  getUsers: (): Promise<AppUser[]> => api.listUsers(),
  getUser: (id: string): Promise<AppUser | null> => api.getUser(id),
  getUserByEmail: (email: string): Promise<AppUser | null> =>
    api.getUserByEmail(email),
  upsertUser: (user: AppUser): Promise<void> => api.upsertUser(user),
  deleteUser: (id: string): Promise<void> => api.deleteUser(id),

  getMeetings: (): Promise<Meeting[]> => api.listMeetings(),
  getMeeting: (id: string): Promise<Meeting | null> => api.getMeeting(id),
  upsertMeeting: (meeting: Meeting): Promise<void> =>
    api.upsertMeeting(meeting),
  deleteMeeting: (id: string): Promise<void> => api.deleteMeeting(id),

  getMinutes: (): Promise<MeetingMinute[]> => api.listMinutes(),
  getMinute: (id: string): Promise<MeetingMinute | null> => api.getMinute(id),
  upsertMinute: (minute: MeetingMinute): Promise<void> =>
    api.upsertMinute(minute),
  deleteMinute: (id: string): Promise<void> => api.deleteMinute(id),

  getDocuments: (): Promise<CloudDocument[]> => api.listDocuments(),
  getDocumentsByMeeting: (meetingId: string): Promise<CloudDocument[]> =>
    api.listDocumentsByMeeting(meetingId),
  upsertDocument: (doc: CloudDocument): Promise<void> =>
    api.upsertDocument(doc),
  deleteDocument: (id: string): Promise<void> => api.deleteDocument(id),

  getNotifications: (userId: string): Promise<AppNotification[]> =>
    api.listNotifications(userId),
  upsertNotification: (n: AppNotification): Promise<void> =>
    api.upsertNotification(n),
  markNotificationRead: (id: string): Promise<void> =>
    api.markNotificationRead(id),
  markAllNotificationsRead: (userId: string): Promise<void> =>
    api.markAllNotificationsRead(userId),
  countUnread: (userId: string): Promise<number> =>
    api.countUnreadNotifications(userId),
  subscribeToNotifications: (
    userId: string,
    onData: (notifications: AppNotification[]) => void,
    onError?: (error: Error) => void
  ) => api.subscribeToNotifications(userId, onData, onError),
};
