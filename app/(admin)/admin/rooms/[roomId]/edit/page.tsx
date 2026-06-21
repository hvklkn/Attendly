import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { routes } from "@/constants/routes";
import {
  getAdminOrganizationId,
  requireAdminAuthContext,
} from "@/lib/admin/auth";
import { updateAdminRoomAction } from "@/lib/admin/room-actions";
import { db } from "@/lib/db";
import { AdminCreateRoomForm } from "../../new/AdminCreateRoomForm";

type AdminRoomEditPageProps = {
  params: Promise<{
    roomId: string;
  }>;
};

function decimalToInputValue(value: { toString: () => string } | null) {
  return value?.toString() ?? "";
}

export default async function AdminRoomEditPage({
  params,
}: AdminRoomEditPageProps) {
  const [{ roomId }, authContext] = await Promise.all([
    params,
    requireAdminAuthContext(),
  ]);
  const room = await db.room.findFirst({
    where: {
      id: roomId,
      organizationId: getAdminOrganizationId(authContext),
    },
    select: {
      id: true,
      name: true,
      code: true,
      description: true,
      address: true,
      latitude: true,
      longitude: true,
      allowedRadiusMeters: true,
      isActive: true,
    },
  });

  if (!room) {
    notFound();
  }

  return (
    <>
      <PageHeader
        eyebrow={authContext.activeOrganization.name}
        title="Oda Düzenle"
        description="Oda bilgilerini, konum koordinatlarını ve aktiflik durumunu güncelleyin."
      >
        <ButtonLink
          href={routes.admin.rooms}
          icon={<ArrowLeft className="h-4 w-4" aria-hidden="true" />}
        >
          Odalara Dön
        </ButtonLink>
        <StatusBadge
          label={room.isActive ? "Aktif" : "Pasif"}
          tone={room.isActive ? "success" : "neutral"}
        />
      </PageHeader>

      {!room.isActive ? (
        <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-900">
          Bu kayıt pasif olduğu için yeni işlemlerde kullanılamaz.
        </div>
      ) : null}

      <AdminCreateRoomForm
        action={updateAdminRoomAction}
        roomId={room.id}
        submitLabel="Odayı Güncelle"
        initialValues={{
          name: room.name,
          code: room.code ?? "",
          description: room.description ?? "",
          address: room.address ?? "",
          latitude: decimalToInputValue(room.latitude),
          longitude: decimalToInputValue(room.longitude),
          allowedRadiusMeters:
            room.allowedRadiusMeters === null
              ? ""
              : String(room.allowedRadiusMeters),
          isActive: room.isActive ? "on" : "",
        }}
      />
    </>
  );
}
