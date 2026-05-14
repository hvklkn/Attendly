import { redirect } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { getCurrentAuthContext } from "@/lib/auth/context";
import { getRoleHomePath } from "@/lib/auth/roles";
import { RegisterForm } from "./RegisterForm";

export const dynamic = "force-dynamic";

export default async function RegisterPage() {
  const authContext = await getCurrentAuthContext();

  if (authContext) {
    redirect(getRoleHomePath(authContext.role));
  }

  return (
    <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:px-6 lg:px-8">
      <PageHeader
        eyebrow="Kurum başlangıcı"
        title="Kurumunuzu Attendly ile başlatın"
        description="Okul, kurs veya şirketiniz için QR ve konum doğrulamalı yoklama sisteminizi oluşturun."
      />
      <RegisterForm />
    </div>
  );
}
