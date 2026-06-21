"use client";

import { useActionState, useState } from "react";
import type { ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { CheckCircle2, Info, MapPin } from "lucide-react";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { SectionCard } from "@/components/ui/SectionCard";
import { routes } from "@/constants/routes";
import { createAdminRoomAction } from "@/lib/admin/room-actions";
import {
  initialAdminRoomCreateActionState,
  type AdminRoomCreateActionState,
  type AdminRoomCreateFormErrors,
  type AdminRoomCreateFormField,
  type AdminRoomCreateFormValues,
} from "@/lib/admin/room-create";

const inputClassName =
  "mt-2 w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 outline-none transition placeholder:text-neutral-400 focus:border-neutral-500";

function getFieldError(
  errors: AdminRoomCreateFormErrors,
  field: AdminRoomCreateFormField,
) {
  return errors[field];
}

function Field({
  id,
  label,
  children,
  description,
  error,
}: {
  id: string;
  label: string;
  children: ReactNode;
  description?: string;
  error?: string;
}) {
  return (
    <div>
      <label htmlFor={id} className="text-sm font-medium text-neutral-700">
        {label}
      </label>
      {children}
      {error ? (
        <p id={`${id}-error`} className="mt-2 text-xs leading-5 text-rose-700">
          {error}
        </p>
      ) : description ? (
        <p className="mt-2 text-xs leading-5 text-neutral-500">{description}</p>
      ) : null}
    </div>
  );
}

type RoomFormAction = (
  previousState: AdminRoomCreateActionState,
  formData: FormData,
) => Promise<AdminRoomCreateActionState>;

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex h-9 items-center justify-center rounded-md bg-neutral-950 px-4 text-sm font-medium text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:bg-neutral-200 disabled:text-neutral-500"
    >
      {pending ? "Kaydediliyor..." : label}
    </button>
  );
}

