"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Building2, FileDown, MapPin, QrCode, ShieldCheck, Upload } from "lucide-react";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { registerOrganizationAdminAction } from "@/lib/onboarding/actions";
import {
  initialRegisterActionState,
  organizationTypeOptions,
  type RegisterFormErrors,
  type RegisterFormField,
} from "@/lib/onboarding/register-shared";

const inputClassName =
  "mt-2 w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 outline-none transition placeholder:text-neutral-400 focus:border-neutral-500 disabled:cursor-not-allowed disabled:bg-neutral-50 disabled:text-neutral-500";

const selectClassName =
  "mt-2 w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 outline-none transition focus:border-neutral-500";

const onboardingBullets = [
  {
    title: "QR ile hızlı yoklama",
    description: "Öğretmenler canlı QR kodu başlatır, öğrenciler saniyeler içinde yoklamaya katılır.",
    icon: QrCode,
  },
  {
    title: "Konum doğrulamasıyla güvenli katılım",
    description: "Konum sınırı temeliyle yoklama, yalnızca doğru alanda bulunan öğrenciler için hazırlanır.",
    icon: MapPin,
  },
  {
    title: "CSV ile öğrenci aktarımı",
    description: "Öğrenci listelerini toplu aktarma akışı için kurum yapınız hazır olur.",
    icon: Upload,
  },
  {
    title: "Yoklama raporlarını dışa aktarın",
    description: "Kurum yöneticileri yoklama sonuçlarını raporlamaya uygun şekilde takip eder.",
    icon: FileDown,
  },
] as const;

function getFieldError(
  errors: RegisterFormErrors,
  field: RegisterFormField,
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
  children: React.ReactNode;
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

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex h-10 w-full items-center justify-center rounded-md bg-neutral-950 px-4 text-sm font-medium text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:bg-neutral-200 disabled:text-neutral-500"
    >
      {pending ? "Kurum oluşturuluyor..." : "Kurumumu Başlat"}
    </button>
  );
}

export function RegisterForm() {
  const [state, formAction] = useActionState(
    registerOrganizationAdminAction,
    initialRegisterActionState,
  );
  const { values, errors } = state;

  return (
    <section className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
      <SectionCard
        title="Kurum Bilgileri"
        description="Kurumunuzu ve ilk kurum yöneticisi hesabınızı oluşturun."
        actions={<StatusBadge label="Ücretsiz başlangıç" tone="success" />}
      >
        {state.status === "error" && state.message ? (
          <div className="mb-5 rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {state.message}
          </div>
        ) : null}

        <form action={formAction} className="grid gap-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              id="organizationName"
              label="Kurum adı"
              error={getFieldError(errors, "organizationName")}
            >
              <input
                id="organizationName"
                name="organizationName"
                defaultValue={values.organizationName}
                required
                placeholder="Örn. Atatürk Anadolu Lisesi"
                className={inputClassName}
                aria-describedby={
                  errors.organizationName
                    ? "organizationName-error"
                    : undefined
                }
              />
            </Field>

            <Field
              id="organizationType"
              label="Kurum tipi"
              error={getFieldError(errors, "organizationType")}
            >
              <select
                id="organizationType"
                name="organizationType"
                defaultValue={values.organizationType}
                required
                className={selectClassName}
                aria-describedby={
                  errors.organizationType
                    ? "organizationType-error"
                    : undefined
                }
              >
                <option value="">Seçin</option>
                {organizationTypeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </Field>

            <Field
              id="city"
              label="Şehir"
              description="İsteğe bağlıdır; başlangıç notlarında saklanır."
              error={getFieldError(errors, "city")}
            >
              <input
                id="city"
                name="city"
                defaultValue={values.city}
                placeholder="İstanbul"
                className={inputClassName}
                aria-describedby={errors.city ? "city-error" : undefined}
              />
            </Field>

            <Field
              id="slug"
              label="Kurum kısa adı"
              description="Boş bırakırsanız kurum adından otomatik oluşturulur."
              error={getFieldError(errors, "slug")}
            >
              <input
                id="slug"
                name="slug"
                defaultValue={values.slug}
                placeholder="ataturk-anadolu"
                className={inputClassName}
                aria-describedby={errors.slug ? "slug-error" : undefined}
              />
            </Field>
          </div>

          <div className="border-t border-neutral-100 pt-6">
            <div className="mb-4 flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-neutral-100 text-neutral-600">
                <ShieldCheck className="h-4 w-4" aria-hidden="true" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-neutral-950">
                  İlk Kurum Yöneticisi
                </h2>
                <p className="text-xs leading-5 text-neutral-500">
                  Bu hesap Kurum Yöneticisi olarak tüm kuruma erişir.
                </p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                id="adminName"
                label="Ad soyad"
                error={getFieldError(errors, "adminName")}
              >
                <input
                  id="adminName"
                  name="adminName"
                  defaultValue={values.adminName}
                  required
                  autoComplete="name"
                  placeholder="Ayşe Yılmaz"
                  className={inputClassName}
                  aria-describedby={
                    errors.adminName ? "adminName-error" : undefined
                  }
                />
              </Field>

              <Field
                id="email"
                label="E-posta"
                error={getFieldError(errors, "email")}
              >
                <input
                  id="email"
                  name="email"
                  type="email"
                  defaultValue={values.email}
                  required
                  autoComplete="email"
                  placeholder="ad@kurum.com"
                  className={inputClassName}
                  aria-describedby={errors.email ? "email-error" : undefined}
                />
              </Field>

              <Field
                id="password"
                label="Şifre"
                description="En az 8 karakter kullanın."
                error={getFieldError(errors, "password")}
              >
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  autoComplete="new-password"
                  placeholder="Şifre"
                  className={inputClassName}
                  aria-describedby={
                    errors.password ? "password-error" : undefined
                  }
                />
              </Field>

              <Field
                id="passwordConfirm"
                label="Şifre tekrar"
                error={getFieldError(errors, "passwordConfirm")}
              >
                <input
                  id="passwordConfirm"
                  name="passwordConfirm"
                  type="password"
                  required
                  autoComplete="new-password"
                  placeholder="Şifreyi tekrar girin"
                  className={inputClassName}
                  aria-describedby={
                    errors.passwordConfirm
                      ? "passwordConfirm-error"
                      : undefined
                  }
                />
              </Field>
            </div>
          </div>

          <SubmitButton />
        </form>
      </SectionCard>

      <aside className="grid content-start gap-4 rounded-lg border border-neutral-200 bg-white p-5 shadow-subtle">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-neutral-950 text-white">
            <Building2 className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-neutral-950">
              Kurumunuz için hazır temel
            </h2>
            <p className="mt-1 text-sm leading-6 text-neutral-600">
              Kayıt sonrası yönetim paneline geçer, öğretmen ve öğrenci
              akışlarını kurumunuza göre yapılandırmaya başlarsınız.
            </p>
          </div>
        </div>

        <div className="grid gap-3">
          {onboardingBullets.map((item) => {
            const Icon = item.icon;

            return (
              <div
                key={item.title}
                className="flex gap-3 rounded-md border border-neutral-100 bg-neutral-50 p-3"
              >
                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-white text-neutral-700">
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-neutral-950">
                    {item.title}
                  </h3>
                  <p className="mt-1 text-xs leading-5 text-neutral-600">
                    {item.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </aside>
    </section>
  );
}
