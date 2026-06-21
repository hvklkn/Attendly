import { ArrowLeft } from "lucide-react";
import { ButtonLink } from "@/components/ui/ButtonLink";
import { ForgotPasswordForm } from "@/components/password/ForgotPasswordForm";
import { routes } from "@/constants/routes";

export const dynamic = "force-dynamic";

export default function ForgotPasswordPage() {
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
      <ForgotPasswordForm />
    </div>
  );
}
