import type { MeetingMinute } from "@/types";
import { formatDateTime } from "@/lib/utils";

const PDF_FONT_REGULAR_FILE = "Sarabun-Regular.ttf";
const PDF_FONT_BOLD_FILE = "Sarabun-SemiBold.ttf";
const PDF_FONT_NAME = "Sarabun";

function toBase64(buffer: ArrayBuffer) {
  const bytes = new Uint8Array(buffer);
  const chunkSize = 0x8000;
  let binary = "";
  for (let start = 0; start < bytes.length; start += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(start, start + chunkSize));
  }
  return btoa(binary);
}

async function addThaiFont(doc: import("jspdf").jsPDF) {
  const [regularResponse, boldResponse] = await Promise.all([
    fetch(`/fonts/${PDF_FONT_REGULAR_FILE}`),
    fetch(`/fonts/${PDF_FONT_BOLD_FILE}`),
  ]);
  if (!regularResponse.ok || !boldResponse.ok) {
    throw new Error("ไม่สามารถโหลดฟอนต์ภาษาไทยสำหรับ PDF ได้");
  }

  doc.addFileToVFS(
    PDF_FONT_REGULAR_FILE,
    toBase64(await regularResponse.arrayBuffer())
  );
  doc.addFileToVFS(
    PDF_FONT_BOLD_FILE,
    toBase64(await boldResponse.arrayBuffer())
  );
  doc.addFont(PDF_FONT_REGULAR_FILE, PDF_FONT_NAME, "normal");
  doc.addFont(PDF_FONT_BOLD_FILE, PDF_FONT_NAME, "bold");
  doc.setFont(PDF_FONT_NAME, "normal");
}

export async function exportMinuteToPdf(minute: MeetingMinute) {
  const { jsPDF } = await import("jspdf");
  const autoTable = (await import("jspdf-autotable")).default;

  const doc = new jsPDF();
  await addThaiFont(doc);
  doc.setFont(PDF_FONT_NAME, "bold");
  doc.setFontSize(16);
  doc.text("รายงานการประชุม", 14, 20);
  doc.setFont(PDF_FONT_NAME, "normal");
  doc.setFontSize(11);
  doc.text(`หัวข้อการประชุม: ${minute.meetingTitle || "-"}`, 14, 32);
  doc.text(`วันที่บันทึก: ${formatDateTime(minute.createdAt)}`, 14, 40);
  doc.text(`ผู้บันทึก: ${minute.recordedByName || "-"}`, 14, 48);

  doc.setFont(PDF_FONT_NAME, "bold");
  doc.setFontSize(12);
  doc.text("รายละเอียด:", 14, 62);
  doc.setFont(PDF_FONT_NAME, "normal");
  const lines = doc.splitTextToSize(minute.content?.trim() || "-", 180);
  doc.setFontSize(10);
  doc.text(lines, 14, 70);

  let y = 70 + lines.length * 5 + 10;

  autoTable(doc, {
    startY: y,
    head: [["มติที่ประชุม"]],
    body: minute.resolutions.length
      ? minute.resolutions.map((r, i) => [`${i + 1}. ${r}`])
      : [["-"]],
    theme: "striped",
    styles: {
      font: PDF_FONT_NAME,
      fontStyle: "normal",
      fontSize: 10,
      cellPadding: 3,
      overflow: "linebreak",
    },
    headStyles: {
      fillColor: [37, 99, 235],
      textColor: [255, 255, 255],
      font: PDF_FONT_NAME,
      fontStyle: "bold",
    },
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  y = (doc as any).lastAutoTable.finalY + 10;

  autoTable(doc, {
    startY: y,
    head: [["ผู้เข้าร่วม", "ผู้ไม่เข้าร่วม"]],
    body: [
      [
        minute.attendees.join(", ") || "-",
        minute.absentees.join(", ") || "-",
      ],
    ],
    theme: "grid",
    styles: {
      font: PDF_FONT_NAME,
      fontStyle: "normal",
      fontSize: 10,
      cellPadding: 3,
      overflow: "linebreak",
    },
    headStyles: {
      fillColor: [37, 99, 235],
      textColor: [255, 255, 255],
      font: PDF_FONT_NAME,
      fontStyle: "bold",
    },
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
  await addThaiFont(doc);
  doc.setFont(PDF_FONT_NAME, "bold");
  doc.setFontSize(14);
  doc.text(title, 14, 20);
  doc.setFont(PDF_FONT_NAME, "normal");
  doc.setFontSize(9);
  doc.text(`Generated: ${new Date().toLocaleString("th-TH")}`, 14, 28);

  autoTable(doc, {
    startY: 34,
    head: [headers],
    body: rows,
    theme: "striped",
    styles: { font: PDF_FONT_NAME, fontStyle: "normal" },
    headStyles: {
      fillColor: [37, 99, 235],
      textColor: [255, 255, 255],
      font: PDF_FONT_NAME,
      fontStyle: "bold",
    },
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
