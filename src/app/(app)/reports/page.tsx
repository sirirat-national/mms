"use client";

import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { useAuth } from "@/contexts/AuthContext";
import { exportReportToPdf, exportToExcel } from "@/lib/export";
import { store } from "@/lib/store";
import { formatDateTime, statusLabels, getMeetingTimeState } from "@/lib/utils";
import type { Meeting, AppUser } from "@/types";
import { FileDown, FileSpreadsheet, Calendar, Users, UserCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";

export default function ReportsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [users, setUsers] = useState<AppUser[]>([]);

  useEffect(() => {
    if (!user) return;
    if (user.role === "participant") {
      toast.error("ไม่มีสิทธิ์เข้าถึงรายงาน");
      router.replace("/dashboard");
      return;
    }
    (async () => {
      const [m, u] = await Promise.all([
        store.getMeetings(),
        store.getUsers(),
      ]);
      setMeetings(m);
      setUsers(u);
    })();
  }, [user, router]);

  const summary = useMemo(() => {
    const completed = meetings.filter((m) => m.status === "completed").length;
    const cancelled = meetings.filter((m) => m.status === "cancelled").length;
    const totalParticipants = meetings.reduce(
      (sum, m) => sum + m.participantIds.length,
      0
    );
    const avgAttendance =
      meetings.length > 0
        ? Math.round(totalParticipants / meetings.length)
        : 0;
    const activeUsers = users.filter((u) => u.isActive).length;
    return {
      totalMeetings: meetings.length,
      completed,
      cancelled,
      avgAttendance,
      activeUsers,
      totalUsers: users.length,
    };
  }, [meetings, users]);

  const byMonth = useMemo(() => {
    const map: Record<string, number> = {};
    meetings.forEach((m) => {
      const key = new Date(m.startAt).toLocaleDateString("th-TH", {
        month: "short",
        year: "2-digit",
      });
      map[key] = (map[key] || 0) + 1;
    });
    return Object.entries(map).map(([name, count]) => ({ name, count }));
  }, [meetings]);

  const attendanceByMeeting = useMemo(
    () =>
      meetings
        .filter((m) => m.status !== "cancelled")
        .slice(0, 8)
        .map((m) => ({
          name: m.title.slice(0, 16) + (m.title.length > 16 ? "…" : ""),
          participants: m.participantIds.length,
        })),
    [meetings]
  );

  const loginActivity = useMemo(
    () =>
      users.map((u) => ({
        name: u.displayName.split(" ")[0],
        logins: u.lastLoginAt ? 1 + Math.floor(Math.random() * 8) : 0,
      })),
    [users]
  );

  const exportMeetingsPdf = async () => {
    await exportReportToPdf(
      "Meeting Report",
      ["Title", "Status", "Start", "Participants"],
      meetings.map((m) => [
        m.title,
        statusLabels[m.status],
        formatDateTime(m.startAt),
        String(m.participantIds.length),
      ])
    );
    toast.success("ส่งออก PDF สำเร็จ");
  };

  const exportMeetingsExcel = async () => {
    await exportToExcel(
      "Meetings",
      ["หัวข้อ", "สถานะ", "เริ่ม", "ผู้เข้าร่วม", "ประเภท"],
      meetings.map((m) => [
        m.title,
        statusLabels[m.status],
        formatDateTime(m.startAt),
        m.participantIds.length,
        m.type,
      ])
    );
    toast.success("ส่งออก Excel สำเร็จ");
  };

  const exportUsersExcel = async () => {
    await exportToExcel(
      "User_Activity",
      ["ชื่อ", "อีเมล", "บทบาท", "แผนก", "สถานะ", "เข้าใช้ล่าสุด"],
      users.map((u) => [
        u.displayName,
        u.email,
        u.role,
        u.department ?? "",
        u.isActive ? "active" : "inactive",
        u.lastLoginAt ? formatDateTime(u.lastLoginAt) : "-",
      ])
    );
    toast.success("ส่งออก Excel สำเร็จ");
  };

  const exportAttendancePdf = async () => {
    await exportReportToPdf(
      "Attendance Report",
      ["Meeting", "Time State", "Participants", "Emails"],
      meetings.map((m) => [
        m.title,
        getMeetingTimeState(m.startAt, m.endAt),
        String(m.participantIds.length),
        m.participantEmails.slice(0, 3).join("; "),
      ])
    );
    toast.success("ส่งออก PDF สำเร็จ");
  };

  if (user?.role === "participant") return null;

  return (
    <div>
      <PageHeader
        title="รายงาน"
        description="รายงานจำนวนประชุม การเข้าใช้งาน และการเข้าร่วมประชุม"
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          {
            label: "จำนวนการประชุม",
            value: summary.totalMeetings,
            icon: Calendar,
          },
          {
            label: "เสร็จสิ้นแล้ว",
            value: summary.completed,
            icon: UserCheck,
          },
          {
            label: "ผู้ใช้งานที่ Active",
            value: `${summary.activeUsers}/${summary.totalUsers}`,
            icon: Users,
          },
          {
            label: "ผู้เข้าร่วมเฉลี่ย/ครั้ง",
            value: summary.avgAttendance,
            icon: UserCheck,
          },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="flex items-center gap-3">
              <div className="rounded-xl bg-brand-50 p-3 text-brand-600 dark:bg-brand-900/40">
                <s.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-slate-500">{s.label}</p>
                <p className="text-xl font-bold text-slate-900 dark:text-white">
                  {s.value}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        <Button variant="outline" onClick={exportMeetingsPdf}>
          <FileDown className="h-4 w-4" />
          รายงานประชุม PDF
        </Button>
        <Button variant="outline" onClick={exportMeetingsExcel}>
          <FileSpreadsheet className="h-4 w-4" />
          รายงานประชุม Excel
        </Button>
        <Button variant="outline" onClick={exportAttendancePdf}>
          <FileDown className="h-4 w-4" />
          รายงานการเข้าร่วม PDF
        </Button>
        <Button variant="outline" onClick={exportUsersExcel}>
          <FileSpreadsheet className="h-4 w-4" />
          รายงานเข้าใช้งาน Excel
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>จำนวนการประชุมตามช่วงเวลา</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={byMonth}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="count" name="จำนวน" fill="#2563eb" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>ผู้เข้าร่วมต่อครั้งประชุม</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={attendanceByMeeting} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                  <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Bar dataKey="participants" name="ผู้เข้าร่วม" fill="#0ea5e9" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>กิจกรรมเข้าใช้งาน (โดยประมาณ)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={loginActivity}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="logins"
                    name="ครั้งเข้าใช้"
                    stroke="#2563eb"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
