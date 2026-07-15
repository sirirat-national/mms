"use client";

import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { store } from "@/lib/store";
import { formatDateTime, categoryLabels } from "@/lib/utils";
import type { Meeting, CloudDocument, MeetingMinute } from "@/types";
import { Calendar, Cloud, ClipboardList, Search } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";

function SearchInner() {
  const searchParams = useSearchParams();
  const [q, setQ] = useState(searchParams.get("q") ?? "");
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [documents, setDocuments] = useState<CloudDocument[]>([]);
  const [minutes, setMinutes] = useState<MeetingMinute[]>([]);

  useEffect(() => {
    (async () => {
      const [m, d, min] = await Promise.all([
        store.getMeetings(),
        store.getDocuments(),
        store.getMinutes(),
      ]);
      setMeetings(m);
      setDocuments(d);
      setMinutes(min);
    })();
  }, []);

  useEffect(() => {
    setQ(searchParams.get("q") ?? "");
  }, [searchParams]);

  const query = q.trim().toLowerCase();

  const results = useMemo(() => {
    if (!query) {
      return { meetings: [], documents: [], minutes: [] };
    }
    return {
      meetings: meetings.filter(
        (m) =>
          m.title.toLowerCase().includes(query) ||
          m.description.toLowerCase().includes(query) ||
          m.location?.toLowerCase().includes(query)
      ),
      documents: documents.filter(
        (d) =>
          d.name.toLowerCase().includes(query) ||
          categoryLabels[d.category].toLowerCase().includes(query)
      ),
      minutes: minutes.filter(
        (m) =>
          m.meetingTitle.toLowerCase().includes(query) ||
          m.content.toLowerCase().includes(query) ||
          m.resolutions.some((r) => r.toLowerCase().includes(query))
      ),
    };
  }, [query, meetings, documents, minutes]);

  const total =
    results.meetings.length +
    results.documents.length +
    results.minutes.length;

  return (
    <div>
      <PageHeader
        title="ค้นหา"
        description="ค้นหาการประชุม เอกสาร และรายงานการประชุม"
      />

      <Card className="mb-6">
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            <Input
              className="h-12 pl-11 text-base"
              placeholder="พิมพ์คำค้นหา..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
              autoFocus
            />
          </div>
          {query && (
            <p className="mt-3 text-sm text-slate-500">
              พบ {total} รายการ สำหรับ &quot;{q}&quot;
            </p>
          )}
        </CardContent>
      </Card>

      {!query ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-slate-400">
            พิมพ์คำค้นหาเพื่อเริ่มต้น
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-brand-600" />
                การประชุม ({results.meetings.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 !pt-0">
              {results.meetings.length === 0 ? (
                <p className="py-4 text-sm text-slate-400">ไม่พบ</p>
              ) : (
                results.meetings.map((m) => (
                  <Link
                    key={m.id}
                    href={`/meetings/${m.id}`}
                    className="block rounded-lg border border-slate-100 p-3 hover:bg-slate-50 dark:border-slate-800"
                  >
                    <p className="font-medium">{m.title}</p>
                    <p className="text-xs text-slate-500">
                      {formatDateTime(m.startAt)}
                    </p>
                  </Link>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Cloud className="h-4 w-4 text-brand-600" />
                เอกสาร ({results.documents.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 !pt-0">
              {results.documents.length === 0 ? (
                <p className="py-4 text-sm text-slate-400">ไม่พบ</p>
              ) : (
                results.documents.map((d) => (
                  <Link
                    key={d.id}
                    href="/minutes"
                    className="flex items-center justify-between rounded-lg border border-slate-100 p-3 hover:bg-slate-50 dark:border-slate-800"
                  >
                    <p className="font-medium">{d.name}</p>
                    <Badge variant="blue">{categoryLabels[d.category]}</Badge>
                  </Link>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ClipboardList className="h-4 w-4 text-brand-600" />
                รายงานการประชุม ({results.minutes.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 !pt-0">
              {results.minutes.length === 0 ? (
                <p className="py-4 text-sm text-slate-400">ไม่พบ</p>
              ) : (
                results.minutes.map((m) => (
                  <Link
                    key={m.id}
                    href="/minutes"
                    className="block rounded-lg border border-slate-100 p-3 hover:bg-slate-50 dark:border-slate-800"
                  >
                    <p className="font-medium">{m.meetingTitle}</p>
                    <p className="line-clamp-1 text-xs text-slate-500">
                      {m.content}
                    </p>
                  </Link>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense>
      <SearchInner />
    </Suspense>
  );
}
