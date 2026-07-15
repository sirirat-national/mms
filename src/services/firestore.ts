import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  type DocumentData,
} from "firebase/firestore";
import { getDb } from "@/lib/firebase";
import type {
  AppUser,
  Meeting,
  MeetingMinute,
  CloudDocument,
  AppNotification,
} from "@/types";

const COLLECTIONS = {
  users: "users",
  meetings: "meetings",
  minutes: "minutes",
  documents: "documents",
  notifications: "notifications",
} as const;

function stripUndefined<T extends Record<string, unknown>>(obj: T): T {
  const next = { ...obj };
  Object.keys(next).forEach((k) => {
    if (next[k] === undefined) delete next[k];
  });
  return next;
}

function mapDoc<T>(id: string, data: DocumentData): T {
  return { id, ...data } as T;
}

export async function listUsers(): Promise<AppUser[]> {
  const snap = await getDocs(collection(getDb(), COLLECTIONS.users));
  return snap.docs.map((d) => mapDoc<AppUser>(d.id, d.data()));
}

export async function getUser(id: string): Promise<AppUser | null> {
  const snap = await getDoc(doc(getDb(), COLLECTIONS.users, id));
  if (!snap.exists()) return null;
  return mapDoc<AppUser>(snap.id, snap.data());
}

export async function getUserByEmail(email: string): Promise<AppUser | null> {
  const q = query(
    collection(getDb(), COLLECTIONS.users),
    where("email", "==", email.toLowerCase())
  );
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const d = snap.docs[0];
  return mapDoc<AppUser>(d.id, d.data());
}

export async function upsertUser(user: AppUser): Promise<void> {
  const { id, ...rest } = user;
  await setDoc(
    doc(getDb(), COLLECTIONS.users, id),
    stripUndefined({
      ...rest,
      email: rest.email.toLowerCase(),
    }),
    { merge: true }
  );
}

export async function deleteUser(id: string): Promise<void> {
  await deleteDoc(doc(getDb(), COLLECTIONS.users, id));
}

export async function listMeetings(): Promise<Meeting[]> {
  const snap = await getDocs(collection(getDb(), COLLECTIONS.meetings));
  const list = snap.docs.map((d) => mapDoc<Meeting>(d.id, d.data()));
  return list.sort(
    (a, b) => new Date(b.startAt).getTime() - new Date(a.startAt).getTime()
  );
}

export async function getMeeting(id: string): Promise<Meeting | null> {
  const snap = await getDoc(doc(getDb(), COLLECTIONS.meetings, id));
  if (!snap.exists()) return null;
  return mapDoc<Meeting>(snap.id, snap.data());
}

export async function upsertMeeting(meeting: Meeting): Promise<void> {
  const { id, ...rest } = meeting;
  await setDoc(
    doc(getDb(), COLLECTIONS.meetings, id),
    stripUndefined(rest as unknown as Record<string, unknown>),
    { merge: true }
  );
}

export async function deleteMeeting(id: string): Promise<void> {
  await deleteDoc(doc(getDb(), COLLECTIONS.meetings, id));
}

export async function listMinutes(): Promise<MeetingMinute[]> {
  const snap = await getDocs(collection(getDb(), COLLECTIONS.minutes));
  const list = snap.docs.map((d) => mapDoc<MeetingMinute>(d.id, d.data()));
  return list.sort(
    (a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export async function getMinute(id: string): Promise<MeetingMinute | null> {
  const snap = await getDoc(doc(getDb(), COLLECTIONS.minutes, id));
  if (!snap.exists()) return null;
  return mapDoc<MeetingMinute>(snap.id, snap.data());
}

export async function upsertMinute(minute: MeetingMinute): Promise<void> {
  const { id, ...rest } = minute;
  await setDoc(
    doc(getDb(), COLLECTIONS.minutes, id),
    stripUndefined(rest as unknown as Record<string, unknown>),
    { merge: true }
  );
}

export async function deleteMinute(id: string): Promise<void> {
  await deleteDoc(doc(getDb(), COLLECTIONS.minutes, id));
}

export async function listDocuments(): Promise<CloudDocument[]> {
  const snap = await getDocs(collection(getDb(), COLLECTIONS.documents));
  const list = snap.docs.map((d) => mapDoc<CloudDocument>(d.id, d.data()));
  return list.sort(
    (a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export async function listDocumentsByMeeting(
  meetingId: string
): Promise<CloudDocument[]> {
  const q = query(
    collection(getDb(), COLLECTIONS.documents),
    where("meetingId", "==", meetingId)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => mapDoc<CloudDocument>(d.id, d.data()));
}

export async function upsertDocument(docData: CloudDocument): Promise<void> {
  const { id, ...rest } = docData;
  await setDoc(
    doc(getDb(), COLLECTIONS.documents, id),
    stripUndefined(rest as unknown as Record<string, unknown>),
    { merge: true }
  );
}

export async function deleteDocument(id: string): Promise<void> {
  await deleteDoc(doc(getDb(), COLLECTIONS.documents, id));
}

export async function listNotifications(
  userId: string
): Promise<AppNotification[]> {
  const q = query(
    collection(getDb(), COLLECTIONS.notifications),
    where("userId", "==", userId)
  );
  const snap = await getDocs(q);
  const list = snap.docs.map((d) => mapDoc<AppNotification>(d.id, d.data()));
  return list.sort(
    (a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export async function upsertNotification(n: AppNotification): Promise<void> {
  const { id, ...rest } = n;
  await setDoc(
    doc(getDb(), COLLECTIONS.notifications, id),
    stripUndefined(rest as unknown as Record<string, unknown>),
    { merge: true }
  );
}

export async function markNotificationRead(id: string): Promise<void> {
  await updateDoc(doc(getDb(), COLLECTIONS.notifications, id), { read: true });
}

export async function markAllNotificationsRead(
  userId: string
): Promise<void> {
  const list = await listNotifications(userId);
  await Promise.all(
    list.filter((n) => !n.read).map((n) => markNotificationRead(n.id))
  );
}

export async function countUnreadNotifications(
  userId: string
): Promise<number> {
  const list = await listNotifications(userId);
  return list.filter((n) => !n.read).length;
}

void orderBy;
