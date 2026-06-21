import { ArrowLeft, AlertTriangle } from "lucide-react";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { EmptyState } from "@/components/ui/EmptyState";
import { ResetPasswordForm } from "@/components/password/ResetPasswordForm";
import { routes } from "@/constants/routes";
import {
  getPasswordResetStatusMessage,
  getPasswordResetTokenStatus,
} from "@/lib/auth/password-management";

type ResetPasswordPageProps = {
  searchParams?: Promise<{
    token?: string | string[];
  }>;
};

function getParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

export const dynamic = "force-dynamic";

export default async function ResetPasswordPage({
  searchParams,
}: ResetPasswordPageProps) {
  const params = await searchParams;
  const token = getParam(params?.token).trim();
  const tokenStatus = await getPasswordResetTokenStatus(token);

  return (
    <div className="w-full">
      <div className="mb-4">
        <ButtonLink
          href={routes.public.login}
          icon={<ArrowLeft className="h-4 w-4" aria-hidden="true" />}
        >
          Girişe Dön
        </ButtonLink>
      </div>
      {tokenStatus.status === "valid" ? (
        <ResetPasswordForm token={token} />
      ) : (
        <EmptyState
          title="Bağlantı kullanılamıyor"
          description={getPasswordResetStatusMessage(tokenStatus.status)}
          icon={<AlertTriangle className="h-5 w-5" aria-hidden="true" />}
          actionHref={routes.public.forgotPassword}
          actionLabel="Yeni Bağlantı İste"
        />
      )}
    </div>
  );
}
