/**
 * Client helper — อัปโหลดไฟล์ผ่าน Vercel Blob API
 */
export async function uploadFileToStorage(
  file: File,
  path: string
): Promise<string> {
  const folder = path.includes("/") ? path.split("/")[0] : "meetings";
  const form = new FormData();
  form.append("file", file);
  form.append("folder", folder);

  const res = await fetch("/api/upload", {
    method: "POST",
    body: form,
  });

  const data = (await res.json()) as { url?: string; error?: string };
  if (!res.ok || !data.url) {
    throw new Error(data.error || "อัปโหลดไฟล์ไม่สำเร็จ");
  }
  return data.url;
}
