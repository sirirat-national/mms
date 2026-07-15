"use client";

import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { FileText } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

export default function RegisterPage() {
  const { register, user, loading } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({
    displayName: "",
    email: "",
    password: "",
    confirm: "",
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user) router.replace("/dashboard");
  }, [user, loading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.confirm) {
      toast.error("รหัสผ่านไม่ตรงกัน");
      return;
    }
    setSubmitting(true);
    try {
      await register({
        email: form.email,
        password: form.password,
        displayName: form.displayName,
      });
      toast.success("สมัครสมาชิกสำเร็จ");
      router.push("/dashboard");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "สมัครไม่สำเร็จ");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-brand-50 to-slate-100 px-4 py-12 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-xl shadow-slate-200/50 dark:border-slate-800 dark:bg-slate-900 dark:shadow-none">
        <div className="mb-6 flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600 text-white">
            <FileText className="h-5 w-5" />
          </div>
          <span className="text-lg font-bold text-slate-900 dark:text-white">
            MeetCloud
          </span>
        </div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          สมัครสมาชิก
        </h1>
        <p className="mt-1 text-sm text-slate-500">สร้างบัญชีเพื่อเริ่มใช้งานระบบ</p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <Input
            id="name"
            label="ชื่อ-นามสกุล"
            value={form.displayName}
            onChange={(e) => setForm({ ...form, displayName: e.target.value })}
            required
          />
          <Input
            id="email"
            label="อีเมล"
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
          />
          <Input
            id="password"
            label="รหัสผ่าน"
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
            minLength={6}
          />
          <Input
            id="confirm"
            label="ยืนยันรหัสผ่าน"
            type="password"
            value={form.confirm}
            onChange={(e) => setForm({ ...form, confirm: e.target.value })}
            required
          />
          <Button type="submit" className="w-full" size="lg" disabled={submitting}>
            {submitting ? "กำลังสมัคร..." : "สมัครสมาชิก"}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          มีบัญชีแล้ว?{" "}
          <Link href="/login" className="font-medium text-brand-600">
            เข้าสู่ระบบ
          </Link>
        </p>
      </div>
    </div>
  );
}
