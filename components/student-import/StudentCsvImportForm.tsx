"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import {
  AlertTriangle,
  CheckCircle2,
  FileUp,
  Info,
  Table,
  Upload,
} from "lucide-react";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { SectionCard } from "@/components/ui/SectionCard";
import type {
  StudentImportCommitState,
  StudentImportPreviewState,
  StudentImportSectionOption,
} from "@/lib/student-import/types";
import {
  initialStudentImportCommitState,
  initialStudentImportPreviewState,
  STUDENT_IMPORT_MAX_FILE_SIZE_BYTES,
  STUDENT_IMPORT_SAMPLE_CSV,
} from "@/lib/student-import/types";

type StudentCsvImportFormProps = {
  backHref: string;
  sections: StudentImportSectionOption[];
  previewAction: (
    previousState: StudentImportPreviewState,
    formData: FormData,
  ) => Promise<StudentImportPreviewState>;
  commitAction: (
    previousState: StudentImportCommitState,
    formData: FormData,
  ) => Promise<StudentImportCommitState>;
};

const selectClassName =
  "mt-2 h-10 w-full rounded-md border border-neutral-300 bg-white px-3 text-sm text-neutral-900 outline-none transition focus:border-neutral-500";

const fileInputClassName =
  "mt-2 w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 file:mr-3 file:rounded-md file:border-0 file:bg-neutral-100 file:px-3 file:py-2 file:text-sm file:font-medium file:text-neutral-700 hover:file:bg-neutral-200";

function formatSection(section: StudentImportSectionOption) {
  const sectionName = section.code
    ? `${section.code} · ${section.name}`
    : section.name;

  return `${section.courseCode} · ${sectionName} (${section.activeEnrollmentCount} öğrenci)`;
}

function formatBytes(value: number) {
  return `${Math.round(value / 1024)} KB`;
}

function PreviewButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex h-9 items-center justify-center gap-2 rounded-md bg-neutral-950 px-4 text-sm font-medium text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:bg-neutral-200 disabled:text-neutral-500"
    >
      <FileUp className="h-4 w-4" aria-hidden="true" />
      {pending ? "Önizleniyor..." : "Önizle"}
    </button>
  );
}

function CommitButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={disabled || pending}
      className="inline-flex h-9 items-center justify-center gap-2 rounded-md bg-neutral-950 px-4 text-sm font-medium text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:bg-neutral-200 disabled:text-neutral-500"
    >
      <Upload className="h-4 w-4" aria-hidden="true" />
      {pending ? "İçe aktarılıyor..." : "İçe Aktar"}
    </button>
  );
}

function SummaryCard({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: number | string;
  tone?: "neutral" | "success" | "warning" | "danger";
}) {
  const toneClassName =
    tone === "success"
      ? "border-emerald-200 bg-emerald-50 text-emerald-800"
      : tone === "warning"
        ? "border-amber-200 bg-amber-50 text-amber-800"
        : tone === "danger"
          ? "border-rose-200 bg-rose-50 text-rose-800"
          : "border-neutral-200 bg-neutral-50 text-neutral-900";

  return (
    <div className={`rounded-md border p-4 ${toneClassName}`}>
      <p className="text-xs font-medium text-current opacity-70">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-current">{value}</p>
    </div>
  );
}

