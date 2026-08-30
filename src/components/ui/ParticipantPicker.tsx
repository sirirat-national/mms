"use client";

import { cn } from "@/lib/utils";
import type { AppUser } from "@/types";
import { Search, X } from "lucide-react";
import { useMemo, useState } from "react";

export function ParticipantPicker({
  users,
  selectedIds,
  onChange,
  excludeIds = [],
  label = "เชิญผู้เข้าร่วม",
}: {
  users: AppUser[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  excludeIds?: string[];
  label?: string;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);

  const available = useMemo(
    () => users.filter((u) => !excludeIds.includes(u.id) && u.isActive),
    [users, excludeIds]
  );

  const selected = useMemo(
    () => available.filter((u) => selectedIds.includes(u.id)),
    [available, selectedIds]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return available;
    return available.filter(
      (u) =>
        u.displayName.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        (u.department?.toLowerCase().includes(q) ?? false)
    );
  }, [available, query]);

  const toggle = (id: string) => {
    onChange(
      selectedIds.includes(id)
        ? selectedIds.filter((x) => x !== id)
        : [...selectedIds, id]
    );
  };

  const remove = (id: string) => {
    onChange(selectedIds.filter((x) => x !== id));
  };

  return (
    <div>
      <p className="mb-2 text-sm font-medium text-slate-700 dark:text-slate-300">
        {label}
      </p>

      {selected.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-1.5">
          {selected.map((u) => (
            <span
              key={u.id}
              className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-200"
            >
              {u.displayName}
              <button
                type="button"
                onClick={() => remove(u.id)}
                className="rounded text-slate-400 hover:text-slate-700"
                aria-label={`ลบ ${u.displayName}`}
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder="ค้นหาชื่อ หรือ อีเมล..."
          className="h-10 w-full rounded-lg border border-slate-300 bg-white pl-10 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100"
        />

        {open && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
            <div className="absolute z-20 mt-1 max-h-56 w-full overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-900">
              {filtered.length === 0 ? (
                <p className="px-3 py-4 text-center text-sm text-slate-400">
                  ไม่พบผู้ใช้
                </p>
              ) : (
                filtered.map((u) => {
                  const checked = selectedIds.includes(u.id);
                  return (
                    <label
                      key={u.id}
                      className={cn(
                        "flex cursor-pointer items-center gap-3 px-3 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800",
                        checked && "bg-brand-50/60 dark:bg-brand-900/20"
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggle(u.id)}
                        className="h-4 w-4 rounded border-slate-300 text-brand-600"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-slate-900 dark:text-white">
                          {u.displayName}
                        </p>
                        <p className="truncate text-xs text-slate-500">
                          {u.email}
                        </p>
                      </div>
                    </label>
                  );
                })
              )}
            </div>
          </>
        )}
      </div>

      <p className="mt-1.5 text-xs text-slate-400">
        เลือกแล้ว {selectedIds.length} คน — ค้นหาแล้วติ๊ก Checkbox
      </p>
    </div>
  );
}
