"use client";

import { formatFileSize, generateId } from "@/lib/utils";
import type { CloudDocument, DocumentCategory } from "@/types";
import { FileText, Trash2, Upload } from "lucide-react";
import { useRef } from "react";

const allowedExt =
  /\.(pdf|doc|docx|xls|xlsx|ppt|pptx|png|jpg|jpeg|gif|webp)$/i;

export type PendingDocument = CloudDocument & {
  file?: File;
  storagePath?: string;
};

export function DocumentUploader({
  files,
  onChange,
  uploadedBy,
  uploadedByName,
  meetingId,
  category = "other",
  label = "อัปโหลดเอกสารการประชุม",
}: {
  files: PendingDocument[];
  onChange: (files: PendingDocument[]) => void;
  uploadedBy: string;
  uploadedByName: string;
  meetingId?: string;
  category?: DocumentCategory;
  label?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = (list: FileList | null) => {
    if (!list?.length) return;
    const next: PendingDocument[] = [];
    Array.from(list).forEach((file) => {
      if (!allowedExt.test(file.name)) return;
      const id = generateId("doc");
      next.push({
        id,
        name: file.name,
        category,
        mimeType: file.type || "application/octet-stream",
        size: file.size,
        meetingId,
        uploadedBy,
        uploadedByName,
        downloadUrl: "",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        file,
      });
    });
    if (next.length) onChange([...files, ...next]);
    if (inputRef.current) inputRef.current.value = "";
  };

  const remove = (id: string) => {
    onChange(files.filter((f) => f.id !== id));
  };

  return (
    <div>
      <p className="mb-2 text-sm font-medium text-slate-700 dark:text-slate-300">
        {label}
      </p>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="flex w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-sm text-slate-500 transition-colors hover:border-brand-400 hover:bg-brand-50/50 hover:text-brand-700 dark:border-slate-600 dark:bg-slate-800/50 dark:hover:border-brand-500 dark:hover:bg-brand-950/30"
      >
        <Upload className="h-6 w-6" />
        <span>คลิกเพื่อเลือกไฟล์</span>
        <span className="text-xs text-slate-400">
          PDF, Word, Excel, PowerPoint, รูปภาพ (สูงสุด 20MB)
        </span>
      </button>
      <input
        ref={inputRef}
        type="file"
        multiple
        accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.png,.jpg,.jpeg,.gif,.webp"
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />

      {files.length > 0 && (
        <ul className="mt-3 space-y-2">
          {files.map((f) => (
            <li
              key={f.id}
              className="flex items-center gap-3 rounded-lg border border-slate-200 px-3 py-2 dark:border-slate-700"
            >
              <FileText className="h-4 w-4 shrink-0 text-brand-600" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-slate-900 dark:text-white">
                  {f.name}
                </p>
                <p className="text-xs text-slate-400">
                  {formatFileSize(f.size)}
                  {f.file ? " · รออัปโหลด" : ""}
                </p>
              </div>
              <button
                type="button"
                onClick={() => remove(f.id)}
                className="rounded p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
