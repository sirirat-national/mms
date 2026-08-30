"use client";

import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card, CardContent } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";
import { Pagination, usePagedItems } from "@/components/ui/Pagination";
import { useAuth } from "@/contexts/AuthContext";
import { store } from "@/lib/store";
import { roleLabels, formatDate } from "@/lib/utils";
import type { AppUser, UserRole } from "@/types";
import { Plus, Pencil, Trash2, Shield } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

const PAGE_SIZE = 5;

const roleVariant: Record<UserRole, "red" | "blue" | "gray"> = {
  admin: "red",
  organizer: "blue",
  participant: "gray",
};

export default function UsersPage() {
  const { user, createUserAsAdmin } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<AppUser[]>([]);
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    displayName: "",
    email: "",
    password: "",
    role: "participant" as UserRole,
    department: "",
    phone: "",
    isActive: true,
  });

  const refresh = async () => {
    setUsers(await store.getUsers());
  };

  useEffect(() => {
    if (!user) return;
    if (user.role !== "admin") {
      toast.error("เฉพาะผู้ดูแลระบบเท่านั้น");
      router.replace("/dashboard");
      return;
    }
    refresh().finally(() => setLoading(false));
  }, [user, router]);

  const openCreate = () => {
    setEditing(null);
    setForm({
      displayName: "",
      email: "",
      password: "",
      role: "participant",
      department: "",
      phone: "",
      isActive: true,
    });
    setOpen(true);
  };

  const openEdit = (u: AppUser) => {
    setEditing(u);
    setForm({
      displayName: u.displayName,
      email: u.email,
      password: "",
      role: u.role,
      department: u.department ?? "",
      phone: u.phone ?? "",
      isActive: u.isActive,
    });
    setOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) {
        await store.upsertUser({
          ...editing,
          displayName: form.displayName,
          role: form.role,
          department: form.department,
          phone: form.phone,
          isActive: form.isActive,
        });
        toast.success("อัปเดตผู้ใช้แล้ว");
      } else {
        if (form.password.length < 6) {
          toast.error("รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร");
          setSaving(false);
          return;
        }
        await createUserAsAdmin({
          email: form.email,
          password: form.password,
          displayName: form.displayName,
          role: form.role,
          department: form.department,
          phone: form.phone,
        });
        toast.success("เพิ่มผู้ใช้แล้ว");
      }
      setOpen(false);
      await refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "บันทึกไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (u: AppUser) => {
    if (u.id === user?.id) {
      toast.error("ไม่สามารถลบบัญชีของตนเองได้");
      return;
    }
    if (!confirm(`ลบผู้ใช้ "${u.displayName}" หรือไม่?`)) return;
    await store.deleteUser(u.id);
    await refresh();
    toast.success("ลบผู้ใช้แล้ว");
  };

  if (user?.role !== "admin") return null;

  const { paged, totalPages, safePage, total } = usePagedItems(
    users,
    page,
    PAGE_SIZE
  );

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-200 border-t-brand-600" />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="จัดการผู้ใช้งาน"
        description="เพิ่ม แก้ไข ลบ และกำหนดสิทธิ์ผู้ใช้งาน (Firebase Auth)"
        action={
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" />
            เพิ่มผู้ใช้
          </Button>
        }
      />

      <Card>
        <CardContent className="!p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-100 bg-slate-50 text-xs uppercase text-slate-500 dark:border-slate-800 dark:bg-slate-900">
                <tr>
                  <th className="px-5 py-3 font-medium">ผู้ใช้</th>
                  <th className="px-5 py-3 font-medium">แผนก</th>
                  <th className="px-5 py-3 font-medium">สิทธิ์</th>
                  <th className="px-5 py-3 font-medium">สถานะ</th>
                  <th className="px-5 py-3 font-medium">วันที่สร้าง</th>
                  <th className="px-5 py-3 font-medium"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {paged.map((u) => (
                  <tr
                    key={u.id}
                    className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30"
                  >
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-100 text-sm font-bold text-brand-700 dark:bg-brand-900/50 dark:text-brand-300">
                          {u.displayName.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium text-slate-900 dark:text-white">
                            {u.displayName}
                          </p>
                          <p className="text-xs text-slate-500">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-slate-600 dark:text-slate-300">
                      {u.department || "—"}
                    </td>
                    <td className="px-5 py-3">
                      <Badge variant={roleVariant[u.role]}>
                        <Shield className="mr-1 h-3 w-3" />
                        {roleLabels[u.role]}
                      </Badge>
                    </td>
                    <td className="px-5 py-3">
                      <Badge variant={u.isActive ? "green" : "red"}>
                        {u.isActive ? "ใช้งาน" : "ระงับ"}
                      </Badge>
                    </td>
                    <td className="px-5 py-3 text-slate-500">
                      {formatDate(u.createdAt)}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEdit(u)}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-600"
                          onClick={() => handleDelete(u)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Pagination
        page={safePage}
        totalPages={totalPages}
        total={total}
        pageSize={PAGE_SIZE}
        onChange={setPage}
      />

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? "แก้ไขผู้ใช้" : "เพิ่มผู้ใช้"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="ชื่อ-นามสกุล *"
            value={form.displayName}
            onChange={(e) => setForm({ ...form, displayName: e.target.value })}
            required
          />
          <Input
            label="อีเมล *"
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
            disabled={!!editing}
          />
          {!editing && (
            <Input
              label="รหัสผ่านเริ่มต้น *"
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
              minLength={6}
            />
          )}
          <Select
            label="สิทธิ์การใช้งาน *"
            value={form.role}
            onChange={(e) =>
              setForm({ ...form, role: e.target.value as UserRole })
            }
            options={[
              { value: "admin", label: "ผู้ดูแลระบบ" },
              { value: "organizer", label: "ผู้จัดประชุม" },
              { value: "participant", label: "ผู้เข้าร่วม" },
            ]}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="แผนก"
              value={form.department}
              onChange={(e) => setForm({ ...form, department: e.target.value })}
            />
            <Input
              label="เบอร์โทร"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
          </div>
          <Select
            label="สถานะ"
            value={form.isActive ? "1" : "0"}
            onChange={(e) =>
              setForm({ ...form, isActive: e.target.value === "1" })
            }
            options={[
              { value: "1", label: "ใช้งาน" },
              { value: "0", label: "ระงับ" },
            ]}
          />
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              ยกเลิก
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "กำลังบันทึก..." : editing ? "บันทึก" : "เพิ่มผู้ใช้"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
