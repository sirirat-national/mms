import { NextRequest, NextResponse } from "next/server";
import { uploadToVercelBlob } from "@/lib/blob";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const file = form.get("file");
    const folder = String(form.get("folder") || "meetings");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "ไม่พบไฟล์ (field: file)" },
        { status: 400 }
      );
    }

    if (file.size > 20 * 1024 * 1024) {
      return NextResponse.json(
        { error: "ไฟล์ใหญ่เกิน 20MB" },
        { status: 400 }
      );
    }

    const safeName = file.name.replace(/[^a-zA-Z0-9._\-\u0E00-\u0E7F]/g, "_");
    const pathname = `${folder}/${Date.now()}_${safeName}`;
    const result = await uploadToVercelBlob(file, pathname);

    return NextResponse.json({
      url: result.url,
      pathname: result.pathname,
      name: file.name,
      size: file.size,
      mimeType: file.type || "application/octet-stream",
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      {
        error:
          err instanceof Error ? err.message : "อัปโหลดไฟล์ไม่สำเร็จ",
      },
      { status: 500 }
    );
  }
}
