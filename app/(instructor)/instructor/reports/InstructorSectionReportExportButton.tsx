"use client";

import { Download } from "lucide-react";
import type { InstructorSectionReportStudentRow } from "@/lib/instructor/reports";

type InstructorSectionReportExportButtonProps = {
  rows: InstructorSectionReportStudentRow[];
  fileName: string;
};

const CSV_HEADERS: Array<[keyof InstructorSectionReportStudentRow, string]> = [
  ["studentName", "Öğrenci adı"],
  ["email", "Email"],
  ["sectionLabel", "Kayıtlı olduğu şube"],
  ["totalSessions", "Toplam oturum"],
  ["presentCount", "Katıldı"],
  ["lateCount", "Geç katıldı"],
  ["absentCount", "Katılmadı"],
  ["rejectedCount", "Reddedilen"],
  ["attendanceRate", "Devam oranı %"],
  ["lastAttendanceAt", "Son katılım zamanı"],
];

function escapeCsvCell(value: string | number) {
  const normalizedValue = String(value).replace(/\r?\n/g, " ").trim();
  const escapedValue = normalizedValue.replace(/"/g, '""');

  return /[",\n]/.test(escapedValue) ? `"${escapedValue}"` : escapedValue;
}

function buildCsv(rows: InstructorSectionReportStudentRow[]) {
  const headerLine = CSV_HEADERS.map(([, label]) => escapeCsvCell(label)).join(
    ",",
  );
  const rowLines = rows.map((row) =>
    CSV_HEADERS.map(([key]) => escapeCsvCell(row[key])).join(","),
  );

  return ["\uFEFF" + headerLine, ...rowLines].join("\n");
}

export function InstructorSectionReportExportButton({
  rows,
  fileName,
}: InstructorSectionReportExportButtonProps) {
  function handleExport() {
    const csv = buildCsv(rows);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");

    anchor.href = url;
    anchor.download = fileName;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <button
      type="button"
      onClick={handleExport}
      disabled={rows.length === 0}
      className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-neutral-300 bg-white px-3 text-sm font-medium text-neutral-700 transition hover:border-neutral-400 hover:text-neutral-950 disabled:cursor-not-allowed disabled:border-neutral-200 disabled:bg-neutral-100 disabled:text-neutral-400"
    >
      <Download className="h-4 w-4" aria-hidden="true" />
      CSV İndir
    </button>
  );
}
