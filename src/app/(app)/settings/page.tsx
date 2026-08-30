"use client";

import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { roleLabels } from "@/lib/utils";
import { isFirebaseConfigured } from "@/lib/firebase";
import { Moon, Sun, Database, CheckCircle2, AlertTriangle } from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

export default function SettingsPage() {
  const { user, updateProfile } = useAuth();
  const { theme, setTheme } = useTheme();
  const [form, setForm] = useState({
    displayName: user?.displayName ?? "",
    department: user?.department ?? "",
    phone: user?.phone ?? "",
  });

  useEffect(() => {
    if (user) {
      setForm({
        displayName: user.displayName,
        department: user.department ?? "",
        phone: user.phone ?? "",
      });
    }
  }, [user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateProfile(form);
    toast.success("บันทึกโปรไฟล์แล้ว");
  };

  return (
    <div>
      <PageHeader
        title="ตั้งค่า"
        description="จัดการโปรไฟล์และค่าการแสดงผล"
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>โปรไฟล์</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSave} className="space-y-4">
              <Input
                label="ชื่อ-นามสกุล"
                value={form.displayName}
                onChange={(e) =>
                  setForm({ ...form, displayName: e.target.value })
                }
              />
              <Input label="อีเมล" value={user?.email ?? ""} disabled />
              <Input
                label="บทบาท"
                value={user ? roleLabels[user.role] : ""}
                disabled
              />
              <Input
                label="แผนก"
                value={form.department}
                onChange={(e) =>
                  setForm({ ...form, department: e.target.value })
                }
              />
              <Input
                label="เบอร์โทร"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
              <Button type="submit">บันทึกโปรไฟล์</Button>
            </form>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>ธีม / Dark Mode</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Button
                  variant={theme === "light" ? "primary" : "outline"}
                  onClick={() => setTheme("light")}
                  className="flex-1"
                >
                  <Sun className="h-4 w-4" />
                  สว่าง
                </Button>
                <Button
                  variant={theme === "dark" ? "primary" : "outline"}
                  onClick={() => setTheme("dark")}
                  className="flex-1"
                >
                  <Moon className="h-4 w-4" />
                  มืด
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-4 w-4" />
                ฐานข้อมูล
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg bg-slate-50 p-3 text-sm dark:bg-slate-800">
                {isFirebaseConfigured ? (
                  <div className="flex gap-2 text-emerald-700 dark:text-emerald-300">
                    <CheckCircle2 className="h-5 w-5 shrink-0" />
                    <div>
                      <p className="font-medium">เชื่อมต่อ Firebase แล้ว</p>
                      <p className="mt-1 text-xs opacity-80">
                        Auth / Firestore / Storage — ข้อมูลจริง ไม่ใช่ mock
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-2 text-amber-700 dark:text-amber-300">
                    <AlertTriangle className="h-5 w-5 shrink-0" />
                    <div>
                      <p className="font-medium">ยังไม่ได้ตั้งค่า Firebase</p>
                      <p className="mt-1 text-xs opacity-80">
                        คัดลอก .env.example เป็น .env.local แล้วใส่ค่าจาก
                        Firebase Console
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
