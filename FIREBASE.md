# คู่มือ Firebase + Vercel Blob — MeetCloud

## สิ่งที่ใช้

| บริการ | ใช้ทำอะไร |
|--------|-----------|
| **Firebase Auth** | Login / Register |
| **Cloud Firestore** | ข้อมูลประชุม ผู้ใช้ รายงาน แจ้งเตือน |
| **Vercel Blob** | อัปโหลดไฟล์เอกสาร (แทน Firebase Storage) |

ไม่ต้องเปิด Firebase Storage

## 1. Firebase

1. เปิด **Authentication** → Email/Password
2. เปิด **Firestore Database**
3. วางไฟล์ `firestore.rules` แล้ว Publish
4. ใส่ค่าใน `.env` / `.env.local`

## 2. Vercel Blob

1. ไป [Vercel Dashboard](https://vercel.com/dashboard) → **Storage** → **Create** → **Blob**
2. คัดลอก `BLOB_READ_WRITE_TOKEN` ใส่ใน `.env`
3. รีสตาร์ท `npm run dev`

อัปโหลดไฟล์ผ่าน API: `POST /api/upload`

## 3. Seed ข้อมูล mock

Publish `firestore.rules` ล่าสุดก่อน แล้วรัน:

```bash
npm run seed
```

จะสร้าง Auth users + ข้อมูลใน Firestore

| บทบาท | อีเมล | รหัสผ่าน |
|--------|--------|----------|
| Admin | `admin@meetcloud.app` | `12345678` |
| ผู้จัดประชุม | `organizer@meetcloud.app` | `12345678` |
| ผู้เข้าร่วม | `user@meetcloud.app` | `12345678` |
| ผู้เข้าร่วม | `nattaya@meetcloud.app` | `12345678` |
| ผู้จัดประชุม | `pakorn@meetcloud.app` | `12345678` |

เอกสารใน seed เป็นแค่ metadata (ยังไม่มีไฟล์จริง) — อัปโหลดใหม่ผ่านระบบจะไปที่ Vercel Blob
