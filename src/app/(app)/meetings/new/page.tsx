"use client";

import { PageHeader } from "@/components/layout/PageHeader";
import { MeetingForm } from "@/components/meetings/MeetingForm";

export default function NewMeetingPage() {
  return (
    <div>
      <PageHeader
        title="สร้างการประชุม"
        description="กำหนดวันเวลา เชิญผู้เข้าร่วม และอัปโหลดเอกสาร"
        backHref="/meetings"
        showBack
      />
      <MeetingForm mode="create" />
    </div>
  );
}
