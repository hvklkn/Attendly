import { redirect } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { SectionCard } from "@/components/ui/SectionCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { loginAction } from "@/lib/auth/actions";
import { getCurrentAuthContext } from "@/lib/auth/context";
import { getRoleHomePath } from "@/lib/auth/roles";

type LoginPageProps = {
  searchParams?: Promise<{
    error?: string;
    registered?: string;
  }>;
};

export const dynamic = "force-dynamic";

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const authContext = await getCurrentAuthContext();

  if (authContext) {
    redirect(getRoleHomePath(authContext.role));
  }

  const params = await searchParams;
  const hasError = params?.error === "invalid";
  const hasRegistered = params?.registered === "1";

  return (
    <div className="w-full">
      <SectionCard>
        <div className="mb-6">
          <StatusBadge label="Veritabanı destekli giriş" tone="info" />
        </div>
        <PageHeader
          title="Giriş"
          description="Attendly çalışma alanınıza e-posta ve şifrenizle giriş yapın."
        />
        {hasError ? (
          <div className="mt-6 rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            E-posta veya şifre hatalı.
          </div>
        ) : null}
        {hasRegistered ? (
          <div className="mt-6 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            Kurum kaydınız oluşturuldu. Giriş yaparak devam edebilirsiniz.
          </div>
        ) : null}
        <form action={loginAction} className="mt-8 space-y-5">
          <div>
            <label
              htmlFor="email"
              className="text-sm font-medium text-neutral-700"
            >
              E-posta
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              placeholder="ad@example.com"
              className="mt-2 w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm outline-none transition placeholder:text-neutral-400 focus:border-neutral-950"
            />
          </div>
          <div>
            <label
              htmlFor="password"
              className="text-sm font-medium text-neutral-700"
            >
              Şifre
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              placeholder="Şifre"
              className="mt-2 w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm outline-none transition placeholder:text-neutral-400 focus:border-neutral-950"
            />
          </div>
          <button
            type="submit"
            className="w-full rounded-md bg-neutral-950 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-neutral-800"
          >
            Devam Et
          </button>
        </form>
      </SectionCard>
    </div>
  );
}
