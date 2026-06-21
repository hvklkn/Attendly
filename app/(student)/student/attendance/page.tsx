import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { requireRole } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import {
  formatDateTimeTr,
  getAttendanceRecordStatusLabel,
  getAttendanceSessionStatusLabel,
} from "@/lib/localization";

function getAttendanceTone(status: string) {
  if (status === "PRESENT" || status === "LATE" || status === "MANUAL") {
    return "success" as const;
  }

  if (status === "REJECTED" || status === "ABSENT") {
    return "danger" as const;
  }

  return "neutral" as const;
}

function formatDistance(value: { toString: () => string } | null) {
  if (!value) {
    return "Belirtilmedi";
  }

  return `${Math.round(Number(value.toString()))} metre`;
}

export default async function StudentAttendancePage() {
  const authContext = await requireRole("STUDENT");
  const records = await db.attendanceRecord.findMany({
    where: {
      organizationId: authContext.activeOrganization.id,
      studentUserId: authContext.user.id,
      studentMembershipId: authContext.membership.id,
    },
    orderBy: [
      {
        checkedInAt: "desc",
      },
      {
        createdAt: "desc",
      },
    ],
    take: 25,
    select: {
      id: true,
      status: true,
      checkedInAt: true,
      createdAt: true,
      distanceMeters: true,
      rejectionReason: true,
      attendanceSession: {
        select: {
          title: true,
          startTime: true,
          status: true,
          section: {
            select: {
              name: true,
              code: true,
              course: {
                select: {
                  code: true,
                  title: true,
                },
              },
            },
          },
        },
      },
    },
  });

  return (
    <>
      <PageHeader
        eyebrow={authContext.activeOrganization.name}
        title="Yoklama Geçmişi"
        description="Katıldığınız yoklama oturumları ve doğrulama sonuçları."
      />

      <SectionCard
        title="Kayıtlarım"
        description="Son yoklama kayıtlarınız, durumunuz ve konum mesafeniz."
      >
        {records.length > 0 ? (
          <div className="overflow-x-auto rounded-lg border border-neutral-200">
            <table className="w-full min-w-[760px] border-collapse text-left text-sm">
              <thead className="bg-neutral-50 text-xs font-medium uppercase tracking-normal text-neutral-500">
                <tr>
                  <th className="px-4 py-3">Ders/Şube</th>
                  <th className="px-4 py-3">Oturum</th>
                  <th className="px-4 py-3">Durum</th>
                  <th className="px-4 py-3">Zaman</th>
                  <th className="px-4 py-3">Mesafe</th>
                  <th className="px-4 py-3">Açıklama</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 bg-white">
                {records.map((record) => {
                  const section = record.attendanceSession.section;
                  const sectionLabel = section.code
                    ? `${section.course.code} · ${section.code}`
                    : `${section.course.code} · ${section.name}`;

                  return (
                    <tr key={record.id}>
                      <td className="px-4 py-4">
                        <p className="font-medium text-neutral-950">
                          {sectionLabel}
                        </p>
                        <p className="mt-1 text-xs text-neutral-500">
                          {section.course.title}
                        </p>
                      </td>
                      <td className="px-4 py-4 text-neutral-600">
                        <p>{record.attendanceSession.title}</p>
                        <p className="mt-1 text-xs text-neutral-500">
                          {getAttendanceSessionStatusLabel(
                            record.attendanceSession.status,
                          )}
                        </p>
                      </td>
                      <td className="px-4 py-4">
                        <StatusBadge
                          label={getAttendanceRecordStatusLabel(record.status)}
                          tone={getAttendanceTone(record.status)}
                        />
                      </td>
                      <td className="px-4 py-4 text-neutral-600">
                        {formatDateTimeTr(
                          record.checkedInAt ?? record.createdAt,
                        )}
                      </td>
                      <td className="px-4 py-4 text-neutral-600">
                        {formatDistance(record.distanceMeters)}
                      </td>
                      <td className="px-4 py-4 text-neutral-600">
                        {record.rejectionReason ?? "Konum doğrulandı"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            title="Yoklama kaydı yok"
            description="QR ile yoklamaya katıldığınızda kayıtlarınız burada görünecek."
          />
        )}
      </SectionCard>
    </>
  );
}
