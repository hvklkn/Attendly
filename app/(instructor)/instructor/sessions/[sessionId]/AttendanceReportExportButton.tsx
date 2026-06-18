"use client";

import { Download } from "lucide-react";

export type AttendanceReportCsvRow = {
  studentName: string;
  email: string;
  courseSection: string;
  status: string;
  checkedInAt: string;
  distance: string;
  locationVerification: string;
};

type AttendanceReportExportButtonProps = {
  rows: AttendanceReportCsvRow[];
  fileName: string;
};

const CSV_HEADERS: Array<[keyof AttendanceReportCsvRow, string]> = [
  ["studentName", "Öğrenci adı"],
  ["email", "Email"],
  ["courseSection", "Ders/Şube"],
  ["status", "Durum"],
  ["checkedInAt", "Giriş zamanı"],
  ["distance", "Mesafe"],
  ["locationVerification", "Konum doğrulama sonucu"],
];

function escapeCsvCell(value: string) {
  const normalizedValue = value.replace(/\r?\n/g, " ").trim();
  const escapedValue = normalizedValue.replace(/"/g, '""');

  return /[",\n]/.test(escapedValue) ? `"${escapedValue}"` : escapedValue;
}

function buildCsv(rows: AttendanceReportCsvRow[]) {
  const headerLine = CSV_HEADERS.map(([, label]) => escapeCsvCell(label)).join(
    ",",
  );
  const rowLines = rows.map((row) =>
    CSV_HEADERS.map(([key]) => escapeCsvCell(row[key])).join(","),
  );

  return ["\uFEFF" + headerLine, ...rowLines].join("\n");
}

export function AttendanceReportExportButton({
  rows,
  fileName,
}: AttendanceReportExportButtonProps) {
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
      CSV Export
    </button>
  );
}
