/**
 * Seed mock data → Firebase Auth + Firestore
 * Usage: npm run seed
 *
 * บัญชีทดสอบ (รหัสผ่านทุกบัญชี: 12345678)
 *   admin@meetcloud.app
 *   organizer@meetcloud.app
 *   user@meetcloud.app
 */
import { config } from "dotenv";
import { resolve } from "path";
import { initializeApp, deleteApp } from "firebase/app";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  updatePassword,
  signOut,
} from "firebase/auth";
import { getFirestore, doc, setDoc, collection, getDocs, deleteDoc } from "firebase/firestore";

config({ path: resolve(process.cwd(), ".env.local") });
config({ path: resolve(process.cwd(), ".env") });

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
  console.error("❌ ไม่พบ Firebase config ใน .env / .env.local");
  process.exit(1);
}

const SEED_PASSWORD = "12345678";
const LEGACY_SEED_PASSWORD = "Demo1234!";

const addDays = (d, h = 10) => {
  const date = new Date();
  date.setDate(date.getDate() + d);
  date.setHours(h, 0, 0, 0);
  return date.toISOString();
};
const addHours = (iso, hours) => {
  const d = new Date(iso);
  d.setHours(d.getHours() + hours);
  return d.toISOString();
};

const seedUsers = [
  {
    email: "admin@meetcloud.app",
    displayName: "สุชาติ ผู้ดูแล",
    role: "admin",
    department: "ฝ่าย IT",
    phone: "081-000-0001",
  },
  {
    email: "organizer@meetcloud.app",
    displayName: "วิภา ผู้จัดประชุม",
    role: "organizer",
    department: "ฝ่ายบริหาร",
    phone: "081-000-0002",
  },
  {
    email: "user@meetcloud.app",
    displayName: "ธนา ผู้เข้าร่วม",
    role: "participant",
    department: "ฝ่ายขาย",
    phone: "081-000-0003",
  },
  {
    email: "nattaya@meetcloud.app",
    displayName: "ณัฐทยา สุขใจ",
    role: "participant",
    department: "ฝ่ายการตลาด",
    phone: "081-000-0004",
  },
  {
    email: "pakorn@meetcloud.app",
    displayName: "ปกรณ์ มีชัย",
    role: "organizer",
    department: "ฝ่าย HR",
    phone: "081-000-0005",
  },
];

async function ensureUser(
  appName,
  u
) {
  const app = initializeApp(firebaseConfig, appName);
  const auth = getAuth(app);
  try {
    const cred = await createUserWithEmailAndPassword(
      auth,
      u.email,
      SEED_PASSWORD
    );
    await updateProfile(cred.user, { displayName: u.displayName });
    console.log(`  ✓ สร้าง Auth: ${u.email}`);
    await signOut(auth);
    await deleteApp(app);
    return {
      uid: cred.user.uid,
      email: u.email,
      displayName: u.displayName,
    };
  } catch (err) {
    const code =
      err && typeof err === "object" && "code" in err
        ? String(err.code)
        : "";
    if (code === "auth/email-already-in-use") {
      let cred;
      try {
        cred = await signInWithEmailAndPassword(auth, u.email, SEED_PASSWORD);
      } catch (signInError) {
        const signInCode =
          signInError && typeof signInError === "object" && "code" in signInError
            ? String(signInError.code)
            : "";
        if (
          signInCode !== "auth/wrong-password" &&
          signInCode !== "auth/invalid-credential"
        ) {
          throw signInError;
        }

        cred = await signInWithEmailAndPassword(
          auth,
          u.email,
          LEGACY_SEED_PASSWORD
        );
        await updatePassword(cred.user, SEED_PASSWORD);
        console.log(`  ✓ เปลี่ยนรหัสผ่าน: ${u.email}`);
      }
      console.log(`  · มีอยู่แล้ว: ${u.email}`);
      const uid = cred.user.uid;
      await signOut(auth);
      await deleteApp(app);
      return { uid, email: u.email, displayName: u.displayName };
    }
    await deleteApp(app).catch(() => undefined);
    throw err;
  }
}

async function clearCollection(db, name) {
  try {
    const snap = await getDocs(collection(db, name));
    await Promise.all(snap.docs.map((d) => deleteDoc(d.ref)));
    console.log(`  ล้าง ${name}: ${snap.size} รายการ`);
  } catch (err) {
    const code =
      err && typeof err === "object" && "code" in err ? String(err.code) : "";
    if (code === "permission-denied") {
      console.warn(`  ข้ามการล้าง ${name}: Firestore Rules ไม่อนุญาตให้ query ทั้ง collection`);
      return;
    }
    throw err;
  }
}