export function AdminCreateRoomForm({
  action,
  initialValues,
  roomId,
  submitLabel = "Oda Oluştur",
}: {
  action?: RoomFormAction;
  initialValues?: AdminRoomCreateFormValues;
  roomId?: string;
  submitLabel?: string;
}) {
  const [state, formAction] = useActionState(
    action ?? createAdminRoomAction,
    initialValues
      ? {
          ...initialAdminRoomCreateActionState,
          values: initialValues,
        }
      : initialAdminRoomCreateActionState,
  );
  const { values, errors } = state;
  const [latitude, setLatitude] = useState(values.latitude);
  const [longitude, setLongitude] = useState(values.longitude);
  const [locationMessage, setLocationMessage] = useState<string | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isCapturingLocation, setIsCapturingLocation] = useState(false);

  function captureCurrentLocation() {
    setLocationMessage(null);
    setLocationError(null);

    if (!navigator.geolocation) {
      setLocationError("Tarayıcınız konum almayı desteklemiyor.");
      return;
    }

    setIsCapturingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const nextLatitude = position.coords.latitude.toFixed(6);
        const nextLongitude = position.coords.longitude.toFixed(6);
        const accuracy = Number.isFinite(position.coords.accuracy)
          ? Math.round(position.coords.accuracy)
          : null;

        setLatitude(nextLatitude);
        setLongitude(nextLongitude);
        setLocationMessage(
          `Konum alındı: ${nextLatitude}, ${nextLongitude}, doğruluk: ${
            accuracy ?? "belirtilmedi"
          } metre`,
        );
        setIsCapturingLocation(false);
      },
      () => {
        setLocationError(
          "Konum alınamadı. Tarayıcı konum iznini kontrol edip tekrar deneyin.",
        );
        setIsCapturingLocation(false);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 15000,
      },
    );
  }

  return (
    <section className="grid gap-6 xl:grid-cols-[1fr_360px]">
      <form action={formAction} className="grid gap-6">
        {roomId ? <input type="hidden" name="roomId" value={roomId} /> : null}
        {state.status === "error" && state.message ? (
          <div
            role="alert"
            className="rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"
          >
            {state.message}
          </div>
        ) : null}

        <SectionCard
          title="Oda Bilgileri"
          description="Oda adı, kodu ve adresi yoklama oturumu oluştururken görünür."
          actions={
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-neutral-100 text-neutral-600">
              <MapPin className="h-4 w-4" aria-hidden="true" />
            </div>
          }
        >
          <div className="grid gap-5 md:grid-cols-2">
            <Field
              id="name"
              label="Oda Adı"
              error={getFieldError(errors, "name")}
            >
              <input
                id="name"
                name="name"
                type="text"
                required
                placeholder="B201"
                defaultValue={values.name}
                aria-invalid={Boolean(getFieldError(errors, "name"))}
                aria-describedby={
                  getFieldError(errors, "name") ? "name-error" : undefined
                }
                className={inputClassName}
              />
            </Field>

            <Field
              id="code"
              label="Kod"
              description="İsteğe bağlıdır; girilirse kurum içinde benzersiz olmalıdır."
              error={getFieldError(errors, "code")}
            >
              <input
                id="code"
                name="code"
                type="text"
                placeholder="B201"
                defaultValue={values.code}
                aria-invalid={Boolean(getFieldError(errors, "code"))}
                aria-describedby={
                  getFieldError(errors, "code") ? "code-error" : undefined
                }
                className={inputClassName}
              />
            </Field>

            <div className="md:col-span-2">
              <Field
                id="address"
                label="Adres"
                error={getFieldError(errors, "address")}
              >
                <input
                  id="address"
                  name="address"
                  type="text"
                  placeholder="Mühendislik Fakültesi 2. kat"
                  defaultValue={values.address}
                  aria-invalid={Boolean(getFieldError(errors, "address"))}
                  aria-describedby={
                    getFieldError(errors, "address")
                      ? "address-error"
                      : undefined
                  }
                  className={inputClassName}
                />
              </Field>
            </div>

            <div className="md:col-span-2">
              <Field
                id="description"
                label="Açıklama"
                error={getFieldError(errors, "description")}
              >
                <textarea
                  id="description"
                  name="description"
                  rows={3}
                  placeholder="İsteğe bağlı açıklama"
                  defaultValue={values.description}
                  aria-invalid={Boolean(getFieldError(errors, "description"))}
                  aria-describedby={
                    getFieldError(errors, "description")
                      ? "description-error"
                      : undefined
                  }
                  className={inputClassName}
                />
              </Field>
            </div>
          </div>
        </SectionCard>

        <SectionCard
          title="Konum"
          description="Koordinatlar girilirse yoklama geofence yedeği olarak kullanılabilir."
        >
          <div className="mb-5 grid gap-3 rounded-md border border-sky-200 bg-sky-50 p-4 text-sm leading-6 text-sky-900">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p>
                Koordinatları otomatik doldurmak için yalnızca konum izni
                istenir; kamera izni istenmez.
              </p>
              <button
                type="button"
                onClick={captureCurrentLocation}
                disabled={isCapturingLocation}
                className="inline-flex h-9 items-center justify-center rounded-md bg-neutral-950 px-3 text-sm font-medium text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:bg-neutral-300 disabled:text-neutral-500"
              >
                {isCapturingLocation
                  ? "Konum alınıyor..."
                  : "Mevcut konumumu kullan"}
              </button>
            </div>
            {locationMessage ? (
              <p className="font-medium text-emerald-800">{locationMessage}</p>
            ) : null}
            {locationError ? (
              <p className="font-medium text-rose-700">{locationError}</p>
            ) : null}
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            <Field
              id="latitude"
              label="Latitude"
              error={getFieldError(errors, "latitude")}
            >
              <input
                id="latitude"
                name="latitude"
                type="number"
                step="0.000001"
                min="-90"
                max="90"
                placeholder="41.008240"
                value={latitude}
                onChange={(event) => {
                  setLatitude(event.target.value);
                }}
                aria-invalid={Boolean(getFieldError(errors, "latitude"))}
                aria-describedby={
                  getFieldError(errors, "latitude")
                    ? "latitude-error"
                    : undefined
                }
                className={inputClassName}
              />
            </Field>

            <Field
              id="longitude"
              label="Longitude"
              error={getFieldError(errors, "longitude")}
            >
              <input
                id="longitude"
                name="longitude"
                type="number"
                step="0.000001"
                min="-180"
                max="180"
                placeholder="28.978359"
                value={longitude}
                onChange={(event) => {
                  setLongitude(event.target.value);
                }}
                aria-invalid={Boolean(getFieldError(errors, "longitude"))}
                aria-describedby={
                  getFieldError(errors, "longitude")
                    ? "longitude-error"
                    : undefined
                }
                className={inputClassName}
              />
            </Field>

            <Field
              id="allowed-radius-meters"
              label="Radius"
              description="10-1000 metre arasında olmalıdır."
              error={getFieldError(errors, "allowedRadiusMeters")}
            >
              <input
                id="allowed-radius-meters"
                name="allowedRadiusMeters"
                type="number"
                min="10"
                max="1000"
                placeholder="100"
                defaultValue={values.allowedRadiusMeters}
                aria-invalid={Boolean(
                  getFieldError(errors, "allowedRadiusMeters"),
                )}
                aria-describedby={
                  getFieldError(errors, "allowedRadiusMeters")
                    ? "allowed-radius-meters-error"
                    : undefined
                }
                className={inputClassName}
              />
            </Field>
          </div>
        </SectionCard>

        <SectionCard
          title="Durum"
          description="Pasif odalar yeni yoklama oturumu oluşturma listesinde kullanılmaz."
          actions={
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-neutral-100 text-neutral-600">
              <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
            </div>
          }
        >
          <label className="flex items-start gap-3 rounded-md border border-neutral-200 bg-neutral-50 p-4">
            <input
              name="isActive"
              type="checkbox"
              defaultChecked={values.isActive === "on"}
              className="mt-1 h-4 w-4 rounded border-neutral-300 text-neutral-950 focus:ring-neutral-500"
            />
            <span>
              <span className="block text-sm font-medium text-neutral-800">
                Aktif
              </span>
              <span className="mt-1 block text-sm leading-6 text-neutral-600">
                İşaretliyse bu oda yeni yoklama oturumlarında seçilebilir.
              </span>
            </span>
          </label>
        </SectionCard>

        <div className="flex flex-col gap-3 rounded-lg border border-neutral-200 bg-white p-5 shadow-subtle sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-neutral-950">
              Kaydetmeye hazır
            </p>
            <p className="mt-1 text-sm text-neutral-600">
              Oda yalnızca mevcut kurum içinde oluşturulur.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <ButtonLink href={routes.admin.rooms}>İptal</ButtonLink>
            <SubmitButton label={submitLabel} />
          </div>
        </div>
      </form>

      <aside className="grid gap-6 self-start">
        <SectionCard
          title="Konum Kullanımı"
          description="Yoklama oturumunda eğitmen konumu yoksa oda koordinatları kullanılabilir."
          actions={
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-neutral-100 text-neutral-600">
              <Info className="h-4 w-4" aria-hidden="true" />
            </div>
          }
        >
          <p className="text-sm leading-6 text-neutral-600">
            Demo akışında en sağlıklı sonuç için oda koordinatını veya oturum
            oluştururken mevcut konumu kullanın.
          </p>
        </SectionCard>
      </aside>
    </section>
  );
}
