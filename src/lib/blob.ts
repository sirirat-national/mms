import { put, del } from "@vercel/blob";

/**
 * Upload file to Vercel Blob (server-side).
 * Requires BLOB_READ_WRITE_TOKEN in env.
 */
export async function uploadToVercelBlob(
  file: File | Blob,
  pathname: string
): Promise<{ url: string; pathname: string }> {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) {
    throw new Error(
      "ยังไม่ได้ตั้งค่า BLOB_READ_WRITE_TOKEN — สร้าง Blob store ใน Vercel แล้วใส่ token ใน .env"
    );
  }

  const blob = await put(pathname, file, {
    access: "public",
    token,
    addRandomSuffix: true,
  });

  return { url: blob.url, pathname: blob.pathname };
}

export async function deleteFromVercelBlob(url: string): Promise<void> {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token || !url) return;
  try {
    await del(url, { token });
  } catch {
    // ignore
  }
}
