"use client";

import { PageHeader } from "@/components/layout/PageHeader";
import { MeetingForm } from "@/components/meetings/MeetingForm";
import { store } from "@/lib/store";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { Meeting } from "@/types";

export default function EditMeetingPage() {
  const params = useParams();
  const router = useRouter();
  const [meeting, setMeeting] = useState<Meeting | null>(null);

  useEffect(() => {
    (async () => {
      const m = await store.getMeeting(params.id as string);
      if (!m) {
        router.replace("/meetings");
        return;
      }
      setMeeting(m);
    })();
  }, [params.id, router]);

  if (!meeting) {
    return (
      <div className="flex justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-200 border-t-brand-600" />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="แก้ไขการประชุม"
        description={meeting.title}
        backHref={`/meetings/${meeting.id}`}
        showBack
      />
      <MeetingForm mode="edit" meeting={meeting} />
    </div>
  );
}
