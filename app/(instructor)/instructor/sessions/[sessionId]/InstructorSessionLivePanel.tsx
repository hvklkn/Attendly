"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  Clock3,
  ListChecks,
  RefreshCw,
  Users,
} from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatCard } from "@/components/ui/StatCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import type { AttendanceReportCsvRow } from "./AttendanceReportExportButton";
import { AttendanceReportExportButton } from "./AttendanceReportExportButton";
import type {
  InstructorSessionLiveData,
  InstructorSessionLiveSummaryStat,
} from "@/lib/instructor/session-live";

type InstructorSessionLivePanelProps = {
  sessionId: string;
  initialData: InstructorSessionLiveData;
};

const POLLING_INTERVAL_MS = 5000;

function getSummaryIcon(key: InstructorSessionLiveSummaryStat["key"]) {
  if (key === "total_registered") {
    return <Users className="h-4 w-4" aria-hidden="true" />;
  }

  if (key === "present") {
    return <CheckCircle2 className="h-4 w-4" aria-hidden="true" />;
  }

  if (key === "late") {
    return <Clock3 className="h-4 w-4" aria-hidden="true" />;
  }

  if (key === "rejected") {
    return <AlertTriangle className="h-4 w-4" aria-hidden="true" />;
  }

  if (key === "absent") {
    return <ListChecks className="h-4 w-4" aria-hidden="true" />;
  }

  return <CalendarClock className="h-4 w-4" aria-hidden="true" />;
}

function getLiveStatusText(data: InstructorSessionLiveData) {
  if (data.shouldPoll) {
    return "Canlı takip aktif";
  }

  if (data.stoppedReason === "closed") {
    return "Oturum kapalı, canlı takip durduruldu.";
  }

  if (data.stoppedReason === "expired") {
    return "Oturum süresi doldu, canlı takip durduruldu.";
  }

  return "Oturum aktif değil, canlı takip beklemede.";
}

function getLiveStatusTone(data: InstructorSessionLiveData) {
  if (data.shouldPoll) return "success" as const;
  if (data.stoppedReason === "closed") return "neutral" as const;
  if (data.stoppedReason === "expired") return "warning" as const;
  return "info" as const;
}

function buildCsvRows(data: InstructorSessionLiveData): AttendanceReportCsvRow[] {
  return data.reportRows.map((row) => ({
    studentName: row.studentName,
    email: row.email,
    courseSection: row.courseSection,
    status: row.statusLabel,
    checkedInAt: row.checkedInAt,
    distance: row.distance,
    locationVerification: row.rejectionReason
      ? `${row.locationVerification} - ${row.rejectionReason}`
      : row.locationVerification,
    securityReason: row.securityReason,
  }));
}

