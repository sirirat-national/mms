"use client";

import { useAuth } from "@/contexts/AuthContext";
import { isFirebaseConfigured } from "@/lib/firebase";
import { SITE_NAME } from "@/lib/brand";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { FileText, Eye, EyeOff, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

export default function LoginPage() {
  const { login, user, loading } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user) router.replace("/dashboard");
  }, [user, loading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await login(email, password);
      toast.success("เข้าสู่ระบบสำเร็จ");
      router.push("/dashboard");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "เข้าสู่ระบบไม่สำเร็จ");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      <div className="relative hidden w-1/2 overflow-hidden bg-brand-800 lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 30%, #3b82f6 0%, transparent 40%), radial-gradient(circle at 80% 70%, #1e40af 0%, transparent 45%)",
          }}
        />
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
        <div className="relative flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15 text-white backdrop-blur">
            <FileText className="h-6 w-6" />
          </div>
          <div>
            <p className="max-w-sm text-lg font-bold leading-snug text-white">
              {SITE_NAME}
            </p>
            <p className="text-xs text-brand-200">Meeting Room Management</p>
          </div>
        </div>
        <div className="relative max-w-md">
          <h1 className="text-4xl font-bold leading-tight text-white">
            ระบบคลาวด์การจัดการ
            <br />
            ห้องประชุม
            <span className="text-brand-300">ครบวงจร</span>
          </h1>
          <p className="mt-4 text-brand-100/80">
            จัดการนัดหมาย เอกสาร รายงาน และผู้เข้าร่วมประชุม ในที่เดียว
            เชื่อมต่อ Firebase
          </p>
        </div>
        <p className="relative text-xs text-brand-300/60">
          © {new Date().getFullYear()} {SITE_NAME}
        </p>
      </div>

      <div className="flex w-full flex-col justify-center px-6 py-12 lg:w-1/2 lg:px-16">
        <div className="mx-auto w-full max-w-md">
          <div className="mb-8 flex items-center gap-2 lg:hidden">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600 text-white">
              <FileText className="h-5 w-5" />
            </div>
            <span className="text-sm font-bold leading-snug text-slate-900 dark:text-white">
              {SITE_NAME}
            </span>
          </div>

          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            เข้าสู่ระบบ
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            กรอกอีเมลและรหัสผ่านเพื่อเข้าใช้งาน
          </p>

          {!isFirebaseConfigured && (
            <div className="mt-4 flex gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <div>
                ยังไม่ได้ตั้งค่า Firebase — คัดลอก{" "}
                <code className="rounded bg-white/70 px-1">.env.example</code> เป็น{" "}
                <code className="rounded bg-white/70 px-1">.env.local</code>{" "}
                แล้วใส่ค่าจาก Firebase Console
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <Input
              id="email"
              label="อีเมล"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@company.com"
              required
            />
            <div className="relative">
              <Input
                id="password"
                label="รหัสผ่าน"
                type={showPw ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                onClick={() => setShowPw(!showPw)}
                className="absolute right-3 top-8 text-slate-400 hover:text-slate-600"
              >
                {showPw ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            <div className="flex justify-end">
              <Link
                href="/forgot-password"
                className="text-sm text-brand-600 hover:text-brand-700"
              >
                ลืมรหัสผ่าน?
              </Link>
            </div>
            <Button
              type="submit"
              className="w-full"
              size="lg"
              disabled={submitting || !isFirebaseConfigured}
            >
              {submitting ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500">
            ยังไม่มีบัญชี?{" "}
            <Link
              href="/register"
              className="font-medium text-brand-600 hover:text-brand-700"
            >
              สมัครสมาชิก
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