async function main() {
  console.log("\n🌱 Seed MeetCloud → Firebase\n");

  const mainApp = initializeApp(firebaseConfig, "seed-main");
  const db = getFirestore(mainApp);

  // 1) Auth users
  console.log("1) สร้าง / เช็คผู้ใช้ Auth...");
  const created = {};

  for (let i = 0; i < seedUsers.length; i++) {
    const u = seedUsers[i];
    const result = await ensureUser(`seed-auth-${i}`, u);
    created[u.email] = { ...result, role: u.role };
  }

  const byEmail = (email) => created[email];
  const admin = byEmail("admin@meetcloud.app");
  const organizer = byEmail("organizer@meetcloud.app");
  const participant = byEmail("user@meetcloud.app");
  const nattaya = byEmail("nattaya@meetcloud.app");
  const pakorn = byEmail("pakorn@meetcloud.app");

  // เขียน Firestore ต้องล็อกอิน (ตาม Security Rules)
  console.log("\n2) เข้าสู่ระบบด้วย admin เพื่อเขียนข้อมูล...");
  const auth = getAuth(mainApp);
  await signInWithEmailAndPassword(auth, admin.email, SEED_PASSWORD);

  console.log("\n3) เขียนโปรไฟล์ users (admin ก่อน)...");
  const adminSeed = seedUsers.find((u) => u.email === admin.email);
  if (!adminSeed) throw new Error("admin user not found");
  await setDoc(doc(db, "users", admin.uid), {
    email: adminSeed.email.toLowerCase(),
    displayName: adminSeed.displayName,
    role: adminSeed.role,
    department: adminSeed.department,
    phone: adminSeed.phone,
    createdAt: addDays(-60),
    lastLoginAt: addDays(0),
    isActive: true,
  });

  for (const u of seedUsers.filter((x) => x.email !== admin.email)) {
    const c = created[u.email];
    await setDoc(doc(db, "users", c.uid), {
      email: u.email.toLowerCase(),
      displayName: u.displayName,
      role: u.role,
      department: u.department,
      phone: u.phone,
      createdAt: addDays(-60),
      lastLoginAt: addDays(0),
      isActive: true,
    });
  }

  console.log("\n4) ล้าง meetings / minutes / documents / notifications...");
  await clearCollection(db, "meetings");
  await clearCollection(db, "minutes");
  await clearCollection(db, "documents");
  await clearCollection(db, "notifications");

  console.log("\n5) ใส่ meetings...");
  const meetings = [
    {
      id: "mtg_q2",
      title: "ประชุมสรุปผล Q2 2026",
      description: "สรุปผลการดำเนินงานไตรมาส 2 และวางแผนไตรมาส 3",
      type: "hybrid",
      status: "scheduled",
      startAt: addDays(2, 9),
      endAt: addHours(addDays(2, 9), 2),
      roomId: "medium-meeting-room",
      location: "ห้องประชุมขนาดกลาง",
      onlineLink: "https://meet.google.com/abc-defg-hij",
      platform: "google-meet",
      organizerId: organizer.uid,
      organizerName: organizer.displayName,
      participantIds: [admin.uid, participant.uid, nattaya.uid, pakorn.uid],
      participantEmails: [
        admin.email,
        participant.email,
        nattaya.email,
        pakorn.email,
      ],
      reminderMinutes: [30],
      createdAt: addDays(-5),
      updatedAt: addDays(-1),
    },
    {
      id: "mtg_standup",
      title: "Daily Standup — Product Team",
      description: "อัปเดตความคืบหน้างานประจำวัน",
      type: "online",
      status: "scheduled",
      startAt: addDays(0, 10),
      endAt: addHours(addDays(0, 10), 0.5),
      onlineLink: "https://zoom.us/j/123456789",
      platform: "zoom",
      organizerId: organizer.uid,
      organizerName: organizer.displayName,
      participantIds: [participant.uid, nattaya.uid],
      participantEmails: [participant.email, nattaya.email],
      reminderMinutes: [15],
      createdAt: addDays(-7),
      updatedAt: addDays(-7),
    },
    {
      id: "mtg_purchase",
      title: "ประชุมคณะกรรมการจัดซื้อ",
      description: "พิจารณาอนุมัติงบประมาณและผู้ขาย",
      type: "onsite",
      status: "scheduled",
      startAt: addDays(5, 13),
      endAt: addHours(addDays(5, 13), 2),
      roomId: "tri-building-floor-2",
      location: "ห้องประชุมไตรอาคาร ชั้น 2",
      organizerId: pakorn.uid,
      organizerName: pakorn.displayName,
      participantIds: [admin.uid, organizer.uid],
      participantEmails: [admin.email, organizer.email],
      reminderMinutes: [60],
      createdAt: addDays(-3),
      updatedAt: addDays(-3),
    },
    {
      id: "mtg_kickoff",
      title: "Kickoff โครงการ MeetCloud",
      description: "เปิดตัวโครงการระบบจัดการประชุมออนไลน์",
      type: "hybrid",
      status: "completed",
      startAt: addDays(-14, 14),
      endAt: addHours(addDays(-14, 14), 3),
      roomId: "audiovisual-building-6-floor-2",
      location: "ห้องโสตทัศนศึกษา อาคาร 6 ชั้น 2",
      onlineLink: "https://teams.microsoft.com/l/meetup-join/xxx",
      platform: "microsoft-teams",
      organizerId: admin.uid,
      organizerName: admin.displayName,
      participantIds: [
        organizer.uid,
        participant.uid,
        nattaya.uid,
        pakorn.uid,
      ],
      participantEmails: [
        organizer.email,
        participant.email,
        nattaya.email,
        pakorn.email,
      ],
      reminderMinutes: [30],
      createdAt: addDays(-20),
      updatedAt: addDays(-14),
    },
    {
      id: "mtg_pdpa",
      title: "ทบทวนนโยบายความปลอดภัยข้อมูล",
      description: "อัปเดตนโยบาย PDPA และมาตรการรักษาความปลอดภัย",
      type: "online",
      status: "completed",
      startAt: addDays(-7, 15),
      endAt: addHours(addDays(-7, 15), 1.5),
      onlineLink: "https://meet.google.com/xyz-abcd-efg",
      platform: "google-meet",
      organizerId: admin.uid,
      organizerName: admin.displayName,
      participantIds: [organizer.uid, pakorn.uid],
      participantEmails: [organizer.email, pakorn.email],
      reminderMinutes: [30],
      createdAt: addDays(-10),
      updatedAt: addDays(-7),
    },
    {
      id: "mtg_training",
      title: "อบรมพนักงานใหม่ — ระบบประชุม",
      description: "แนะนำการใช้งานระบบ MeetCloud ให้พนักงานใหม่",
      type: "onsite",
      status: "cancelled",
      startAt: addDays(-2, 9),
      endAt: addHours(addDays(-2, 9), 2),
      roomId: "room-322-building-3-floor-2",
      location: "ห้อง 322 อาคาร 3 ชั้น 2",
      organizerId: pakorn.uid,
      organizerName: pakorn.displayName,
      participantIds: [participant.uid, nattaya.uid],
      participantEmails: [participant.email, nattaya.email],
      reminderMinutes: [60],
      createdAt: addDays(-8),
      updatedAt: addDays(-3),
    },
  ];

  for (const m of meetings) {
    const { id, ...rest } = m;
    await setDoc(doc(db, "meetings", id), rest);
  }
  console.log(`  ✓ meetings: ${meetings.length}`);

  console.log("\n6) ใส่ minutes...");
  const minutes = [
    {
      id: "min_kickoff",
      meetingId: "mtg_kickoff",
      meetingTitle: "Kickoff โครงการ MeetCloud",
      content:
        "ที่ประชุมได้เปิดตัวโครงการ MeetCloud และมอบหมายทีมงานรับผิดชอบแต่ละโมดูล กำหนดระยะเวลาส่งมอบ Phase 1 ภายใน 8 สัปดาห์",
      resolutions: [
        "อนุมัติงบประมาณ Phase 1 จำนวน 850,000 บาท",
        "มอบหมายคุณวิภาเป็น Product Owner",
        "กำหนด Sprint Planning ทุกวันจันทร์ 10.00 น.",
      ],
      attendees: [
        admin.displayName,
        organizer.displayName,
        participant.displayName,
        nattaya.displayName,
        pakorn.displayName,
      ],
      absentees: [],
      recordedBy: admin.uid,
      recordedByName: admin.displayName,
      createdAt: addDays(-13),
      updatedAt: addDays(-13),
    },
    {
      id: "min_pdpa",
      meetingId: "mtg_pdpa",
      meetingTitle: "ทบทวนนโยบายความปลอดภัยข้อมูล",
      content:
        "ทบทวนนโยบาย PDPA และมาตรการเข้ารหัสข้อมูลบนคลาวด์ พร้อมแผนอบรมพนักงาน",
      resolutions: [
        "บังคับใช้ MFA สำหรับผู้ดูแลระบบภายใน 30 วัน",
        "จัดอบรม PDPA ให้ทุกแผนกภายในไตรมาสนี้",
      ],
      attendees: [admin.displayName, organizer.displayName, pakorn.displayName],
      absentees: [],
      recordedBy: admin.uid,
      recordedByName: admin.displayName,
      createdAt: addDays(-6),
      updatedAt: addDays(-6),
    },
  ];

  for (const m of minutes) {
    const { id, ...rest } = m;
    await setDoc(doc(db, "minutes", id), rest);
  }
  console.log(`  ✓ minutes: ${minutes.length}`);

  console.log("\n7) ใส่ documents (metadata — ไฟล์จริงอัปผ่าน Vercel Blob)...");
  const documents = [
    {
      id: "doc_agenda_q2",
      name: "วาระประชุม_Q2_2026.pdf",
      category: "agenda",
      mimeType: "application/pdf",
      size: 245760,
      meetingId: "mtg_q2",
      uploadedBy: organizer.uid,
      uploadedByName: organizer.displayName,
      downloadUrl: "",
      createdAt: addDays(-4),
      updatedAt: addDays(-4),
    },
    {
      id: "doc_report_q2",
      name: "ผลประกอบการ_Q2.xlsx",
      category: "report",
      mimeType:
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      size: 512000,
      meetingId: "mtg_q2",
      uploadedBy: organizer.uid,
      uploadedByName: organizer.displayName,
      downloadUrl: "",
      createdAt: addDays(-3),
      updatedAt: addDays(-3),
    },
    {
      id: "doc_kickoff_ppt",
      name: "Kickoff_Presentation.pptx",
      category: "presentation",
      mimeType:
        "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      size: 2048000,
      meetingId: "mtg_kickoff",
      uploadedBy: admin.uid,
      uploadedByName: admin.displayName,
      downloadUrl: "",
      createdAt: addDays(-15),
      updatedAt: addDays(-15),
    },
    {
      id: "doc_kickoff_min",
      name: "รายงานการประชุม_Kickoff.docx",
      category: "minutes",
      mimeType:
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      size: 128000,
      meetingId: "mtg_kickoff",
      uploadedBy: admin.uid,
      uploadedByName: admin.displayName,
      downloadUrl: "",
      createdAt: addDays(-13),
      updatedAt: addDays(-13),
    },
  ];

  for (const d of documents) {
    const { id, ...rest } = d;
    await setDoc(doc(db, "documents", id), rest);
  }
  console.log(`  ✓ documents: ${documents.length}`);

  console.log("\n8) ใส่ notifications...");
  const notifications = [
    {
      id: "ntf_1",
      userId: admin.uid,
      type: "meeting_reminder",
      title: "แจ้งเตือนก่อนประชุม",
      message: "ประชุมสรุปผล Q2 2026 จะเริ่มในอีก 2 วัน",
      link: "/meetings/mtg_q2",
      read: false,
      createdAt: addDays(0),
    },
    {
      id: "ntf_2",
      userId: admin.uid,
      type: "new_document",
      title: "เอกสารใหม่",
      message: "มีเอกสารใหม่: ผลประกอบการ_Q2.xlsx",
      link: "/minutes",
      read: false,
      createdAt: addDays(-1),
    },
    {
      id: "ntf_3",
      userId: organizer.uid,
      type: "schedule_change",
      title: "แก้ไขกำหนดการ",
      message: "กำหนดการประชุมคณะกรรมการจัดซื้อมีการเปลี่ยนแปลง",
      link: "/meetings/mtg_purchase",
      read: true,
      createdAt: addDays(-2),
    },
    {
      id: "ntf_4",
      userId: participant.uid,
      type: "meeting_invite",
      title: "คำเชิญประชุม",
      message: "คุณได้รับเชิญเข้าร่วม: ประชุมสรุปผล Q2 2026",
      link: "/meetings/mtg_q2",
      read: false,
      createdAt: addDays(-1),
    },
  ];

  for (const n of notifications) {
    const { id, ...rest } = n;
    await setDoc(doc(db, "notifications", id), rest);
  }
  console.log(`  ✓ notifications: ${notifications.length}`);

  await signOut(auth);
  await deleteApp(mainApp);

  console.log("\n✅ Seed เสร็จแล้ว!\n");
  console.log("────────────────────────────────────");
  console.log(" บัญชีเข้าสู่ระบบ (รหัสผ่าน: 12345678)");
  console.log("────────────────────────────────────");
  for (const u of seedUsers) {
    console.log(`  ${u.role.padEnd(12)} ${u.email}`);
  }
  console.log("────────────────────────────────────\n");
}

main().catch((err) => {
  console.error("\n❌ Seed ล้มเหลว:", err);
  process.exit(1);
});