export function InstructorSessionLivePanel({
  sessionId,
  initialData,
}: InstructorSessionLivePanelProps) {
  const [data, setData] = useState(initialData);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const isRequestInFlightRef = useRef(false);

  const refreshLiveData = useCallback(async () => {
    if (isRequestInFlightRef.current) {
      return;
    }

    const abortController = new AbortController();
    abortControllerRef.current = abortController;
    isRequestInFlightRef.current = true;
    setIsRefreshing(true);

    try {
      const response = await fetch(
        `/api/instructor/sessions/${sessionId}/live`,
        {
          cache: "no-store",
          signal: abortController.signal,
        },
      );

      if (!response.ok) {
        throw new Error("Canlı yoklama verisi alınamadı.");
      }

      const nextData = (await response.json()) as InstructorSessionLiveData;
      setData(nextData);
      setErrorMessage(null);
    } catch (error) {
      if (!abortController.signal.aborted) {
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Canlı yoklama verisi alınamadı.",
        );
      }
    } finally {
      if (!abortController.signal.aborted) {
        setIsRefreshing(false);
      }
      isRequestInFlightRef.current = false;
      abortControllerRef.current = null;
    }
  }, [sessionId]);

  useEffect(() => {
    if (!data.shouldPoll) {
      return;
    }

    const intervalId = window.setInterval(() => {
      void refreshLiveData();
    }, POLLING_INTERVAL_MS);

    return () => {
      window.clearInterval(intervalId);
      abortControllerRef.current?.abort();
    };
  }, [data.shouldPoll, refreshLiveData]);

  const csvRows = buildCsvRows(data);

  return (
    <div className="grid gap-6" aria-live="polite">
      <div className="flex flex-col gap-3 rounded-lg border border-neutral-200 bg-white p-4 shadow-subtle sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge
            label={getLiveStatusText(data)}
            tone={getLiveStatusTone(data)}
          />
          {data.shouldPoll ? (
            <StatusBadge
              label={isRefreshing ? "Güncelleniyor" : "Otomatik yenileniyor"}
              tone={isRefreshing ? "warning" : "info"}
            />
          ) : null}
          {errorMessage ? (
            <StatusBadge label="Bağlantı bekleniyor" tone="warning" />
          ) : null}
        </div>
        <div className="flex items-center gap-2 text-sm text-neutral-500">
          <RefreshCw
            className={isRefreshing ? "h-4 w-4 animate-spin" : "h-4 w-4"}
            aria-hidden="true"
          />
          <span>Son güncelleme: {data.generatedAtLabel}</span>
        </div>
      </div>

      {errorMessage ? (
        <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-900">
          {errorMessage} Mevcut veriler gösterilmeye devam ediyor.
        </div>
      ) : null}

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {data.summaryStats.map((stat) => (
          <StatCard
            key={stat.key}
            label={stat.label}
            value={stat.value}
            trend={stat.trend}
            description={stat.description}
            tone={stat.tone}
            icon={getSummaryIcon(stat.key)}
          />
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.85fr_1fr]">
        <SectionCard
          title="Yoklama Özeti"
          description="Kayıtlı yoklama durumlarının canlı dağılımı."
          actions={
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-neutral-100 text-neutral-600">
              <CalendarClock className="h-4 w-4" aria-hidden="true" />
            </div>
          }
        >
          {data.attendanceStatusCounts.length > 0 ? (
            <div className="divide-y divide-neutral-100">
              {data.attendanceStatusCounts.map((item) => (
                <div
                  key={item.status}
                  className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
                >
                  <StatusBadge label={item.label} tone={item.tone} />
                  <span className="text-sm font-semibold text-neutral-950">
                    {item.count}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              title="Henüz yoklama kaydı yok"
              description="Öğrenciler yoklamaya katıldığında durum özeti burada görünecek."
              icon={<ListChecks className="h-5 w-5" aria-hidden="true" />}
              className="min-h-40"
            />
          )}
        </SectionCard>

        <SectionCard
          title="Güvenlik Uyarıları"
          description="Son şüpheli yoklama denemeleri ve reddedilen güvenlik olayları."
          actions={
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-neutral-100 text-neutral-600">
              <AlertTriangle className="h-4 w-4" aria-hidden="true" />
            </div>
          }
        >
          {data.securityAlerts.length > 0 ? (
            <div className="overflow-x-auto rounded-lg border border-neutral-200">
              <table className="w-full min-w-[760px] border-collapse text-left text-sm">
                <thead className="bg-neutral-50 text-xs font-medium uppercase tracking-normal text-neutral-500">
                  <tr>
                    <th className="px-4 py-3">Öğrenci / E-posta</th>
                    <th className="px-4 py-3">Olay tipi</th>
                    <th className="px-4 py-3">Zaman</th>
                    <th className="px-4 py-3">Açıklama</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 bg-white">
                  {data.securityAlerts.map((alert) => (
                    <tr key={alert.id}>
                      <td className="px-4 py-4">
                        <p className="font-medium text-neutral-950">
                          {alert.studentName}
                        </p>
                        <p className="mt-1 text-xs text-neutral-500">
                          {alert.email}
                        </p>
                      </td>
                      <td className="px-4 py-4">
                        <StatusBadge label={alert.eventType} tone="warning" />
                      </td>
                      <td className="px-4 py-4 text-neutral-600">
                        {alert.createdAt}
                      </td>
                      <td className="px-4 py-4 text-neutral-600">
                        {alert.message}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState
              title="Henüz güvenlik uyarısı yok"
              description="Şüpheli yoklama denemeleri oluştuğunda burada listelenecek."
              icon={<AlertTriangle className="h-5 w-5" aria-hidden="true" />}
              className="min-h-40"
            />
          )}
        </SectionCard>
      </section>

      <SectionCard
        title="Yoklama Raporu"
        description="Aktif enrollment listesindeki tüm öğrenciler ve bu oturumdaki yoklama durumları."
        actions={
          <AttendanceReportExportButton
            rows={csvRows}
            fileName={data.csvFileName}
          />
        }
      >
        {data.reportRows.length > 0 ? (
          <>
            <div className="hidden overflow-x-auto rounded-lg border border-neutral-200 lg:block">
              <table className="w-full min-w-[1040px] border-collapse text-left text-sm">
                <thead className="bg-neutral-50 text-xs font-medium uppercase tracking-normal text-neutral-500">
                  <tr>
                    <th className="px-4 py-3">Öğrenci adı</th>
                    <th className="px-4 py-3">E-posta</th>
                    <th className="px-4 py-3">Ders/Şube</th>
                    <th className="px-4 py-3">Durum</th>
                    <th className="px-4 py-3">Giriş zamanı</th>
                    <th className="px-4 py-3">Mesafe</th>
                    <th className="px-4 py-3">Konum doğrulama sonucu</th>
                    <th className="px-4 py-3">Güvenlik nedeni</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 bg-white">
                  {data.reportRows.map((row) => (
                    <tr key={row.enrollmentId}>
                      <td className="px-4 py-4 font-medium text-neutral-950">
                        {row.studentName}
                      </td>
                      <td className="px-4 py-4 text-neutral-600">
                        {row.email}
                      </td>
                      <td className="px-4 py-4 text-neutral-600">
                        {row.courseSection}
                      </td>
                      <td className="px-4 py-4">
                        <StatusBadge
                          label={row.statusLabel}
                          tone={row.statusTone}
                        />
                      </td>
                      <td className="px-4 py-4 text-neutral-600">
                        {row.checkedInAt}
                      </td>
                      <td className="px-4 py-4 text-neutral-600">
                        {row.distance}
                      </td>
                      <td className="px-4 py-4">
                        <div className="grid gap-2">
                          <StatusBadge
                            label={row.locationVerification}
                            tone={row.locationVerificationTone}
                          />
                          {row.rejectionReason ? (
                            <p className="text-xs leading-5 text-neutral-500">
                              {row.rejectionReason}
                            </p>
                          ) : null}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-neutral-600">
                        {row.securityReason}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="grid gap-3 lg:hidden">
              {data.reportRows.map((row) => (
                <article
                  key={row.enrollmentId}
                  className="rounded-lg border border-neutral-200 bg-white p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-medium text-neutral-950">
                        {row.studentName}
                      </p>
                      <p className="mt-1 truncate text-sm text-neutral-500">
                        {row.email}
                      </p>
                    </div>
                    <StatusBadge
                      label={row.statusLabel}
                      tone={row.statusTone}
                    />
                  </div>
                  <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                    <div>
                      <dt className="text-neutral-500">Ders/Şube</dt>
                      <dd className="mt-1 font-medium text-neutral-900">
                        {row.courseSection}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-neutral-500">Giriş zamanı</dt>
                      <dd className="mt-1 font-medium text-neutral-900">
                        {row.checkedInAt}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-neutral-500">Mesafe</dt>
                      <dd className="mt-1 font-medium text-neutral-900">
                        {row.distance}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-neutral-500">
                        Konum doğrulama sonucu
                      </dt>
                      <dd className="mt-1">
                        <div className="grid gap-2">
                          <StatusBadge
                            label={row.locationVerification}
                            tone={row.locationVerificationTone}
                          />
                          {row.rejectionReason ? (
                            <p className="text-xs leading-5 text-neutral-500">
                              {row.rejectionReason}
                            </p>
                          ) : null}
                        </div>
                      </dd>
                    </div>
                    <div>
                      <dt className="text-neutral-500">Güvenlik nedeni</dt>
                      <dd className="mt-1 font-medium text-neutral-900">
                        {row.securityReason}
                      </dd>
                    </div>
                  </dl>
                </article>
              ))}
            </div>
          </>
        ) : (
          <EmptyState
            title="Bu şubede aktif öğrenci yok"
            description="Yoklama raporu oluşturmak için önce öğrenci-şube ataması yapılmalı."
            icon={<Users className="h-5 w-5" aria-hidden="true" />}
          />
        )}
      </SectionCard>
    </div>
  );
}
