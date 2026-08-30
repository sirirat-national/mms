"use client";

import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/contexts/AuthContext";
import { store } from "@/lib/store";
import { formatDateTime, getMeetingTimeState, statusLabels } from "@/lib/utils";
import {
  Calendar,
  Users,
  Clock,
  History,
  FileText,
  ArrowRight,
  Plus,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { Meeting, CloudDocument, AppUser } from "@/types";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from "recharts";

const STATUS_COLORS = {
  scheduled: "#2563eb",
  ongoing: "#10b981",
  completed: "#64748b",
  cancelled: "#ef4444",
};

export default function DashboardPage() {
  const { user } = useAuth();
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [users, setUsers] = useState<AppUser[]>([]);
  const [documents, setDocuments] = useState<CloudDocument[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [m, u, d] = await Promise.all([
          store.getMeetings(),
          store.getUsers(),
          store.getDocuments(),
        ]);
        if (!cancelled) {
          setMeetings(m);
          setUsers(u);
          setDocuments(d);
        }
      } finally {
        if (!cancelled) setLoadingData(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const stats = useMemo(() => {
    const upcoming = meetings.filter(
      (m) =>
        getMeetingTimeState(m.startAt, m.endAt) === "upcoming" &&
        m.status !== "cancelled"
    ).length;
    const past = meetings.filter(
      (m) =>
        getMeetingTimeState(m.startAt, m.endAt) === "past" ||
        m.status === "completed"
    ).length;
    return {
      totalMeetings: meetings.length,
      totalUsers: users.length,
      upcoming,
      past,
      documents: documents.length,
    };
  }, [meetings, users, documents]);

  const upcomingList = useMemo(
    () =>
      meetings
        .filter(
          (m) =>
            getMeetingTimeState(m.startAt, m.endAt) === "upcoming" &&
            m.status !== "cancelled"
        )
        .sort(
          (a, b) =>
            new Date(a.startAt).getTime() - new Date(b.startAt).getTime()
        )
        .slice(0, 5),
    [meetings]
  );

  const monthlyData = useMemo(() => {
    const months = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค."];
    return months.map((name, i) => ({
      name,
      meetings: meetings.filter((m) => new Date(m.startAt).getMonth() === i)
        .length,
      users: users.length,
    }));
  }, [meetings, users]);

  const statusData = useMemo(() => {
    const counts: Record<string, number> = {};
    meetings.forEach((m) => {
      counts[m.status] = (counts[m.status] || 0) + 1;
    });
    return Object.entries(counts).map(([status, value]) => ({
      name: statusLabels[status as keyof typeof statusLabels],
      value,
      status,
    }));
  }, [meetings]);

  const typeData = useMemo(() => {
    const labels = { online: "ออนไลน์", onsite: "สถานที่", hybrid: "ไฮบริด" };
    const counts: Record<string, number> = {};
    meetings.forEach((m) => {
      counts[m.type] = (counts[m.type] || 0) + 1;
    });
    return Object.entries(counts).map(([type, value]) => ({
      name: labels[type as keyof typeof labels] || type,
      value,
    }));
  }, [meetings]);

  const statCards = [
    {
      label: "การประชุมทั้งหมด",
      value: stats.totalMeetings,
      icon: Calendar,
      color: "bg-brand-50 text-brand-600 dark:bg-brand-900/40 dark:text-brand-300",
    },
    {
      label: "ผู้ใช้งาน",
      value: stats.totalUsers,
      icon: Users,
      color:
        "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-300",
    },
    {
      label: "กำลังจะมาถึง",
      value: stats.upcoming,
      icon: Clock,
      color: "bg-amber-50 text-amber-600 dark:bg-amber-900/40 dark:text-amber-300",
    },
    {
      label: "การประชุมที่ผ่านมา",
      value: stats.past,
      icon: History,
      color: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
    },
  ];

  if (loadingData) {
    return (
      <div className="flex justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-200 border-t-brand-600" />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title={`สวัสดี, ${user?.displayName.split(" ")[0] ?? ""}`}
        description="ภาพรวมระบบจัดการประชุม (Firebase)"
        action={
          <Link href="/meetings/new">
            <Button>
              <Plus className="h-4 w-4" />
              สร้างการประชุม
            </Button>
          </Link>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statCards.map((s) => (
          <Card key={s.label}>
            <CardContent className="flex items-center gap-4">
              <div className={`rounded-xl p-3 ${s.color}`}>
                <s.icon className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {s.label}
                </p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">
                  {s.value}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>สถิติการประชุมรายเดือน</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyData}>
                  <defs>
                    <linearGradient id="colorMtg" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                  <Tooltip />
                  <Area
                    type="monotone"
                    dataKey="meetings"
                    name="การประชุม"
                    stroke="#2563eb"
                    fill="url(#colorMtg)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>สถานะการประชุม</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              {statusData.length === 0 ? (
                <p className="flex h-full items-center justify-center text-sm text-slate-400">
                  ยังไม่มีข้อมูล
                </p>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={85}
                      paddingAngle={3}
                    >
                      {statusData.map((entry) => (
                        <Cell
                          key={entry.status}
                          fill={
                            STATUS_COLORS[
                              entry.status as keyof typeof STATUS_COLORS
                            ]
                          }
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader
            action={
              <Link
                href="/meetings"
                className="flex items-center gap-1 text-sm text-brand-600"
              >
                ดูทั้งหมด <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            }
          >
            <CardTitle>การประชุมที่กำลังจะมาถึง</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 !pt-0">
            {upcomingList.length === 0 ? (
              <p className="py-8 text-center text-sm text-slate-400">
                ไม่มีการประชุมที่กำลังจะมาถึง
              </p>
            ) : (
              upcomingList.map((m) => (
                <Link
                  key={m.id}
                  href={`/meetings/${m.id}`}
                  className="flex items-start gap-3 rounded-xl border border-slate-100 p-3 hover:bg-slate-50 dark:border-slate-800"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                    <Calendar className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{m.title}</p>
                    <p className="text-xs text-slate-500">
                      {formatDateTime(m.startAt)}
                    </p>
                  </div>
                  <Badge variant="blue">
                    {m.type === "online"
                      ? "ออนไลน์"
                      : m.type === "hybrid"
                        ? "ไฮบริด"
                        : "สถานที่"}
                  </Badge>
                </Link>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>ประเภทการประชุม</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={typeData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar
                    dataKey="value"
                    name="จำนวน"
                    fill="#2563eb"
                    radius={[6, 6, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-2 flex items-center gap-2 rounded-lg bg-slate-50 p-3 text-sm text-slate-600 dark:bg-slate-800">
              <FileText className="h-4 w-4 text-brand-600" />
              เอกสารบนคลาวด์ทั้งหมด {stats.documents} ไฟล์
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
