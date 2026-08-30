# MeetCloud — ระบบคลาวด์การจัดการประชุมออนไลน์ครบวงจร

พัฒนาด้วย **Next.js**, **Firebase Auth/Firestore**, **Vercel Blob**, และ **Tailwind CSS**

## เริ่มใช้งาน

ดูคู่มือเต็มใน **[FIREBASE.md](./FIREBASE.md)**

```bash
# ใส่ค่า Firebase + BLOB_READ_WRITE_TOKEN ใน .env
npm install
npm run seed    # ใส่ข้อมูล mock ลง Firebase
npm run dev
```

ล็อกอินด้วย: `admin@meetcloud.app` / `12345678`

## Storage

| เดิม | ตอนนี้ |
|------|--------|
| Firebase Storage | **Vercel Blob** (`BLOB_READ_WRITE_TOKEN`) |

ไฟล์อัปโหลดผ่าน `POST /api/upload`

## Security Rules

วาง `firestore.rules` ใน Firebase Console → Firestore → Rules
