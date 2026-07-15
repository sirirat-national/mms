"use client";

import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Badge } from "@/components/ui/Badge";
import { useAuth } from "@/contexts/AuthContext";
import { store } from "@/lib/store";
import { cn, formatDateTime } from "@/lib/utils";
import type { AppNotification, NotificationType } from "@/types";
import {
  Bell,
  Calendar,
  FileText,
  RefreshCw,
  Mail,
  CheckCheck,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";

const typeMeta: Record<
  NotificationType,
  {
    icon: typeof Bell;
    label: string;
    variant: "blue" | "green" | "yellow" | "purple" | "gray";
  }
> = {
  meeting_reminder: { icon: Calendar, label: "ก่อนประชุม", variant: "yellow" },
  new_document: { icon: FileText, label: "เอกสารใหม่", variant: "blue" },
  schedule_change: {
    icon: RefreshCw,
    label: "แก้ไขกำหนดการ",
    variant: "purple",
  },
  meeting_invite: { icon: Mail, label: "คำเชิญ", variant: "green" },
  system: { icon: Bell, label: "ระบบ", variant: "gray" },
};

export default function NotificationsPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user) return;
    const list = await store.getNotifications(user.id);
    setItems(list);
  }, [user]);

  useEffect(() => {
    refresh().finally(() => setLoading(false));
  }, [refresh]);

  const markRead = async (id: string) => {
    await store.markNotificationRead(id);
    await refresh();
  };

  const markAll = async () => {
    if (!user) return;
    await store.markAllNotificationsRead(user.id);
    await refresh();
    toast.success("อ่านทั้งหมดแล้ว");
  };

  const unread = items.filter((n) => !n.read).length;

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
        title="การแจ้งเตือน"
        description="แจ้งเตือนก่อนประชุม เอกสารใหม่ และการแก้ไขกำหนดการ"
        action={
          unread > 0 ? (
            <Button variant="outline" onClick={markAll}>
              <CheckCheck className="h-4 w-4" />
              อ่านทั้งหมด
            </Button>
          ) : undefined
        }
      />

      {items.length === 0 ? (
        <Card>
          <EmptyState
            icon={Bell}
            title="ไม่มีการแจ้งเตือน"
            description="เมื่อมีการประชุมหรือเอกสารใหม่ จะแสดงที่นี่"
          />
        </Card>
      ) : (
        <div className="space-y-2">
          {items.map((n) => {
            const meta = typeMeta[n.type];
            const Icon = meta.icon;
            const content = (
              <Card
                className={cn(
                  "transition-colors",
                  !n.read &&
                    "border-brand-200 bg-brand-50/40 dark:border-brand-800 dark:bg-brand-950/20"
                )}
              >
                <CardContent className="flex items-start gap-3">
                  <div
                    className={cn(
                      "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
                      !n.read
                        ? "bg-brand-100 text-brand-600 dark:bg-brand-900/50"
                        : "bg-slate-100 text-slate-500 dark:bg-slate-800"
                    )}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-slate-900 dark:text-white">
                        {n.title}
                      </p>
                      <Badge variant={meta.variant}>{meta.label}</Badge>
                      {!n.read && (
                        <span className="h-2 w-2 rounded-full bg-brand-500" />
                      )}
                    </div>
                    <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                      {n.message}
                    </p>
                    <p className="mt-2 text-xs text-slate-400">
                      {formatDateTime(n.createdAt)}
                    </p>
                  </div>
                </CardContent>
              </Card>
            );

            return (
              <div key={n.id} onClick={() => markRead(n.id)}>
                {n.link ? <Link href={n.link}>{content}</Link> : content}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
