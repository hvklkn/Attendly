import { MapPin, Plus, Search } from "lucide-react";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { routes } from "@/constants/routes";
import { requireAdminAuthContext } from "@/lib/admin/auth";
import { getAdminRoomsData } from "@/lib/admin/queries";

type AdminRoomsPageProps = {
  searchParams?: Promise<{
    q?: string | string[];
    created?: string | string[];
  }>;
};

function getSearchValue(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }

  return value ?? "";
}

function formatCoordinates(
  latitude: { toString: () => string } | null,
  longitude: { toString: () => string } | null,
) {
  if (!latitude || !longitude) {
    return "Koordinat yok";
  }

  return `${latitude.toString()}, ${longitude.toString()}`;
}

export default async function AdminRoomsPage({
  searchParams,
}: AdminRoomsPageProps) {
  const authContext = await requireAdminAuthContext();
  const resolvedSearchParams = await searchParams;
  const query = getSearchValue(resolvedSearchParams?.q).trim();
  const created = getSearchValue(resolvedSearchParams?.created) === "1";
  const rooms = await getAdminRoomsData(authContext, { query });

  return (
    <>
      <PageHeader
        eyebrow={authContext.activeOrganization.name}
        title="Odalar"
        description="Yoklama oturumlarında kullanılacak derslik, adres ve konum alanlarını yönetin."
      >
        <ButtonLink
          href={routes.admin.roomCreate}
          variant="primary"
          icon={<Plus className="h-4 w-4" aria-hidden="true" />}
        >
          Oda Oluştur
        </ButtonLink>
      </PageHeader>

      {created ? (
        <div className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
          Oda oluşturuldu.
        </div>
      ) : null}

      <SectionCard
        title="Oda Listesi"
        description="Konum bilgisi olan odalar yoklama geofence yedeği olarak kullanılabilir."
      >
        <form
          action={routes.admin.rooms}
          className="mb-5 grid gap-3 sm:grid-cols-[1fr_140px]"
        >
          <label className="flex items-center gap-2 rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-500">
            <Search className="h-4 w-4" aria-hidden="true" />
            <span className="sr-only">Oda ara</span>
            <input
              name="q"
              defaultValue={query}
              placeholder="Oda, kod veya adres ara"
              className="w-full bg-transparent outline-none placeholder:text-neutral-400"
            />
          </label>
          <button
            type="submit"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-neutral-300 bg-white px-3 text-sm font-medium text-neutral-700 transition hover:border-neutral-400 hover:text-neutral-950"
          >
            <Search className="h-4 w-4" aria-hidden="true" />
            Ara
          </button>
        </form>

        {rooms.length > 0 ? (
          <>
            <div className="hidden overflow-hidden rounded-lg border border-neutral-200 md:block">
              <table className="w-full border-collapse text-left text-sm">
                <thead className="bg-neutral-50 text-xs font-medium uppercase tracking-normal text-neutral-500">
                  <tr>
                    <th className="px-4 py-3">Oda</th>
                    <th className="px-4 py-3">Kod</th>
                    <th className="px-4 py-3">Adres</th>
                    <th className="px-4 py-3">Koordinat</th>
                    <th className="px-4 py-3">Radius</th>
                    <th className="px-4 py-3">Oturum</th>
                    <th className="px-4 py-3">Durum</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 bg-white">
                  {rooms.map((room) => (
                    <tr key={room.id}>
                      <td className="px-4 py-4">
                        <p className="font-medium text-neutral-950">
                          {room.name}
                        </p>
                        <p className="mt-1 text-xs text-neutral-500">
                          {room.description ?? "Açıklama yok"}
                        </p>
                      </td>
                      <td className="px-4 py-4 text-neutral-600">
                        {room.code ?? "Kod yok"}
                      </td>
                      <td className="px-4 py-4 text-neutral-600">
                        {room.address ?? "Adres yok"}
                      </td>
                      <td className="px-4 py-4 text-neutral-600">
                        {formatCoordinates(room.latitude, room.longitude)}
                      </td>
                      <td className="px-4 py-4 text-neutral-600">
                        {room.allowedRadiusMeters
                          ? `${room.allowedRadiusMeters} m`
                          : "Belirtilmedi"}
                      </td>
                      <td className="px-4 py-4 text-neutral-600">
                        {room._count.attendanceSessions}
                      </td>
                      <td className="px-4 py-4">
                        <StatusBadge
                          label={room.isActive ? "Aktif" : "Pasif"}
                          tone={room.isActive ? "success" : "neutral"}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="grid gap-3 md:hidden">
              {rooms.map((room) => (
                <article
                  key={room.id}
                  className="rounded-lg border border-neutral-200 bg-white p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-neutral-950">
                        {room.code ? `${room.code} · ${room.name}` : room.name}
                      </p>
                      <p className="mt-1 text-sm leading-6 text-neutral-600">
                        {room.address ?? "Adres yok"}
                      </p>
                    </div>
                    <StatusBadge
                      label={room.isActive ? "Aktif" : "Pasif"}
                      tone={room.isActive ? "success" : "neutral"}
                    />
                  </div>
                  <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                    <div>
                      <dt className="text-neutral-500">Koordinat</dt>
                      <dd className="mt-1 font-medium text-neutral-900">
                        {formatCoordinates(room.latitude, room.longitude)}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-neutral-500">Radius</dt>
                      <dd className="mt-1 font-medium text-neutral-900">
                        {room.allowedRadiusMeters
                          ? `${room.allowedRadiusMeters} m`
                          : "Belirtilmedi"}
                      </dd>
                    </div>
                  </dl>
                </article>
              ))}
            </div>
          </>
        ) : (
          <EmptyState
            title={query ? "Aramanızla eşleşen oda yok" : "Oda bulunmuyor"}
            description={
              query
                ? "Farklı bir arama terimi deneyin veya aramayı temizleyin."
                : "Yoklama oturumlarında oda ve konum kullanmak için oda oluşturun."
            }
            icon={<MapPin className="h-5 w-5" aria-hidden="true" />}
            actionHref={routes.admin.roomCreate}
            actionLabel="Yeni Oda Ekle"
          />
        )}
      </SectionCard>
    </>
  );
}