export function StudentCsvImportForm({
  backHref,
  sections,
  previewAction,
  commitAction,
}: StudentCsvImportFormProps) {
  const [previewState, previewFormAction] = useActionState(
    previewAction,
    initialStudentImportPreviewState,
  );
  const [commitState, commitFormAction] = useActionState(
    commitAction,
    initialStudentImportCommitState,
  );
  const hasPreview = previewState.status === "preview";
  const canImport = hasPreview && previewState.summary.validRows > 0;
  const visibleRows = previewState.rows.slice(0, 80);

  return (
    <section className="grid gap-6 xl:grid-cols-[1fr_360px]">
      <div className="grid gap-6">
        <form action={previewFormAction} className="grid gap-6">
          <SectionCard
            title="CSV Dosyası"
            description="Dosya seçin, isteğe bağlı varsayılan şubeyi belirleyin ve önce önizleme alın."
            actions={
              <div className="flex h-9 w-9 items-center justify-center rounded-md bg-neutral-100 text-neutral-600">
                <FileUp className="h-4 w-4" aria-hidden="true" />
              </div>
            }
          >
            {previewState.status === "error" && previewState.message ? (
              <div
                role="alert"
                className="mb-5 rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"
              >
                {previewState.message}
              </div>
            ) : null}

            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <label
                  htmlFor="csv-file"
                  className="text-sm font-medium text-neutral-700"
                >
                  CSV dosyası
                </label>
                <input
                  id="csv-file"
                  name="csvFile"
                  type="file"
                  accept=".csv,text/csv"
                  required
                  className={fileInputClassName}
                />
                <p className="mt-2 text-xs leading-5 text-neutral-500">
                  En fazla {formatBytes(STUDENT_IMPORT_MAX_FILE_SIZE_BYTES)}.
                </p>
              </div>

              <div>
                <label
                  htmlFor="default-section-id"
                  className="text-sm font-medium text-neutral-700"
                >
                  Varsayılan şube
                </label>
                <select
                  id="default-section-id"
                  name="defaultSectionId"
                  defaultValue={previewState.defaultSectionId}
                  className={selectClassName}
                >
                  <option value="">CSV içindeki sectionCode kullanılsın</option>
                  {sections.map((section) => (
                    <option key={section.id} value={section.id}>
                      {formatSection(section)}
                    </option>
                  ))}
                </select>
                <p className="mt-2 text-xs leading-5 text-neutral-500">
                  CSV satırında sectionCode varsa bu seçim yerine o şube
                  kullanılır.
                </p>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap gap-3">
              <PreviewButton />
              <ButtonLink href={backHref}>Geri Dön</ButtonLink>
            </div>
          </SectionCard>
        </form>

        {hasPreview ? (
          <SectionCard
            title="Önizleme"
            description="Geçerli satırlar onaydan sonra içe aktarılır; hatalı satırlar veritabanına yazılmaz."
            actions={
              <form action={commitFormAction}>
                <input
                  type="hidden"
                  name="defaultSectionId"
                  value={previewState.defaultSectionId}
                />
                <textarea
                  name="csvText"
                  value={previewState.csvText}
                  readOnly
                  hidden
                />
                <CommitButton disabled={!canImport} />
              </form>
            }
          >
            <div className="grid gap-3 md:grid-cols-4">
              <SummaryCard
                label="Toplam satır"
                value={previewState.summary.totalRows}
              />
              <SummaryCard
                label="Geçerli satır"
                value={previewState.summary.validRows}
                tone="success"
              />
              <SummaryCard
                label="Hatalı satır"
                value={previewState.summary.invalidRows}
                tone={previewState.summary.invalidRows > 0 ? "danger" : "neutral"}
              />
              <SummaryCard
                label="Tekrarlanan e-posta"
                value={previewState.summary.duplicateEmails}
                tone={
                  previewState.summary.duplicateEmails > 0 ? "warning" : "neutral"
                }
              />
              <SummaryCard
                label="Eksik ad/e-posta"
                value={previewState.summary.missingNameOrEmail}
                tone={
                  previewState.summary.missingNameOrEmail > 0
                    ? "danger"
                    : "neutral"
                }
              />
              <SummaryCard
                label="Geçersiz e-posta"
                value={previewState.summary.invalidEmails}
                tone={
                  previewState.summary.invalidEmails > 0 ? "danger" : "neutral"
                }
              />
              <SummaryCard
                label="Bulunamayan şube kodu"
                value={previewState.summary.unknownSectionCodes}
                tone={
                  previewState.summary.unknownSectionCodes > 0
                    ? "danger"
                    : "neutral"
                }
              />
              <SummaryCard
                label="Mevcut öğrenci"
                value={previewState.summary.existingStudents}
              />
            </div>

            {commitState.status === "success" && commitState.summary ? (
              <div className="mt-5 rounded-md border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
                <div className="flex items-center gap-2 font-medium">
                  <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                  {commitState.message}
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  <SummaryCard
                    label="İçe aktarılan satır"
                    value={commitState.summary.importedRows}
                    tone="success"
                  />
                  <SummaryCard
                    label="Oluşturulan öğrenci"
                    value={commitState.summary.createdStudents}
                    tone="success"
                  />
                  <SummaryCard
                    label="Mevcut öğrenci"
                    value={commitState.summary.existingStudents}
                  />
                  <SummaryCard
                    label="Oluşturulan şube kaydı"
                    value={commitState.summary.createdEnrollments}
                    tone="success"
                  />
                  <SummaryCard
                    label="Aktifleştirilen kayıt"
                    value={commitState.summary.reactivatedEnrollments}
                    tone="warning"
                  />
                  <SummaryCard
                    label="Atlanan tekrar kayıt"
                    value={commitState.summary.skippedDuplicateEnrollments}
                  />
                </div>
              </div>
            ) : commitState.status === "error" && commitState.message ? (
              <div className="mt-5 rounded-md border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
                {commitState.message}
              </div>
            ) : null}

            <div className="mt-5 overflow-hidden rounded-lg border border-neutral-200">
              <div className="max-h-[520px] overflow-auto">
                <table className="w-full min-w-[860px] border-collapse text-left text-sm">
                  <thead className="sticky top-0 bg-neutral-50 text-xs font-medium uppercase tracking-normal text-neutral-500">
                    <tr>
                      <th className="px-4 py-3">Satır</th>
                      <th className="px-4 py-3">Öğrenci</th>
                      <th className="px-4 py-3">E-posta</th>
                      <th className="px-4 py-3">Öğrenci No</th>
                      <th className="px-4 py-3">Şube</th>
                      <th className="px-4 py-3">Durum</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100 bg-white">
                    {visibleRows.map((row) => (
                      <tr key={`${row.rowNumber}-${row.email}`}>
                        <td className="px-4 py-3 text-neutral-500">
                          {row.rowNumber}
                        </td>
                        <td className="px-4 py-3 font-medium text-neutral-950">
                          {row.name || "-"}
                        </td>
                        <td className="px-4 py-3 text-neutral-600">
                          {row.email || "-"}
                        </td>
                        <td className="px-4 py-3 text-neutral-600">
                          {row.studentNo || "-"}
                        </td>
                        <td className="px-4 py-3 text-neutral-600">
                          {row.targetSectionLabel ?? "Şube ataması yok"}
                        </td>
                        <td className="px-4 py-3">
                          {row.status === "valid" ? (
                            <span className="inline-flex items-center gap-2 rounded-md bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700">
                              <CheckCircle2
                                className="h-3.5 w-3.5"
                                aria-hidden="true"
                              />
                              Geçerli
                            </span>
                          ) : (
                            <div className="grid gap-1 text-xs text-rose-700">
                              {row.issues.map((issue) => (
                                <span key={issue}>{issue}</span>
                              ))}
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {previewState.rows.length > visibleRows.length ? (
                <p className="border-t border-neutral-100 bg-neutral-50 px-4 py-3 text-sm text-neutral-600">
                  İlk {visibleRows.length} satır gösteriliyor.
                </p>
              ) : null}
            </div>
          </SectionCard>
        ) : null}
      </div>

      <aside className="grid gap-6 content-start">
        <SectionCard
          title="CSV Formatı"
          description="Zorunlu kolonlar: name ve email. Diğer kolonlar isteğe bağlıdır."
        >
          <pre className="overflow-x-auto rounded-md border border-neutral-800 bg-neutral-950 p-4 text-xs leading-6 text-white shadow-subtle">
            {STUDENT_IMPORT_SAMPLE_CSV}
          </pre>
          <div className="mt-4 grid gap-3 text-sm leading-6 text-neutral-600">
            <p className="flex gap-2">
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-neutral-500" />
              Şifre boşsa demo varsayılan şifresi kullanılır.
            </p>
            <p className="flex gap-2">
              <Table className="mt-0.5 h-4 w-4 shrink-0 text-neutral-500" />
              sectionCode kurumunuzdaki aktif şube koduyla eşleşmelidir.
            </p>
            <p className="flex gap-2">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-neutral-500" />
              Önizleme tamamlanmadan hiçbir satır veritabanına yazılmaz.
            </p>
          </div>
        </SectionCard>

        {sections.length === 0 ? (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-800">
            Aktif şube bulunmuyor. sectionCode olmayan satırlar şubeye
            atanmayacak.
          </div>
        ) : null}
      </aside>
    </section>
  );
}
