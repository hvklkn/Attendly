import Link from "next/link";
import { routes } from "@/constants/routes";
import { siteConfig } from "@/config/site";

export function PublicFooter() {
  return (
    <footer className="border-t border-neutral-200 bg-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-8 text-sm text-neutral-500 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
        <p>{siteConfig.name} yoklama yönetimi.</p>
        <div className="flex gap-4">
          <Link href={routes.public.privacy} className="hover:text-neutral-950">
            Gizlilik
          </Link>
          <Link href={routes.public.terms} className="hover:text-neutral-950">
            Koşullar
          </Link>
        </div>
      </div>
    </footer>
  );
}
