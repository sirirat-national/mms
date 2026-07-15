import type { MeetingMinute } from "@/types";
import { formatDateTime } from "@/lib/utils";

export async function exportMinuteToPdf(minute: MeetingMinute) {
  const { jsPDF } = await import("jspdf");
  const autoTable = (await import("jspdf-autotable")).default;

  const doc = new jsPDF();
  doc.setFontSize(16);
  doc.text("Meeting Minutes / รายงานการประชุม", 14, 20);
  doc.setFontSize(11);
  doc.text(`Meeting: ${minute.meetingTitle}`, 14, 32);
  doc.text(`Date: ${formatDateTime(minute.createdAt)}`, 14, 40);
  doc.text(`Recorded by: ${minute.recordedByName}`, 14, 48);

  doc.setFontSize(12);
  doc.text("Details:", 14, 62);
  const lines = doc.splitTextToSize(minute.content, 180);
  doc.setFontSize(10);
  doc.text(lines, 14, 70);

  let y = 70 + lines.length * 5 + 10;

  autoTable(doc, {
    startY: y,
    head: [["Resolutions / มติที่ประชุม"]],
    body: minute.resolutions.map((r, i) => [`${i + 1}. ${r}`]),
    theme: "striped",
    headStyles: { fillColor: [37, 99, 235] },
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  y = (doc as any).lastAutoTable.finalY + 10;

  autoTable(doc, {
    startY: y,
    head: [["Attendees", "Absentees"]],
    body: [
      [
        minute.attendees.join(", ") || "-",
        minute.absentees.join(", ") || "-",
      ],
    ],
    theme: "grid",
    headStyles: { fillColor: [37, 99, 235] },
  });

  doc.save(`minutes_${minute.id}.pdf`);
}

export async function exportReportToPdf(
  title: string,
  headers: string[],
  rows: string[][]
) {
  const { jsPDF } = await import("jspdf");
  const autoTable = (await import("jspdf-autotable")).default;

  const doc = new jsPDF();
  doc.setFontSize(14);
  doc.text(title, 14, 20);
  doc.setFontSize(9);
  doc.text(`Generated: ${new Date().toLocaleString("th-TH")}`, 14, 28);

  autoTable(doc, {
    startY: 34,
    head: [headers],
    body: rows,
    theme: "striped",
    headStyles: { fillColor: [37, 99, 235] },
  });

  doc.save(`${title.replace(/\s+/g, "_")}.pdf`);
}

export async function exportToExcel(
  sheetName: string,
  headers: string[],
  rows: (string | number)[][]
) {
  const XLSX = await import("xlsx");
  const data = [headers, ...rows];
  const ws = XLSX.utils.aoa_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName.slice(0, 31));
  XLSX.writeFile(wb, `${sheetName.replace(/\s+/g, "_")}.xlsx`);
}
